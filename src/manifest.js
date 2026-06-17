'use strict';

const CATALOG_EXTRA = [
  { name: 'genre', isRequired: false },
  { name: 'skip', isRequired: false },
  { name: 'search', isRequired: false },
];

function buildManifest(config = {}) {
  const lang = config.language || 'en';

  return {
    id: 'community.tmdb-metadata-plus',
    version: '1.0.0',
    name: 'TMDB Metadata Plus',
    description:
      'Rich metadata, catalogs, and search powered by The Movie Database (TMDB). ' +
      'Includes trending, popular, top-rated content with posters, backdrops, cast, crew, and more.',
    logo: 'https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fb228cf3ded904ef09b136fe3fec72548ebc1fea3fbbd1ad9e36364db38b.svg',
    resources: ['catalog', 'meta'],
    types: ['movie', 'series'],
    idPrefixes: ['tmdb_movie_', 'tmdb_series_'],
    behaviorHints: {
      configurable: true,
      configurationRequired: false,
    },
    config: [
      {
        key: 'language',
        type: 'select',
        title: 'Content Language',
        options: [
          'en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh', 'hi', 'ar', 'ru',
        ],
        default: 'en',
      },
    ],
    catalogs: [
      // ── Movies ──────────────────────────────────────────────────────────────
      {
        id: 'tmdb_trending_movies',
        name: 'Trending Movies',
        type: 'movie',
        extra: CATALOG_EXTRA,
      },
      {
        id: 'tmdb_popular_movies',
        name: 'Popular Movies',
        type: 'movie',
        extra: CATALOG_EXTRA,
      },
      {
        id: 'tmdb_top_movies',
        name: 'Top Rated Movies',
        type: 'movie',
        extra: CATALOG_EXTRA,
      },
      {
        id: 'tmdb_upcoming_movies',
        name: 'Upcoming Movies',
        type: 'movie',
        extra: CATALOG_EXTRA,
      },
      // ── Series ───────────────────────────────────────────────────────────────
      {
        id: 'tmdb_trending_series',
        name: 'Trending Series',
        type: 'series',
        extra: CATALOG_EXTRA,
      },
      {
        id: 'tmdb_popular_series',
        name: 'Popular Series',
        type: 'series',
        extra: CATALOG_EXTRA,
      },
      {
        id: 'tmdb_top_series',
        name: 'Top Rated Series',
        type: 'series',
        extra: CATALOG_EXTRA,
      },
      {
        id: 'tmdb_airing_today',
        name: 'Airing Today',
        type: 'series',
        extra: CATALOG_EXTRA,
      },
    ],
  };
}

module.exports = { buildManifest };
