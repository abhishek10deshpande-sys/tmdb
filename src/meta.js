'use strict';

const tmdb = require('./tmdb');

// ── Parse our custom ID scheme ────────────────────────────────────────────────
function parseId(stremioId) {
  const movieMatch = stremioId.match(/^tmdb_movie_(\d+)$/);
  if (movieMatch) return { type: 'movie', tmdbId: movieMatch[1] };

  const seriesMatch = stremioId.match(/^tmdb_series_(\d+)$/);
  if (seriesMatch) return { type: 'series', tmdbId: seriesMatch[1] };

  return null;
}

// ── Content rating helper ─────────────────────────────────────────────────────
function movieCertification(releases) {
  if (!releases) return undefined;
  const us = (releases.results || []).find((r) => r.iso_3166_1 === 'US');
  if (!us) return undefined;
  const cert = (us.release_dates || []).find((d) => d.certification);
  return cert ? cert.certification : undefined;
}

function seriesCertification(ratings) {
  if (!ratings) return undefined;
  const us = (ratings.results || []).find((r) => r.iso_3166_1 === 'US');
  return us ? us.rating : undefined;
}

// ── Movie meta ────────────────────────────────────────────────────────────────
async function buildMovieMeta(tmdbId, lang) {
  const { detail, credits, logo } = await tmdb.fetchMovieDetail(tmdbId, lang);

  const genres = (detail.genres || []).map((g) => g.name);
  const runtime = detail.runtime ? [detail.runtime] : undefined;

  const trailerObj = (detail.videos?.results || []).find(
    (v) => v.type === 'Trailer' && v.site === 'YouTube'
  );
  const trailerUrl = trailerObj
    ? `https://www.youtube.com/watch?v=${trailerObj.key}`
    : undefined;

  return {
    meta: {
      id: `tmdb_movie_${tmdbId}`,
      type: 'movie',
      name: detail.title || detail.original_title,
      poster: tmdb.poster(detail.poster_path, 'w500'),
      background: tmdb.backdrop(detail.backdrop_path, 'w1280'),
      logo: logo || undefined,
      year: detail.release_date ? parseInt(detail.release_date.slice(0, 4)) : undefined,
      released: detail.release_date || undefined,
      runtime: runtime,
      genres: genres,
      description: detail.overview,
      imdbRating: detail.vote_average ? detail.vote_average.toFixed(1) : undefined,
      popularities: detail.popularity ? { tmdb: detail.popularity } : undefined,
      country: (detail.production_countries || []).map((c) => c.iso_3166_1),
      language: detail.original_language,
      cast: tmdb.topCast(credits),
      director: tmdb.crew(credits, ['Director']).map((p) => p.name),
      writer: tmdb.crew(credits, ['Screenplay', 'Writer', 'Story']).map((p) => p.name),
      trailerUrl: trailerUrl,
      links: [
        {
          name: 'TMDB',
          category: 'See on',
          url: `https://www.themoviedb.org/movie/${tmdbId}`,
        },
        ...(detail.external_ids?.imdb_id
          ? [{ name: 'IMDb', category: 'See on', url: `https://www.imdb.com/title/${detail.external_ids.imdb_id}` }]
          : []),
      ],
      imdb_id: detail.external_ids?.imdb_id || undefined,
    },
  };
}

// ── Series meta ───────────────────────────────────────────────────────────────
async function buildSeriesMeta(tmdbId, lang) {
  const { detail, credits, logo } = await tmdb.fetchSeriesDetail(tmdbId, lang);

  const genres = (detail.genres || []).map((g) => g.name);

  const trailerObj = (detail.videos?.results || []).find(
    (v) => v.type === 'Trailer' && v.site === 'YouTube'
  );
  const trailerUrl = trailerObj
    ? `https://www.youtube.com/watch?v=${trailerObj.key}`
    : undefined;

  // Build videos array for series episodes (season/episode previews)
  const videos = [];
  for (const season of (detail.seasons || [])) {
    if (season.season_number === 0) continue; // skip Specials
    videos.push({
      id: `tmdb_series_${tmdbId}:${season.season_number}:1`,
      title: `Season ${season.season_number}`,
      season: season.season_number,
      episode: 1,
      thumbnail: tmdb.poster(season.poster_path, 'w300'),
      overview: season.overview,
      released: season.air_date,
    });
  }

  return {
    meta: {
      id: `tmdb_series_${tmdbId}`,
      type: 'series',
      name: detail.name || detail.original_name,
      poster: tmdb.poster(detail.poster_path, 'w500'),
      background: tmdb.backdrop(detail.backdrop_path, 'w1280'),
      logo: logo || undefined,
      year: detail.first_air_date ? parseInt(detail.first_air_date.slice(0, 4)) : undefined,
      released: detail.first_air_date || undefined,
      genres: genres,
      description: detail.overview,
      imdbRating: detail.vote_average ? detail.vote_average.toFixed(1) : undefined,
      country: (detail.origin_country || []),
      language: detail.original_language,
      status: detail.status,
      runtime: detail.episode_run_time?.length ? detail.episode_run_time : undefined,
      cast: tmdb.topCast(credits),
      director: tmdb
        .crew({ crew: (detail.created_by || []).map((p) => ({ ...p, job: 'Creator' })) }, ['Creator'])
        .map((p) => p.name),
      trailerUrl: trailerUrl,
      videos: videos.length ? videos : undefined,
      links: [
        {
          name: 'TMDB',
          category: 'See on',
          url: `https://www.themoviedb.org/tv/${tmdbId}`,
        },
        ...(detail.external_ids?.imdb_id
          ? [{ name: 'IMDb', category: 'See on', url: `https://www.imdb.com/title/${detail.external_ids.imdb_id}` }]
          : []),
      ],
      imdb_id: detail.external_ids?.imdb_id || undefined,
    },
  };
}

// ── Main handler ──────────────────────────────────────────────────────────────
async function handleMeta(type, id, extra = {}) {
  const parsed = parseId(id);
  if (!parsed) return { meta: null };

  const lang = extra.language || 'en';

  if (parsed.type === 'movie') {
    return buildMovieMeta(parsed.tmdbId, lang);
  } else {
    return buildSeriesMeta(parsed.tmdbId, lang);
  }
}

module.exports = { handleMeta };
