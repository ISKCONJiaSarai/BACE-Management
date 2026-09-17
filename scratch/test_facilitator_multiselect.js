const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

const code = fs.readFileSync('public/index.html', 'utf8');

// Extract script
const sStart = code.indexOf('<script>');
const sEnd = code.lastIndexOf('</script>');
const scriptSrc = code.substring(sStart + 8, sEnd);

// Basic DOM setup for testing
const domEvents = {};
let modalformElements = [];

const documentMock = {
  getElementById: (id) => {
    if (id === 'app') return { innerHTML: '' };
    if (id === 'sbscroll') return { scrollTop: 0, addEventListener: ()=>{} };
    if (id.startsWith('ms-menu-')) return { style: { display: 'none' }, querySelector: ()=>null };
    if (id.startsWith('ms-arrow-')) return { textContent: '▼' };
    return null;
  },
  querySelector: (sel) => {
    return null;
  },
  querySelectorAll: (sel) => {
    if (sel === '#modalform [name]') {
      return modalformElements;
    }
    if (sel === '.ms-menu') return [];
    if (sel === '.ms-arrow') return [];
    return [];
  },
  createElement: () => ({ rel: '', href: '', setAttribute: ()=>{} }),
  head: { appendChild: ()=>{} },
  addEventListener: (event, handler) => {
    domEvents[event] = handler;
  },
  body: { classList: { add: ()=>{}, remove: ()=>{} }, appendChild: ()=>{} },
  documentElement: { style: { setProperty: ()=>{} } }
};

const windowMock = {
  addEventListener: () => {},
  location: { hash: '#/' }
};

const localStorageMock = (function() {
  let store = {};
  return {
    getItem: k => store[k] || null,
    setItem: (k, v) => { store[k] = v.toString(); },
    removeItem: k => { delete store[k]; },
    clear: () => { store = {}; }
  };
})();

const locationMock = { origin: 'http://localhost:5000', pathname: '/', hash: '#/', search: '' };

const sandbox = {
  document: documentMock,
  window: windowMock,
  location: locationMock,
  localStorage: localStorageMock,
  navigator: { userAgent: 'test' },
  btoa: str => Buffer.from(str).toString('base64'),
  atob: b64 => Buffer.from(b64, 'base64').toString(),
  Blob: global.Blob || class Blob { constructor(parts) { this.parts = parts; } },
  URL: { createObjectURL: () => 'blob:mock' },
  URLSearchParams: global.URLSearchParams,
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  alert: console.log,
  prompt: () => null,
  confirm: () => true
};

vm.createContext(sandbox);

try {
  vm.runInContext(scriptSrc, sandbox);
  console.log("Script loaded and executed successfully in sandbox.");
} catch (e) {
  console.error("Sandbox load error:", e);
  process.exit(1);
}

const DB = vm.runInContext('DB', sandbox);
const APP = vm.runInContext('APP', sandbox);
APP.user = DB.users[0];
const batch = vm.runInContext('batch', sandbox);
const openBatchForm = vm.runInContext('openBatchForm', sandbox);
const formModal = vm.runInContext('formModal', sandbox);
const collect = vm.runInContext('collect', sandbox);

// 1. Test opening batch form for batch 1
const b1 = DB.batches[0];
console.log("Testing with batch:", b1.name, "initial facilitators:", b1.facilitators);

openBatchForm(b1.id);
assert.strictEqual(APP.modal.kind, 'form', "Modal is form");
assert.strictEqual(APP.modal.title, 'Edit batch', "Modal title is Edit batch");

// 2. Render formModal HTML
const modalHtml = formModal();
assert.ok(modalHtml.includes('class="field ms-container" data-ms="facilitators"'), "Form has ms-container for facilitators");
assert.ok(modalHtml.includes('class="ms-trigger"'), "Form has ms-trigger for facilitators");
assert.ok(modalHtml.includes('id="ms-menu-facilitators"'), "Form has ms-menu-facilitators");
assert.ok(modalHtml.includes('input type="checkbox" name="facilitators"'), "Form has checkboxes named facilitators");
console.log("PASS: formModal renders multi-select dropdown field for facilitators.");

// 3. Test collect() gathering multiple checked facilitators
modalformElements = [
  { name: 'name', value: b1.name, type: 'text' },
  { name: 'desc', value: b1.desc, type: 'textarea' },
  { name: 'level', value: '1', type: 'select' },
  { name: 'incharge', value: 'd1', type: 'select' },
  { name: 'coordinator', value: 'd1', type: 'select' },
  { name: 'freq', value: 'Weekly', type: 'select' },
  { name: 'day', value: 'Thu', type: 'select' },
  { name: 'time', value: '7:00 pm', type: 'text' },
  { name: 'start', value: '2025-09-22', type: 'date' },
  { name: 'allocated', value: '5000', type: 'number' },
  { name: 'spent', value: '1000', type: 'number' },
  { name: 'status', value: 'Active', type: 'select' },
  // 3 facilitators checked
  { name: 'facilitators', value: 'd1', type: 'checkbox', checked: true },
  { name: 'facilitators', value: 'd2', type: 'checkbox', checked: true },
  { name: 'facilitators', value: 'd3', type: 'checkbox', checked: false },
  { name: 'facilitators', value: 'd4', type: 'checkbox', checked: true }
];

const collected = collect();
console.log("Collected facilitators:", collected.facilitators);
assert.strictEqual(JSON.stringify(collected.facilitators), JSON.stringify(['d1', 'd2', 'd4']), "All 3 checked facilitators collected");
console.log("PASS: collect() properly returns array of all checked facilitators.");

// 4. Test save-batch action
const clickHandler = domEvents['click'];
assert.ok(typeof clickHandler === 'function', "Click handler exists");

// Trigger save-batch
clickHandler({
  target: {
    closest: (sel) => {
      if (sel === '[data-act]') return { dataset: { act: 'save-batch' } };
      return null;
    },
    tagName: 'BUTTON'
  },
  preventDefault: () => {},
  stopPropagation: () => {}
});

assert.strictEqual(JSON.stringify(b1.facilitators), JSON.stringify(['d1', 'd2', 'd4']), "Batch facilitators updated in DB");
console.log("PASS: Batch facilitators saved successfully to DB!");

// 5. Verify saved in localStorage
const storedBatches = JSON.parse(localStorageMock.getItem('bace_batches_store'));
const storedB1 = storedBatches.find(x => x.id === b1.id);
assert.strictEqual(JSON.stringify(storedB1.facilitators), JSON.stringify(['d1', 'd2', 'd4']), "Batch facilitators persisted to localStorage");
console.log("PASS: Batch facilitators persisted to localStorage.");

console.log("\nALL FACILITATOR MULTI-SELECT TESTS PASSED SUCCESSFULLY! ✨");
process.exit(0);
