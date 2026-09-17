const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('public/index.html', 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/i);
if (!scriptMatch) {
  console.error('No script tag found!');
  process.exit(1);
}

// Set up mock DOM and browser globals
const localStorageStore = {};
const mockLocalStorage = {
  getItem: (k) => localStorageStore[k] || null,
  setItem: (k, v) => { localStorageStore[k] = String(v); },
  removeItem: (k) => { delete localStorageStore[k]; },
  clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }
};

const sandbox = {
  console,
  setTimeout: () => {},
  clearTimeout: () => {},
  setInterval: () => {},
  clearInterval: () => {},
  localStorage: mockLocalStorage,
  location: { hash: '#/preaching-reports', search: '' },
  window: {
    innerWidth: 1200,
    innerHeight: 800,
    addEventListener: () => {},
    localStorage: mockLocalStorage,
    location: { hash: '#/preaching-reports', search: '' }
  },
  document: {
    title: '',
    head: { appendChild: () => {} },
    getElementById: (id) => ({ id, innerHTML: '', style: {}, appendChild: () => {}, addEventListener: () => {} }),
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    body: { innerHTML: '', appendChild: () => {} },
    createElement: () => ({
      style: {},
      appendChild: () => {},
      setAttribute: () => {},
      addEventListener: () => {}
    })
  },
  btoa: (s) => Buffer.from(s).toString('base64'),
  URLSearchParams: class extends Map {
    get(k) { return super.get(k); }
  },
  Blob: class {},
  URL: { createObjectURL: () => 'blob:mock', revokeObjectURL: () => {} },
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
};

// Append export hook to sandbox
const code = scriptMatch[1] + `
;sandboxExport = {
  DB, APP, batch, batchMembers, batchPreachingFunnel,
  viewBatch, viewPreachingReports, exportBatchMonthlyReportPDF,
  saveBatchesToStorage, loadBatchesFromStorage,
  saveReportsToStorage, loadReportsFromStorage,
  saveDevoteesToStorage, loadDevoteesFromStorage,
  saveAttendanceToStorage, loadAttendanceFromStorage,
  savePreachingFilters, loadPreachingFilters
};
`;

vm.createContext(sandbox);
vm.runInContext(code, sandbox);

const exp = sandbox.sandboxExport;
console.log('--- Checking batchPreachingFunnel ---');
const b1Funnel = exp.batchPreachingFunnel('b1');
console.log('Funnel stages for b1:', b1Funnel.map(f => `${f.l}: ${f.v}`));

const expectedStages = ['Registered', 'Interested', 'Attending Class', 'Regular', 'Sadhana', 'Actively Serving'];
const actualStages = b1Funnel.map(f => f.l);
console.assert(JSON.stringify(actualStages) === JSON.stringify(expectedStages), 'Stages mismatch! Got: ' + JSON.stringify(actualStages));

const b1Members = exp.batchMembers('b1');
console.assert(b1Funnel[0].v === b1Members.length, `Registered (${b1Funnel[0].v}) should equal batch members count (${b1Members.length})`);
console.log('Registered count equals batchMembers:', b1Funnel[0].v === b1Members.length);

console.log('\n--- Checking viewPreachingReports ---');
exp.APP.filters.repBatch = 'b1';
const vprHtml = exp.viewPreachingReports();
console.assert(vprHtml.includes('Collected'), 'Missing "Collected" in preaching reports!');
console.assert(vprHtml.includes('data-act="open-budget"'), 'Missing clickable open-budget card in preaching reports!');
console.assert(vprHtml.includes('Registered'), 'Missing "Registered" stage in preaching reports!');
console.assert(vprHtml.includes('Actively Serving'), 'Missing "Actively Serving" stage in preaching reports!');
console.assert(vprHtml.includes('Edit budget'), 'Missing "Edit budget" button in preaching reports!');
console.log('viewPreachingReports checks passed!');

