const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');

// Extract all <script> content from index.html (excluding external src scripts)
const scriptRegex = /<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let jsCode = '';
while ((match = scriptRegex.exec(html)) !== null) {
  jsCode += match[1] + '\n;';
}

console.log('Extracted JS lines from index.html:', jsCode.split('\n').length);

// Mock minimal browser environment
const sandbox = {
  window: {
    addEventListener: () => {},
    scrollTo: () => {},
    innerWidth: 1200,
    innerHeight: 800,
    location: { hash: '' }
  },
  document: {
    addEventListener: () => {},
    getElementById: id => (id === 'app' ? { innerHTML: '', style: {}, scrollTop: 0, scrollHeight: 0 } : null),

    querySelector: () => null,
    querySelectorAll: () => [],
    head: { appendChild: () => {} },
    createElement: () => ({ setAttribute: () => {}, style: {} }),
    body: { classList: { add: () => {}, remove: () => {} } }

  },
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  },
  sessionStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  },
  location: { hash: '', search: '' },

  navigator: { userAgent: 'Node' },
  btoa: str => Buffer.from(str).toString('base64'),
  atob: b64 => Buffer.from(b64, 'base64').toString('utf8'),
  Blob: typeof Blob !== 'undefined' ? Blob : class Blob { constructor() {} },
  URL: typeof URL !== 'undefined' ? URL : { createObjectURL: () => '' },
  URLSearchParams: typeof URLSearchParams !== 'undefined' ? URLSearchParams : class URLSearchParams { constructor() {} get() { return null; } },
  console,



  setTimeout: () => {},
  clearTimeout: () => {},
  setInterval: () => {},
  clearInterval: () => {},
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
};

sandbox.window.window = sandbox.window;
sandbox.window.document = sandbox.document;
sandbox.document.defaultView = sandbox.window;

const ctx = vm.createContext(sandbox);

try {
  vm.runInContext(jsCode, ctx);
  console.log('JavaScript compiled and executed without error!');
} catch (err) {
  console.error('Compilation/Execution error:', err);
  process.exit(1);
}

// Test stats and views for different user roles
const rolesToTest = ['area_leader', 'coordinator', 'internal_manager', 'preaching_manager', 'care_manager', 'dept_head', 'preaching_coord', 'facilitator', 'devotee', 'admin'];

const viewsToTest = [
  { name: 'viewDashboard', fn: 'viewDashboard' },
  { name: 'viewToday', fn: 'viewToday' },
  { name: 'viewDevotees', fn: 'viewDevotees' },
  { name: 'viewMgmt', fn: 'viewMgmt' },
  { name: 'viewDepts', fn: 'viewDepts' },
  { name: 'viewAssign', fn: 'viewAssign' },
  { name: 'viewAttendance', fn: 'viewAttendance' },
  { name: 'viewDeptReports', fn: 'viewDeptReports' },
  { name: 'viewInventory', fn: 'viewInventory' },
  { name: 'viewSops', fn: 'viewSops' },
  { name: 'viewActions', fn: 'viewActions' },
  { name: 'viewPreaching', fn: 'viewPreaching' },
  { name: 'viewBatches', fn: 'viewBatches' },
  { name: 'viewContacts', fn: 'viewContacts' },
  { name: 'viewFollowups', fn: 'viewFollowups' },
  { name: 'viewClasses', fn: 'viewClasses' },
  { name: 'viewBatchAttendance', fn: 'viewBatchAttendance' },
  { name: 'viewPreachingReports', fn: 'viewPreachingReports' },
  { name: 'viewCare', fn: 'viewCare' },
  { name: 'viewFriends', fn: 'viewFriends' },
  { name: 'viewGroups', fn: 'viewGroups' },
  { name: 'viewSwabhav', fn: 'viewSwabhav' },
  { name: 'viewSadhana', fn: 'viewSadhana' },
  { name: 'viewFacilitators', fn: 'viewFacilitators' },
  { name: 'viewCamps', fn: 'viewCamps' },
  { name: 'viewTempleVisits', fn: 'viewTempleVisits' },
  { name: 'viewMeetings', fn: 'viewMeetings' },
  { name: 'viewCareFollowups', fn: 'viewCareFollowups' },
  { name: 'viewCareReports', fn: 'viewCareReports' },
  { name: 'viewReports', fn: 'viewReports' },
  { name: 'viewCalendar', fn: 'viewCalendar' },
  { name: 'viewMessages', fn: 'viewMessages' },
  { name: 'viewNotifications', fn: 'viewNotifications' },
  { name: 'viewAdmin', fn: 'viewAdmin' },
  { name: 'viewMore', fn: 'viewMore' }
];

let totalStatsRendered = 0;
let totalClickableStats = 0;

for (const r of rolesToTest) {
  const user = vm.runInContext(`DB.users.find(u => u.role === '${r}') || { id: 'u1', role: '${r}', devotee: 'd1', name: 'Test User' }`, ctx);
  vm.runInContext(`APP.user = ${JSON.stringify(user)}`, ctx);
  for (const v of viewsToTest) {
    try {
      const output = vm.runInContext(`${v.fn}()`, ctx);
      if (typeof output !== 'string') {
        throw new Error(`View ${v.name} did not return a string for role ${r}`);
      }
      // Count stats rendered
      const statMatches = output.match(/class="stat\b[^"]*"/g) || [];
      const clickMatches = output.match(/class="stat\b[^"]*\bclick\b[^"]*"/g) || [];
      totalStatsRendered += statMatches.length;
      totalClickableStats += clickMatches.length;
    } catch (err) {
      console.error(`ERROR rendering ${v.name} for role ${r}:`, err.message);
      process.exit(1);
    }
  }
}


console.log(`Successfully verified all ${viewsToTest.length} views across all ${rolesToTest.length} roles!`);
console.log(`Rendered stats checked across role/view combinations: ${totalStatsRendered}`);
console.log(`Clickable stats verified across role/view combinations: ${totalClickableStats}`);
if (totalStatsRendered === totalClickableStats && totalStatsRendered > 0) {
  console.log('100% of rendered stat cards are confirmed clickable!');
} else {
  console.warn(`Note: ${totalStatsRendered - totalClickableStats} stats without click class.`);
}
