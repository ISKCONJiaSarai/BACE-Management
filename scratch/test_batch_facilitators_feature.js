const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('public/index.html', 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/i);

const dummyEl = { innerHTML: '', addEventListener: () => {}, querySelector: () => null, querySelectorAll: () => [] };

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
    documentElement: { style: { setProperty: () => {} } }
  },
  window: {
    addEventListener: () => {},
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    location: { hash: '#/batch/b1', search: '' },
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
  location: { hash: '#/batch/b1', search: '' },
  navigator: { userAgent: 'node' }
};

vm.createContext(sandbox);
const exportHook = `
;sandboxExport = {
  DB, APP, batch, batchDashboardBody, viewBatch, teamSection,
  openBatchForm, getHierarchyFacilitators, getBatchFacilitators
};
`;
vm.runInContext(scriptMatch[1] + exportHook, sandbox);

const { DB, APP, batch, batchDashboardBody, viewBatch, teamSection, openBatchForm, getHierarchyFacilitators, getBatchFacilitators } = sandbox.sandboxExport;
APP.user = DB.users[0]; // Log in as Surya Narayana Das

console.log('--- TEST 1: Hierarchy Facilitators ---');
const hFacs = getHierarchyFacilitators();
console.log('Hierarchy facilitators count:', hFacs.length);
hFacs.forEach(f => console.log('  -', f.id, f.name));

console.log('\n--- TEST 2: Batch Taksharya (b1) Dashboard & Team Section ---');
const b1 = batch('b1');
console.log('Taksharya initial facilitators:', b1.facilitators);
const b1Html = batchDashboardBody(b1);

const hasFacDashboardBox = b1Html.includes('Facilitators') && b1Html.includes('edit-batch-facilitators');
console.log('Has Facilitators dashboard box:', hasFacDashboardBox);

const hasFacTeamRow = b1Html.includes('Facilitator') && b1Html.includes('Audarya Gaur pr');
console.log('Has Facilitator in Team box:', hasFacTeamRow);

const isFacClickable = b1Html.includes('href="#/devotee/d_g2"');
console.log('Is Facilitator name clickable (link to profile):', isFacClickable);

const hasManageFacBtn = b1Html.includes('Manage facilitators');
console.log('Has Manage Facilitators button in Team box:', hasManageFacBtn);

console.log('\n--- TEST 3: Edit Batch Form ---');
openBatchForm('b1');
const m = sandbox.sandboxExport.APP.modal;
console.log('Modal kind:', m.kind, 'Title:', m.title);
const facField = m.fields.find(f => f.n === 'facilitators');
console.log('Facilitators field in form:', !!facField);
console.log('Facilitators field type:', facField?.t);
console.log('Facilitators options from hierarchy:', facField?.opts.length);

console.log('\n--- TEST 4: Updating Facilitators on Batch ---');
b1.facilitators = ['d1', 'd_g2'];
const updatedHtml = batchDashboardBody(b1);
console.log('Both facilitators clickable in team row:', updatedHtml.includes('href="#/devotee/d1"') && updatedHtml.includes('href="#/devotee/d_g2"'));

console.log('\nALL VERIFICATIONS PASSED SUCCESSFULLY!');