console.log('\n--- Checking exportBatchMonthlyReportPDF ---');
let pdfOpenedHtml = '';
sandbox.window.open = () => ({
  document: {
    open: () => {},
    write: (h) => { pdfOpenedHtml += h; },
    close: () => {}
  }
});
exp.exportBatchMonthlyReportPDF('b1');
console.assert(pdfOpenedHtml.includes('🧾 Budget & Accounts (Collection & Expenses)'), 'Missing budget section in PDF!');
console.assert(pdfOpenedHtml.includes('Collected Budget'), 'Missing "Collected Budget" in PDF!');
console.assert(pdfOpenedHtml.includes('Total Expenses (Spent)'), 'Missing "Total Expenses" in PDF!');
console.assert(pdfOpenedHtml.includes('Remaining Balance'), 'Missing "Remaining Balance" in PDF!');
console.log('exportBatchMonthlyReportPDF checks passed!');

console.log('\n--- Checking Storage Persistence ---');
// Test batch changes
const b1 = exp.batch('b1');
b1.budget.allocated = 125000;
b1.budget.spent = 45000;
b1.facilitators = ['d1', 'd2'];
b1.volunteers = ['d3'];
exp.saveBatchesToStorage();

console.assert(Boolean(mockLocalStorage.getItem('bace_batches_store')), 'bace_batches_store was not saved!');

// Mutate DB and reload from storage
b1.budget.allocated = 1000;
b1.budget.spent = 1000;
b1.facilitators = [];
b1.volunteers = [];

exp.loadBatchesFromStorage();
console.assert(b1.budget.allocated === 125000, `Expected 125000 allocated, got ${b1.budget.allocated}`);
console.assert(b1.budget.spent === 45000, `Expected 45000 spent, got ${b1.budget.spent}`);
console.assert(b1.facilitators.length === 2, `Expected 2 facilitators, got ${b1.facilitators.length}`);
console.assert(b1.volunteers.length === 1, `Expected 1 volunteer, got ${b1.volunteers.length}`);

// Test preaching filters persistence
exp.APP.filters.repBatch = 'b2';
exp.APP.range.from = '2026-08-01';
exp.savePreachingFilters();

console.assert(mockLocalStorage.getItem('bace_rep_batch') === 'b2', 'Filter repBatch was not saved!');
exp.APP.filters.repBatch = 'b1';
exp.loadPreachingFilters();
console.assert(exp.APP.filters.repBatch === 'b2', 'Filter repBatch was not restored!');

// Test attendance persistence
exp.DB.attendance.push({ id: 'att-test-1', category: 'Preaching batch', ref: 'c1', devotee: 'd1', date: '2026-09-17', status: 'Present' });
exp.saveAttendanceToStorage();
console.assert(Boolean(mockLocalStorage.getItem('bace_attendance_store')), 'bace_attendance_store was not saved!');
exp.DB.attendance = [];
exp.loadAttendanceFromStorage();
console.assert(exp.DB.attendance.some(a => a.id === 'att-test-1'), 'Attendance was not restored from storage!');

console.log('All persistence checks passed!');

console.log('\n--- Checking viewBatch (Individual batch view) ---');
exp.APP.user = exp.DB.users[0];
const vbHtml = exp.viewBatch('b1');
console.assert(vbHtml.includes('Batch preaching funnel'), 'Missing Batch preaching funnel in individual batch view!');
console.assert(vbHtml.includes('Registered'), 'Missing Registered stage in individual batch funnel!');
console.assert(vbHtml.includes('Actively Serving'), 'Missing Actively Serving stage in individual batch funnel!');
console.assert(vbHtml.includes('Collected'), 'Missing Collected in individual batch budget!');
console.assert(vbHtml.includes('data-act="open-budget"'), 'Missing open-budget in individual batch budget!');
console.log('viewBatch checks passed!');

console.log('\nAll tests PASSED successfully!');

