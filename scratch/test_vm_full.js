const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('public/index.html', 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/i);
if (!scriptMatch) {
  console.error('No script found');
  process.exit(1);
}

const dummyEl = { innerHTML: '', addEventListener: () => {}, querySelector: () => null, querySelectorAll: () => [] };

// Create sandbox
const sandbox = {
  console,
  btoa: (str) => Buffer.from(str).toString('base64'),
  atob: (b64) => Buffer.from(b64, 'base64').toString('utf8'),
  Blob: globalThis.Blob,
  URLSearchParams: globalThis.URLSearchParams,
  URL: { createObjectURL: () => 'blob:mock', revokeObjectURL: () => {} },
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
  document: {
    getElementById: () => dummyEl,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    createElement: () => ({ setAttribute: () => {}, rel: '', href: '', style: {} }),
    head: { appendChild: () => {} },
  },
  window: {
    addEventListener: () => {},
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    location: { hash: '#/preaching-reports', search: '' },
    open: () => ({ document: { open: () => {}, write: () => {}, close: () => {} } }),
    btoa: (str) => Buffer.from(str).toString('base64'),
    atob: (b64) => Buffer.from(b64, 'base64').toString('utf8'),
    Blob: globalThis.Blob,
    URLSearchParams: globalThis.URLSearchParams,
    URL: { createObjectURL: () => 'blob:mock', revokeObjectURL: () => {} },
    fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
  },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  setInterval: () => {},
  clearInterval: () => {},
  location: { hash: '#/preaching-reports', search: '' },
  navigator: { userAgent: 'node' }
};

vm.createContext(sandbox);
try {
  const exportHook = `
;sandboxExport = {
  DB, APP, batch, batchMetrics, batchPreachingFunnel,
  getBatchFacilitators, getBatchVolunteers, viewPreachingReports, exportBatchMonthlyReportPDF
};
`;
  vm.runInContext(scriptMatch[1] + exportHook, sandbox);
  console.log('Script ran in VM successfully!');

  // Now test DB and helper functions
  const { DB, APP, batch, batchMetrics, batchPreachingFunnel, getBatchFacilitators, getBatchVolunteers, viewPreachingReports, exportBatchMonthlyReportPDF } = sandbox.sandboxExport;
  APP.user = DB.users[0]; // log in
  console.log('Batches count:', DB.batches.length);
  DB.batches.forEach(b => {
    const facs = getBatchFacilitators(b.id);
    const vols = getBatchVolunteers(b.id);
    const funnel = batchPreachingFunnel(b.id);
    console.log(`\nBatch: ${b.name} (Level ${b.level})`);
    console.log(`  Incharge: ${b.incharge}, Coordinator: ${b.coordinator}`);
    console.log(`  Facilitators (${facs.length}): ${facs.map(f => f.name).join(', ')}`);
    console.log(`  Volunteers (${vols.length}): ${vols.map(v => v.name).join(', ')}`);
    console.log(`  Funnel: ${funnel.map(f => `${f.l}: ${f.v}`).join(' -> ')}`);
  });

  const htmlOutput = viewPreachingReports();
  console.log('\nviewPreachingReports() output generated successfully! Length:', htmlOutput.length);

  // Test exportBatchMonthlyReportPDF
  exportBatchMonthlyReportPDF(DB.batches[0].id);
  console.log('exportBatchMonthlyReportPDF executed cleanly!');
} catch (e) {
  console.error('VM execution error:', e);
  process.exit(1);
}
