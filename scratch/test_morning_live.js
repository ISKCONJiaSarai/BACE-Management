const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('public/index.html', 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
const scriptCode = scriptMatch[1];

const mockWindow = {
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
  location: { hostname: 'localhost', protocol: 'http:', search: '', hash: '', origin: 'http://localhost', pathname: '/' },
  matchMedia: () => ({ matches: false, addEventListener: () => {} }),
  addEventListener: () => {},
  removeEventListener: () => {},
  open: () => ({ document: { open: () => {}, write: () => {}, close: () => {} }, focus: () => {} }),
  print: () => {},
  close: () => {}
};

const sandbox = {
  window: mockWindow,
  localStorage: {
    _store: {},
    getItem(k) { return this._store[k] || null; },
    setItem(k, v) { this._store[k] = String(v); },
    removeItem(k) { delete this._store[k]; }
  },
  document: {
    documentElement: { setAttribute: () => {}, style: {} },
    getElementById: (id) => ({
      id,
      innerHTML: '',
      style: {},
      classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
      appendChild: () => {},
      querySelector: () => null,
      querySelectorAll: () => []
    }),
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({ style: {}, appendChild: () => {}, setAttribute: () => {}, remove: () => {} }),
    body: { appendChild: () => {} },
    head: { appendChild: () => {} },
    addEventListener: () => {}
  },
  fetch: mockWindow.fetch,
  location: mockWindow.location,
  btoa: (str) => Buffer.from(str).toString('base64'),
  atob: (str) => Buffer.from(str, 'base64').toString('binary'),
  Blob: typeof Blob !== 'undefined' ? Blob : class Blob {},
  URL: typeof URL !== 'undefined' ? URL : { createObjectURL: () => 'blob:mock' },
  URLSearchParams: typeof URLSearchParams !== 'undefined' ? URLSearchParams : class URLSearchParams { get() { return null; } },
  Audio: class { constructor() { this.src = ''; } play() { return Promise.resolve(); } pause() {} addEventListener() {} },
  navigator: { userAgent: 'node' },
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: () => {},
  clearInterval: () => {},
  toast: (msg, icon) => {}
};
sandbox.window.window = sandbox.window;
sandbox.window.document = sandbox.document;
sandbox.window.localStorage = sandbox.localStorage;

vm.createContext(sandbox);
vm.runInContext(scriptCode, sandbox);

// Now load rawBiometricText from backend and call parseMorningCSV
const http = require('http');
http.get('http://localhost:5000/api/attendance/morning', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    sandbox.rawText = json.rawBiometricText;
    sandbox.serverDevs = json.devotees;

    // Simulate what loadMorningAttendanceFromBackend does:
    const result = vm.runInContext(`
      // Merge serverDevs into DB.devotees
      if (Array.isArray(serverDevs)) {
        serverDevs.forEach(sd => {
          const local = (DB.devotees || []).find(d => d.name && d.name.toLowerCase().trim() === (sd.name || '').toLowerCase().trim());
          if (!local) {
            DB.devotees.push({
              id: String(sd._id || sd.customId || 'd_' + Math.random()),
              name: sd.name,
              customId: sd.customId,
              appointment: sd.appointment || 'Devotee',
              dept: sd.dept,
              batch: sd.batch,
              morningStandardTime: sd.morningStandardTime || '04:30'
            });
          }
        });
      }
      
      const p = parseMorningCSV(rawText);
      ({
        date: p.date,
        availableDates: p.availableDates,
        rowsCount: p.rows.length,
        presentCount: p.rows.filter(r => r.status !== 'Absent').length,
        absentCount: p.rows.filter(r => r.status === 'Absent').length,
        onTimeCount: p.rows.filter(r => r.status === 'On Time').length,
        graceCount: p.rows.filter(r => r.status === 'Grace').length,
        lateCount: p.rows.filter(r => r.status === 'Late').length,
        veryLateCount: p.rows.filter(r => r.status === 'Very late').length,
        sampleRows: p.rows.slice(0, 5).map(r => ({ name: r.name, timeIn: r.timeIn, status: r.status }))
      });
    `, sandbox);

    console.log('parseMorningCSV result:');
    console.log(result);
    process.exit(0);
  });
});
