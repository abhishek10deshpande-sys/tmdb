# 🎬 TMDB Metadata Plus

A production-ready **Stremio Metadata Addon** powered by [The Movie Database (TMDB)](https://www.themoviedb.org/).  
Provides rich metadata, 8 curated catalogs, full-text search, and multi-language support.

---

## Features

| Feature | Details |
|---|---|
| **Metadata** | Posters, backdrops, logos, ratings, genres, cast, crew, trailers, release dates, runtime |
| **Movie Catalogs** | Trending · Popular · Top Rated · Upcoming |
| **Series Catalogs** | Trending · Popular · Top Rated · Airing Today |
| **Search** | Movies and TV shows via TMDB search API |
| **Languages** | English (default) + 11 more via config |
| **Caching** | In-memory cache with 24-hour TTL |
| **Reliability** | Automatic retry with exponential backoff on TMDB failures |

---

## Quick Install in Stremio

1. Open Stremio
2. Go to **Addons** → **Community Addons** → **Add addon**
3. Paste your deployment URL:

```
https://YOUR-RENDER-APP.onrender.com/manifest.json
```

Or click the install button on the addon's status page.

---

## Local Development

### Prerequisites

- Node.js ≥ 18
- A TMDB API key (free at [themoviedb.org](https://www.themoviedb.org/settings/api))

### Setup

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/tmdb-metadata-plus.git
cd tmdb-metadata-plus

# Install dependencies
npm install

# Set your API key (optional — fallback key included)
export TMDB_API_KEY=your_tmdb_key_here

# Start the server
npm start
# or for auto-reload during development:
npm run dev
```

The addon will be available at `http://localhost:7000`.

### Test Endpoints

```bash
# Manifest
curl http://localhost:7000/manifest.json

# Trending movies catalog
curl http://localhost:7000/catalog/movie/tmdb_trending_movies.json

# Movie metadata (Fight Club)
curl http://localhost:7000/meta/movie/tmdb_movie_550.json

# Series metadata (Game of Thrones)
curl http://localhost:7000/meta/series/tmdb_series_1399.json

# Search
curl "http://localhost:7000/catalog/movie/tmdb_popular_movies.json?search=inception"

# Spanish language (base64 config: {"language":"es"})
curl http://localhost:7000/eyJsYW5ndWFnZSI6ImVzIn0=/catalog/movie/tmdb_trending_movies.json
```

---

## GitHub Setup

```bash
git init
git add .
git commit -m "Initial commit: TMDB Metadata Plus"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/tmdb-metadata-plus.git
git push -u origin main
```

---

## Deploy to Render

### Option A — Auto Deploy (recommended)

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → **New** → **Web Service**
3. Connect your GitHub repo
4. Render will detect `render.yaml` automatically
5. Add your environment variable:
   - **Key:** `TMDB_API_KEY`  
   - **Value:** your TMDB API key
6. Click **Deploy**

### Option B — Manual Setup

| Setting | Value |
|---|---|
| **Environment** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Health Check Path** | `/manifest.json` |

**Required environment variables:**

| Key | Value |
|---|---|
| `TMDB_API_KEY` | Your TMDB API key |
| `PORT` | `7000` (set by Render automatically) |

After deploy, your manifest URL will be:

```
https://tmdb-metadata-plus.onrender.com/manifest.json
```

---

## ID Scheme

| Type | Format | Example |
|---|---|---|
| Movie | `tmdb_movie_{id}` | `tmdb_movie_550` |
| Series | `tmdb_series_{id}` | `tmdb_series_1399` |

---

## Catalog IDs

| ID | Type | Description |
|---|---|---|
| `tmdb_trending_movies` | movie | Weekly trending movies |
| `tmdb_popular_movies` | movie | Most popular movies |
| `tmdb_top_movies` | movie | Top rated movies |
| `tmdb_upcoming_movies` | movie | Upcoming releases |
| `tmdb_trending_series` | series | Weekly trending series |
| `tmdb_popular_series` | series | Most popular series |
| `tmdb_top_series` | series | Top rated series |
| `tmdb_airing_today` | series | Airing on TV today |

---

## Multi-Language Configuration

Pass a base64-encoded JSON config in the URL path:

```js
// Config object
const config = { language: "es" };
// Encode
const encoded = Buffer.from(JSON.stringify(config)).toString("base64");
// → "eyJsYW5ndWFnZSI6ImVzIn0="
```

```
/eyJsYW5ndWFnZSI6ImVzIn0=/manifest.json
/eyJsYW5ndWFnZSI6ImVzIn0=/catalog/movie/tmdb_trending_movies.json
```

**Supported languages:** `en` · `es` · `fr` · `de` · `it` · `pt` · `ja` · `ko` · `zh` · `hi` · `ar` · `ru`

---

## Project Structure

```
/
├── server.js          # Express app & route handlers
├── package.json
├── render.yaml        # Render deployment config
├── .gitignore
├── README.md
└── src/
    ├── manifest.js    # Stremio manifest builder
    ├── tmdb.js        # TMDB API client (cache + retry)
    ├── catalogs.js    # Catalog & search logic
    └── meta.js        # Metadata builder (movie + series)
```

---

## License

MIT — use freely, modify freely.
