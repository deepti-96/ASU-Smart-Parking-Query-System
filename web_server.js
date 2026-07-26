// Local web server for the ASU Smart Parking demo.

const http = require('http');
const { URL } = require('url');
const ParkingDatabase = require('./database_setup');
const GeospatialQueries = require('./geospatial_queries');
const ParkingQueryParser = require('./query_parser');

const PORT = Number(process.env.PORT || 8090);
const HOST = process.env.HOST || '127.0.0.1';

const database = new ParkingDatabase();
const parser = new ParkingQueryParser();
let geospatialQueries;

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(payload));
}

function sendHtml(res) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ASU Smart Parking</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #1b1f2a;
      --muted: #5c6677;
      --line: #d7dde8;
      --gold: #ffc627;
      --maroon: #8c1d40;
      --blue: #1f6f8b;
      --green: #24785a;
      --bg: #f6f7fb;
      --surface: #ffffff;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: var(--bg);
      color: var(--ink);
    }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      padding: 18px 28px;
      border-bottom: 1px solid var(--line);
      background: var(--surface);
    }
    h1 {
      margin: 0;
      font-size: 24px;
      line-height: 1.1;
    }
    main {
      display: grid;
      grid-template-columns: minmax(320px, 430px) minmax(0, 1fr);
      min-height: calc(100vh - 73px);
    }
    aside {
      padding: 24px;
      background: var(--surface);
      border-right: 1px solid var(--line);
    }
    section {
      padding: 24px;
    }
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 700;
      font-size: 13px;
      color: var(--muted);
      text-transform: uppercase;
    }
    textarea {
      width: 100%;
      min-height: 112px;
      resize: vertical;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 12px;
      font: inherit;
      color: var(--ink);
    }
    button {
      border: 0;
      border-radius: 8px;
      padding: 11px 14px;
      font: inherit;
      font-weight: 750;
      cursor: pointer;
      background: var(--maroon);
      color: white;
    }
    button.secondary {
      background: #e9edf4;
      color: var(--ink);
    }
    .actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 12px;
    }
    .examples {
      display: grid;
      gap: 8px;
      margin-top: 24px;
    }
    .example {
      width: 100%;
      text-align: left;
      background: #f4f6fa;
      color: var(--ink);
      border: 1px solid var(--line);
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(4, minmax(130px, 1fr));
      gap: 12px;
      margin-bottom: 18px;
    }
    .metric, .lot {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 14px;
    }
    .metric strong {
      display: block;
      font-size: 24px;
      line-height: 1;
    }
    .metric span, .meta, .empty {
      color: var(--muted);
      font-size: 14px;
    }
    .results {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 12px;
    }
    .lot h2 {
      margin: 0 0 8px;
      font-size: 18px;
    }
    .pillrow {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-top: 12px;
    }
    .pill {
      border-radius: 999px;
      padding: 4px 8px;
      font-size: 12px;
      font-weight: 750;
      background: #edf4fb;
      color: var(--blue);
    }
    .pill.gold {
      background: #fff3c4;
      color: #6a4c00;
    }
    .pill.green {
      background: #e5f5ef;
      color: var(--green);
    }
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 12px;
    }
    .status {
      color: var(--muted);
      font-size: 14px;
    }
    @media (max-width: 850px) {
      main { grid-template-columns: 1fr; }
      aside { border-right: 0; border-bottom: 1px solid var(--line); }
      .stats { grid-template-columns: repeat(2, minmax(130px, 1fr)); }
    }
  </style>
