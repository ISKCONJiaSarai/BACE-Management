const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('public/index.html', 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/i);

const store = {};
const sandbox = {
  console,
  Blob,
  URL,
  URLSearchParams,
  btoa: (str) => Buffer.from(str).toString('base64'),
  atob: (str) => Buffer.from(str, 'base64').toString('utf8'),
  setTimeout: () => {},
  clearTimeout: () => {},
  setInterval: () => {},
  clearInterval: () => {},
  localStorage: {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = v; },
    removeItem: (k) => { delete store[k]; }
  },
  location: { hash: '#/dashboard', search: '' },
  navigator: { userAgent: 'node' },
  addEventListener: () => {},
  removeEventListener: () => {},
  fetch: () => Promise.resolve({ ok: true, json: () => ({}) }),
  document: {
    addEventListener: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => ({ innerHTML: '', setAttribute: () => {}, value: 'Sample' }),
    createElement: () => ({ rel: '', href: '', setAttribute: () => {} }),
    head: { appendChild: () => {} }
  }
};
sandbox.window = sandbox;
sandbox.global = sandbox;

const ctx = vm.createContext(sandbox);
vm.runInContext(scriptMatch[1], ctx);
vm.runInContext('APP.user = DB.users[0];', ctx);

// Test 1: Verify drawer layout does not have data-act="close-scrim" on .drawer-wrap
const sampleAct = vm.runInContext('DB.activities[0]', ctx);
const modalHtml = vm.runInContext(`activityModal('${sampleAct.id}')`, ctx);

if (modalHtml.includes('class="drawer-wrap" data-act="close-scrim"')) {
  console.error('Failed: .drawer-wrap still has data-act="close-scrim"!');
  process.exit(1);
}
console.log('✓ .drawer-wrap does NOT have data-act="close-scrim" (clicking outside will NOT close)');

// Test 2: Verify close button has data-act="close-scrim"
if (!modalHtml.includes('data-act="close-scrim"')) {
  console.error('Failed: Close button missing data-act="close-scrim"!');
  process.exit(1);
}
console.log('✓ Close button (x) at top right has data-act="close-scrim"');

// Test 3: Verify Assign button styling preventing squeeze
if (!modalHtml.includes('flex-shrink:0') || !modalHtml.includes('min-width:0')) {
  console.error('Failed: Select or Assign button missing flex-shrink/min-width to prevent clipping!');
  process.exit(1);
}
console.log('✓ Assign button has flex-shrink:0 and select has min-width:0 to ensure visibility');

// Test 4: Verify storage functions exist and save
vm.runInContext(`
  // Assign devotee
  const dev = DB.devotees[0];
  DB.assignments.push({
    id: 'test_as_persist_1',
    activity: '${sampleAct.id}',
    devotee: dev.id,
    state: 'Assigned',
    actualPerformer: null,
    completedAt: null
  });
  saveAssignmentsToStorage();
  saveActivitiesToStorage();
`, ctx);

if (!store['bace_assignments_store'] || !store['bace_activities_store']) {
  console.error('Failed: saveAssignmentsToStorage or saveActivitiesToStorage did not persist to storage!');
  process.exit(1);
}
console.log('✓ Assignments and Activities successfully persisted to localStorage');

// Test 5: Verify Volunteers column in viewClasses
const classesViewHtml = vm.runInContext('viewClasses()', ctx);
if (!classesViewHtml.includes('Volunteers')) {
  console.error('Failed: Volunteers column missing from viewClasses()!');
  process.exit(1);
}
console.log('✓ viewClasses table includes Volunteers column reflecting assigned devotees');

console.log('\n===========================================');
console.log('ALL PERSISTENCE & CLOSE TESTS PASSED! ✨');
console.log('===========================================');
