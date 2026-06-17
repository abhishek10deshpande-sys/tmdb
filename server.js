'use strict';

const express = require('express');
const { buildManifest } = require('./src/manifest');
const { handleCatalog } = require('./src/catalogs');
const { handleMeta } = require('./src/meta');

const app = express();
const PORT = process.env.PORT || 7000;

// ── CORS – Stremio requires open CORS ────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseConfig(encoded) {
  if (!encoded) return {};
  try {
    return JSON.parse(Buffer.from(encoded, 'base64').toString('utf-8'));
  } catch {
    return {};
  }
}

function sendJSON(res, data) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // CDN-friendly
  res.send(JSON.stringify(data, null, 2));
}

// ── Status page ───────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>TMDB Metadata Plus</title>
      <style>
        body { font-family: system-ui, sans-serif; max-width: 640px; margin: 60px auto; padding: 0 20px; color: #eee; background: #111; }
        h1 { color: #01b4e4; }
        a { color: #01d277; }
        code { background: #222; padding: 2px 6px; border-radius: 4px; }
        .btn { display:inline-block; background:#01b4e4; color:#000; padding:10px 20px; border-radius:6px; text-decoration:none; font-weight:bold; margin-top:16px; }
      </style>
    </head>
    <body>
      <h1>🎬 TMDB Metadata Plus</h1>
      <p>A Stremio addon providing rich TMDB metadata, catalogs, and search.</p>
      <h2>Install</h2>
      <p>Copy this URL into Stremio &rarr; Addons &rarr; Community Addons &rarr; Add addon:</p>
      <code>${req.protocol}://${req.get('host')}/manifest.json</code>
      <br>
      <a class="btn" href="stremio://${req.get('host')}/manifest.json">Install in Stremio</a>
      <h2>Endpoints</h2>
      <ul>
        <li><a href="/manifest.json">/manifest.json</a></li>
        <li>/catalog/{type}/{catalogId}.json</li>
        <li>/meta/{type}/{id}.json</li>
      </ul>
      <h2>Configure Language</h2>
      <p>Append <code>/{base64config}/</code> before the resource to pass config:</p>
      <code>e.g. /eyJsYW5ndWFnZSI6ImVzIn0=/catalog/movie/tmdb_popular_movies.json</code>
    </body>
    </html>
  `);
});

// ── Manifest ──────────────────────────────────────────────────────────────────
app.get('/:config?/manifest.json', (req, res) => {
  const config = parseConfig(req.params.config);
  sendJSON(res, buildManifest(config));
});

// shorthand without config prefix
app.get('/manifest.json', (req, res) => {
  sendJSON(res, buildManifest());
});

// ── Catalog ───────────────────────────────────────────────────────────────────
app.get('/:config/catalog/:type/:id.json', async (req, res) => {
  try {
    const config = parseConfig(req.params.config);
    const extra = { ...config, ...req.query };
    const result = await handleCatalog(req.params.id, extra);
    sendJSON(res, result);
  } catch (err) {
    console.error('[catalog] Error:', err.message);
    res.status(500).json({ metas: [], error: err.message });
  }
});

app.get('/catalog/:type/:id.json', async (req, res) => {
  try {
    const result = await handleCatalog(req.params.id, req.query);
    sendJSON(res, result);
  } catch (err) {
    console.error('[catalog] Error:', err.message);
    res.status(500).json({ metas: [], error: err.message });
  }
});

// ── Meta ──────────────────────────────────────────────────────────────────────
app.get('/:config/meta/:type/:id.json', async (req, res) => {
  try {
    const config = parseConfig(req.params.config);
    const extra = { ...config, ...req.query };
    const result = await handleMeta(req.params.type, req.params.id, extra);
    if (!result.meta) return res.status(404).json({ meta: null });
    sendJSON(res, result);
  } catch (err) {
    console.error('[meta] Error:', err.message);
    res.status(500).json({ meta: null, error: err.message });
  }
});

app.get('/meta/:type/:id.json', async (req, res) => {
  try {
    const result = await handleMeta(req.params.type, req.params.id, req.query);
    if (!result.meta) return res.status(404).json({ meta: null });
    sendJSON(res, result);
  } catch (err) {
    console.error('[meta] Error:', err.message);
    res.status(500).json({ meta: null, error: err.message });
  }
});

// ── 404 fallback ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ TMDB Metadata Plus running on http://localhost:${PORT}`);
  console.log(`   Manifest: http://localhost:${PORT}/manifest.json`);
});

module.exports = app;