</head>
<body>
  <header>
    <h1>ASU Smart Parking</h1>
    <div class="status" id="serverStatus">localhost:${PORT}</div>
  </header>
  <main>
    <aside>
      <label for="queryInput">Natural language query</label>
      <textarea id="queryInput">Find the nearest visitor parking to the Memorial Union</textarea>
      <div class="actions">
        <button id="searchButton">Search Parking</button>
        <button class="secondary" id="refreshButton">All Lots</button>
        <button class="secondary" id="updateButton">Simulate Update</button>
      </div>
      <div class="examples">
        <button class="example">Show lots within 500 meters of the BYENG building with >20 open spots</button>
        <button class="example">Where can I park after 6 pm near Poly that doesn't require a permit?</button>
        <button class="example">List EV-charging parking within 1 km of West campus library</button>
        <button class="example">Which garage inside Downtown Tempe zone has ADA spaces available now?</button>
      </div>
    </aside>
    <section>
      <div class="stats" id="stats"></div>
      <div class="toolbar">
        <strong id="resultTitle">Parking lots</strong>
        <span class="status" id="status"></span>
      </div>
      <div class="results" id="results"></div>
    </section>
  </main>
  <script>
    const queryInput = document.getElementById('queryInput');
    const statusEl = document.getElementById('status');
    const resultsEl = document.getElementById('results');
    const statsEl = document.getElementById('stats');
    const titleEl = document.getElementById('resultTitle');

    function formatLots(lots) {
      if (!lots.length) {
        resultsEl.innerHTML = '<div class="empty">No matching parking lots found.</div>';
        return;
      }
      resultsEl.innerHTML = lots.map((lot) => {
        const distance = lot.distance !== undefined ? '<span class="pill">' + Math.round(lot.distance) + 'm</span>' : '';
        const ev = lot.hasEVChargers ? '<span class="pill green">EV</span>' : '';
        const ada = lot.adaSpaces > 0 ? '<span class="pill gold">' + lot.adaSpaces + ' ADA</span>' : '';
        return '<article class="lot">' +
          '<h2>' + lot.name + '</h2>' +
          '<div class="meta">' + lot.campus + ' · ' + lot.permitType + ' · ' + lot.buildingNearby + '</div>' +
          '<div class="meta">' + lot.currentAvailability + ' of ' + lot.capacity + ' spots available</div>' +
          '<div class="pillrow">' + distance + ev + ada + '<span class="pill">' + lot.zones.join(', ') + '</span></div>' +
        '</article>';
      }).join('');
    }

    function formatStats(stats) {
      const totals = stats.reduce((acc, item) => {
        acc.lots += item.totalLots;
        acc.capacity += item.totalCapacity;
        acc.available += item.totalAvailable;
        acc.ev += item.evChargingLots;
        return acc;
      }, { lots: 0, capacity: 0, available: 0, ev: 0 });
      statsEl.innerHTML = [
        ['Lots', totals.lots],
        ['Capacity', totals.capacity],
        ['Available', totals.available],
        ['EV lots', totals.ev]
      ].map(([label, value]) => '<div class="metric"><strong>' + value + '</strong><span>' + label + '</span></div>').join('');
    }

    async function loadLots() {
      statusEl.textContent = 'Loading...';
      const response = await fetch('/api/lots');
      const payload = await response.json();
      titleEl.textContent = 'All parking lots';
      formatLots(payload.lots);
      statusEl.textContent = payload.lots.length + ' results';
    }

    async function loadStats() {
      const response = await fetch('/api/stats');
      const payload = await response.json();
      formatStats(payload.stats);
    }

    async function search() {
      statusEl.textContent = 'Searching...';
      const response = await fetch('/api/search?q=' + encodeURIComponent(queryInput.value));
      const payload = await response.json();
      titleEl.textContent = 'Search results';
      formatLots(payload.lots);
      statusEl.textContent = payload.lots.length + ' results';
    }

    async function simulateUpdate() {
      statusEl.textContent = 'Updating...';
      await fetch('/api/update', { method: 'POST' });
      await loadStats();
      await loadLots();
    }

    document.getElementById('searchButton').addEventListener('click', search);
    document.getElementById('refreshButton').addEventListener('click', async () => {
      await loadStats();
      await loadLots();
    });
    document.getElementById('updateButton').addEventListener('click', simulateUpdate);
    document.querySelectorAll('.example').forEach((button) => {
      button.addEventListener('click', () => {
        queryInput.value = button.textContent;
        search();
      });
    });

    loadStats().then(loadLots).catch((error) => {
      statusEl.textContent = error.message;
    });
  </script>
</body>
</html>`);
}

function serializeLot(lot) {
    return {
        ...lot,
        _id: String(lot._id),
        lastUpdated: lot.lastUpdated ? lot.lastUpdated.toISOString() : null
    };
}

async function handleApi(req, res, url) {
    if (url.pathname === '/api/lots' && req.method === 'GET') {
        const lots = await database.db.collection('parking_lots').find({}).sort({ campus: 1, name: 1 }).toArray();
        sendJson(res, 200, { lots: lots.map(serializeLot) });
        return;
    }

    if (url.pathname === '/api/stats' && req.method === 'GET') {
        const stats = await geospatialQueries.getParkingStatistics();
        sendJson(res, 200, { stats });
        return;
    }

    if (url.pathname === '/api/search' && req.method === 'GET') {
        const query = url.searchParams.get('q') || '';
        const criteria = parser.parseQuery(query);
        const lots = criteria.targetTime
            ? await geospatialQueries.findAvailableParkingAtTime(criteria, criteria.targetTime)
            : await geospatialQueries.findParkingWithFilters(criteria);
        sendJson(res, 200, { criteria, lots: lots.map(serializeLot) });
        return;
    }

    if (url.pathname === '/api/update' && req.method === 'POST') {
        await geospatialQueries.simulateParkingUpdates();
        sendJson(res, 200, { ok: true });
        return;
    }

    sendJson(res, 404, { error: 'Not found' });
}

async function initializeDemoData() {
    await database.connect();
    await database.createIndexes();
    const count = await database.db.collection('parking_lots').countDocuments();

    if (count === 0) {
        await database.insertSampleData();
    }

    geospatialQueries = new GeospatialQueries(database.db);
}

async function main() {
    await initializeDemoData();

    const server = http.createServer(async (req, res) => {
        const url = new URL(req.url, `http://${req.headers.host}`);

        try {
            if (url.pathname.startsWith('/api/')) {
                await handleApi(req, res, url);
                return;
            }

            if (url.pathname === '/') {
                sendHtml(res);
                return;
            }

            sendJson(res, 404, { error: 'Not found' });
        } catch (error) {
            console.error(error);
            sendJson(res, 500, { error: error.message });
        }
    });

    server.listen(PORT, HOST, () => {
        console.log(`ASU Smart Parking web app running at http://${HOST}:${PORT}`);
    });
}

main().catch((error) => {
    console.error('Failed to start ASU Smart Parking web app:', error);
    process.exit(1);
});
