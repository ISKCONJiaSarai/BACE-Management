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
  querySelector: () => null,
  querySelectorAll: (sel) => {
    if (sel === '#modalform [name]') return modalformElements;
    return [];
  },
  createElement: () => ({ rel: '', href: '', setAttribute: ()=>{} }),
  head: { appendChild: ()=>{} },
  addEventListener: (event, handler) => { domEvents[event] = handler; },
  body: { classList: { add: ()=>{}, remove: ()=>{} }, appendChild: ()=>{} },
  documentElement: { style: { setProperty: ()=>{} } }
};

const windowMock = { addEventListener: () => {}, location: { hash: '#/' } };
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
const normalizeDevotee = vm.runInContext('normalizeDevotee', sandbox);
const openDevoteeForm = vm.runInContext('openDevoteeForm', sandbox);
const formModal = vm.runInContext('formModal', sandbox);
const viewDevotees = vm.runInContext('viewDevotees', sandbox);
const parseCSV = vm.runInContext('parseCSV', sandbox);

// 1. Test normalizeDevotee normalizes gender
const testM = normalizeDevotee({ name: 'Test M', gender: 'M' });
assert.strictEqual(testM.gender, 'Male', "M normalized to Male");
const testF = normalizeDevotee({ name: 'Test F', gender: 'female' });
assert.strictEqual(testF.gender, 'Female', "female normalized to Female");
console.log("PASS: normalizeDevotee accurately normalizes gender values.");

// 2. Test openDevoteeForm includes Gender select field
openDevoteeForm(DB.devotees[0].id);
assert.strictEqual(APP.modal.kind, 'form');
const fModalHtml = formModal();
assert.ok(fModalHtml.includes('name="gender"'), "Devotee form has gender select field");
assert.ok(fModalHtml.includes('<option value="Male"'), "Has Male option");
assert.ok(fModalHtml.includes('<option value="Female"'), "Has Female option");
console.log("PASS: openDevoteeForm contains Gender dropdown with Male and Female options.");

// 3. Test viewDevotees table rendering includes Gender column
const viewDevHtml = viewDevotees();
assert.ok(viewDevHtml.includes('<span>Gender</span>'), "Devotee directory has Gender column");
assert.ok(viewDevHtml.includes('data-n="gender"'), "Devotee directory has Gender filter dropdown");
console.log("PASS: viewDevotees table renders Gender column and filter dropdown.");

// 4. Test parseCSV parses gender
const sampleCsv = `Name,Gender,Phone,Email,Batch
Radhika Devi,Female,9876543203,radhika@example.com,Gaurvani Sabha
Mukunda Datta,Male,9876543204,mukunda@example.com,Gaurvani Sabha`;

const parsed = parseCSV(sampleCsv);
assert.strictEqual(parsed.length, 2, "Parsed 2 rows");
assert.strictEqual(parsed[0].gender, 'Female', "Parsed Female gender");
assert.strictEqual(parsed[1].gender, 'Male', "Parsed Male gender");
console.log("PASS: parseCSV accurately extracts and maps Gender column.");

console.log("\nALL GENDER COLUMN & DATABASE TESTS PASSED! ✨");
process.exit(0);
