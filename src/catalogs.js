'use strict';

const tmdb = require('./tmdb');

const PAGE_SIZE = 20; // TMDB default

// Map our catalog IDs → TMDB endpoints
const CATALOG_MAP = {
  tmdb_trending_movies:  { endpoint: '/trending/movie/week',  type: 'movie'  },
  tmdb_popular_movies:   { endpoint: '/movie/popular',        type: 'movie'  },
  tmdb_top_movies:       { endpoint: '/movie/top_rated',      type: 'movie'  },
  tmdb_upcoming_movies:  { endpoint: '/movie/upcoming',       type: 'movie'  },
  tmdb_trending_series:  { endpoint: '/trending/tv/week',     type: 'series' },
  tmdb_popular_series:   { endpoint: '/tv/popular',           type: 'series' },
  tmdb_top_series:       { endpoint: '/tv/top_rated',         type: 'series' },
  tmdb_airing_today:     { endpoint: '/tv/airing_today',      type: 'series' },
};

function stremioPage(skip) {
  // Stremio sends skip=0,20,40… → TMDB page=1,2,3…
  return Math.floor((parseInt(skip) || 0) / PAGE_SIZE) + 1;
}

function toMovieMeta(m) {
  return {
    id: `tmdb_movie_${m.id}`,
    type: 'movie',
    name: m.title || m.original_title,
    poster: tmdb.poster(m.poster_path),
    background: tmdb.backdrop(m.backdrop_path),
    year: m.release_date ? parseInt(m.release_date.slice(0, 4)) : undefined,
    imdbRating: m.vote_average ? m.vote_average.toFixed(1) : undefined,
    description: m.overview,
    genres: m.genre_ids ? m.genre_ids.map(String) : [],
  };
}

function toSeriesMeta(s) {
  return {
    id: `tmdb_series_${s.id}`,
    type: 'series',
    name: s.name || s.original_name,
    poster: tmdb.poster(s.poster_path),
    background: tmdb.backdrop(s.backdrop_path),
    year: s.first_air_date ? parseInt(s.first_air_date.slice(0, 4)) : undefined,
    imdbRating: s.vote_average ? s.vote_average.toFixed(1) : undefined,
    description: s.overview,
    genres: s.genre_ids ? s.genre_ids.map(String) : [],
  };
}

async function handleCatalog(id, extra = {}) {
  const def = CATALOG_MAP[id];
  if (!def) return { metas: [] };

  const lang = extra.language || 'en';
  const skip = extra.skip || 0;
  const search = extra.search;

  // ── Search mode ──────────────────────────────────────────────────────────
  if (search) {
    if (def.type === 'movie') {
      const data = await tmdb.searchMovies(search, lang, stremioPage(skip));
      return { metas: (data.results || []).map(toMovieMeta) };
    } else {
      const data = await tmdb.searchSeries(search, lang, stremioPage(skip));
      return { metas: (data.results || []).map(toSeriesMeta) };
    }
  }

  // ── Genre filter ─────────────────────────────────────────────────────────
  const params = {
    language: lang,
    page: stremioPage(skip),
    ...(extra.genre ? { with_genres: extra.genre } : {}),
  };

  const data = await tmdb.fetchCatalog(def.endpoint, params);
  const results = data.results || [];

  if (def.type === 'movie') {
    return { metas: results.map(toMovieMeta) };
  } else {
    return { metas: results.map(toSeriesMeta) };
  }
}

module.exports = { handleCatalog };
