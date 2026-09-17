const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

const code = fs.readFileSync('public/index.html', 'utf8');

// Extract script
const sStart = code.indexOf('<script>');
const sEnd = code.lastIndexOf('</script>');
const scriptSrc = code.substring(sStart + 8, sEnd);

// Mock browser environment
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: k => store[k] || null,
    setItem: (k, v) => { store[k] = v.toString(); },
    removeItem: k => { delete store[k]; },
    clear: () => { store = {}; }
  };
})();

const domEvents = {};
const documentMock = {
  getElementById: (id) => {
    if (id === 'app') return { innerHTML: '' };
    if (id === 'sbscroll') return { scrollTop: 0, addEventListener: ()=>{} };
    return null;
  },
  querySelector: (sel) => {
    return null;
  },
  querySelectorAll: () => [],
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

// Execute script in sandbox
try {
  vm.runInContext(scriptSrc, sandbox);
  console.log("Script executed in sandbox successfully!");
} catch (e) {
  console.error("Sandbox execution error:", e);
  process.exit(1);
}

// Now test activityModal and devotee assignment flow
const DB = vm.runInContext('DB', sandbox);
const APP = vm.runInContext('APP', sandbox);
APP.user = DB.users[0]; // Set active user (admin)
const act = vm.runInContext('act', sandbox);
const activityModal = vm.runInContext('activityModal', sandbox);

// Find an activity
const a = DB.activities[0];
console.log("Testing with activity:", a.name, "(id:", a.id, ")");

// 1. Check initial activityModal rendering
const initialHtml = activityModal(a.id);
assert.ok(initialHtml.includes('id="scope-devotee-sel"'), "Dropdown present");
assert.ok(initialHtml.includes('data-act="side-select-assign"'), "side-select-assign attribute present");
assert.ok(initialHtml.includes('data-act="side-filter-batch"'), "side-filter-batch present");
console.log("PASS: activityModal renders both dropdowns properly.");

// 2. Count initial assignments
const initialAsgCount = DB.assignments.filter(x => x.activity === a.id).length;
console.log("Initial assignments for activity:", initialAsgCount);

// 3. Simulate selecting a devotee via side-select-assign change event
const availableDevotee = DB.devotees.find(d => d.status === 'Active' && !DB.assignments.some(x => x.activity === a.id && x.devotee === d.id));
console.log("Selecting devotee:", availableDevotee.name, "(id:", availableDevotee.id, ")");

const changeHandler = domEvents['change'];
assert.ok(typeof changeHandler === 'function', "changeHandler exists");

changeHandler({
  target: {
    closest: (sel) => {
      if (sel === '[data-act]') {
        return {
          dataset: { act: 'side-select-assign', a: a.id },
          value: availableDevotee.id
        };
      }
      return null;
    }
  }
});

// 4. Verify assignment was created
const newAsgCount = DB.assignments.filter(x => x.activity === a.id).length;
assert.strictEqual(newAsgCount, initialAsgCount + 1, "Assignment count increased by 1");
const createdAsg = DB.assignments.find(x => x.activity === a.id && x.devotee === availableDevotee.id);
assert.ok(createdAsg, "Created assignment found in DB.assignments");
console.log("PASS: Devotee automatically assigned upon dropdown selection.");

// 5. Verify saved to localStorage
const storedAsg = JSON.parse(localStorageMock.getItem('bace_assignments_store'));
assert.ok(storedAsg.some(x => x.activity === a.id && x.devotee === availableDevotee.id), "Saved in localStorage");
console.log("PASS: Assignment successfully persisted in storage.");

// 6. Verify activityModal now shows the assigned devotee and removes them from available options
const updatedHtml = activityModal(a.id);
assert.ok(updatedHtml.includes(availableDevotee.name), "Devotee name appears in assigned list");
// Devotee should no longer be an option in scope-devotee-sel
assert.ok(!updatedHtml.includes(`<option value="${availableDevotee.id}">`), "Devotee no longer listed in available dropdown");
console.log("PASS: Assigned devotee now displayed in assigned list and removed from dropdown options.");

// 7. Test clicking on SELECT does not trigger click handler
const clickHandler = domEvents['click'];
let prevented = false;
clickHandler({
  target: {
    tagName: 'SELECT',
    closest: (sel) => {
      if (sel === '[data-act]') return { tagName: 'SELECT', dataset: { act: 'side-filter-batch' } };
      return null;
    }
  },
  preventDefault: () => { prevented = true; },
  stopPropagation: () => {}
});
assert.strictEqual(prevented, false, "Click on select element was not prevented/intercepted");
console.log("PASS: Click on SELECT is completely protected and never intercepted.");

console.log("\nALL END-TO-END FLOW TESTS PASSED FLAWLESSLY!");
process.exit(0);
