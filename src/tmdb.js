'use strict';

const axios = require('axios');
const axiosRetry = require('axios-retry').default;
const NodeCache = require('node-cache');

const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p';

// ── Cache: 24-hour TTL, check for expired keys every 30 min ─────────────────
const cache = new NodeCache({ stdTTL: 86400, checkperiod: 1800 });

// ── Axios instance with automatic retry ─────────────────────────────────────
const client = axios.create({
  baseURL: TMDB_BASE,
  timeout: 10000,
});

axiosRetry(client, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (err) =>
    axiosRetry.isNetworkOrIdempotentRequestError(err) ||
    (err.response && err.response.status >= 500),
});

function getApiKey() {
  const key = process.env.TMDB_API_KEY || '6e3bf0051772c7cb1bee3972053a2d6e';
  if (!key) throw new Error('TMDB_API_KEY is not set');
  return key;
}

async function tmdbGet(path, params = {}, cacheKey) {
  const key = cacheKey || `${path}:${JSON.stringify(params)}`;

  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const resp = await client.get(path, {
    params: { api_key: getApiKey(), ...params },
  });

  cache.set(key, resp.data);
  return resp.data;
}

// ── Image helpers ────────────────────────────────────────────────────────────
function poster(path, size = 'w500') {
  return path ? `${IMG_BASE}/${size}${path}` : null;
}

function backdrop(path, size = 'w1280') {
  return path ? `${IMG_BASE}/${size}${path}` : null;
}

async function getLogo(tmdbId, mediaType, lang = 'en') {
  try {
    const data = await tmdbGet(`/${mediaType}/${tmdbId}/images`, { include_image_language: `${lang},en,null` });
    const logos = data.logos || [];
    // prefer SVG → PNG in requested language, then any language
    const pick =
      logos.find((l) => l.iso_639_1 === lang && l.file_path.endsWith('.svg')) ||
      logos.find((l) => l.iso_639_1 === lang) ||
      logos.find((l) => l.iso_639_1 === 'en') ||
      logos[0];
    return pick ? `${IMG_BASE}/w500${pick.file_path}` : null;
  } catch {
    return null;
  }
}

// ── Genre cache ──────────────────────────────────────────────────────────────
async function getGenreMap(mediaType, lang = 'en') {
  const key = `genre_map:${mediaType}:${lang}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const data = await tmdbGet(`/genre/${mediaType}/list`, { language: lang });
  const map = {};
  (data.genres || []).forEach((g) => { map[g.id] = g.name; });
  cache.set(key, map);
  return map;
}

// ── Credits helper ───────────────────────────────────────────────────────────
function topCast(credits, limit = 10) {
  return (credits?.cast || [])
    .slice(0, limit)
    .map((p) => ({
      id: `tmdb_person_${p.id}`,
      name: p.name,
      role: p.character,
      thumbnail: poster(p.profile_path, 'w185'),
    }));
}

function crew(credits, jobs = ['Director', 'Creator', 'Executive Producer']) {
  return (credits?.crew || [])
    .filter((p) => jobs.includes(p.job))
    .slice(0, 5)
    .map((p) => ({
      id: `tmdb_person_${p.id}`,
      name: p.name,
      role: p.job,
      thumbnail: poster(p.profile_path, 'w185'),
    }));
}

// ── Exported fetchers ────────────────────────────────────────────────────────
async function fetchMovieDetail(tmdbId, lang = 'en') {
  const [detail, credits, logo] = await Promise.all([
    tmdbGet(`/movie/${tmdbId}`, { language: lang, append_to_response: 'credits,videos,external_ids' }),
    tmdbGet(`/movie/${tmdbId}/credits`, { language: lang }),
    getLogo(tmdbId, 'movie', lang),
  ]);
  return { detail, credits, logo };
}

async function fetchSeriesDetail(tmdbId, lang = 'en') {
  const [detail, credits, logo] = await Promise.all([
    tmdbGet(`/tv/${tmdbId}`, { language: lang, append_to_response: 'credits,videos,external_ids,content_ratings' }),
    tmdbGet(`/tv/${tmdbId}/credits`, { language: lang }),
    getLogo(tmdbId, 'tv', lang),
  ]);
  return { detail, credits, logo };
}

async function fetchCatalog(endpoint, params = {}) {
  return tmdbGet(endpoint, params);
}

async function searchMovies(query, lang = 'en', page = 1) {
  return tmdbGet('/search/movie', { query, language: lang, page });
}

async function searchSeries(query, lang = 'en', page = 1) {
  return tmdbGet('/search/tv', { query, language: lang, page });
}

module.exports = {
  fetchMovieDetail,
  fetchSeriesDetail,
  fetchCatalog,
  searchMovies,
  searchSeries,
  getGenreMap,
  poster,
  backdrop,
  topCast,
  crew,
};
