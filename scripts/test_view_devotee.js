const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');

const startScript = html.indexOf('<script>');
const endScript = html.lastIndexOf('</script>');
const js = html.substring(startScript + 8, endScript);

const vm = require('vm');
const window = {
  location: { hash: '#/devotee/d_g12', search: '' },
  localStorage: {
    getItem: (k) => null,
    setItem: () => {},
    removeItem: () => {}
  },
  addEventListener: () => {},
  document: {
    head: { appendChild: () => {} },
    createElement: () => ({ rel: '', href: '' }),
    getElementById: () => ({ innerHTML: '', appendChild: () => {}, addEventListener: () => {} }),
    addEventListener: () => {},
    querySelector: () => null,
    querySelectorAll: () => []
  },
  google: { accounts: { id: { initialize: () => {}, renderButton: () => {}, prompt: () => {} } } },
  btoa: (str) => Buffer.from(str).toString('base64'),
  Blob: globalThis.Blob,
  URL: { createObjectURL: () => 'blob:test' },
  URLSearchParams: globalThis.URLSearchParams
};
window.window = window;
window.document.defaultView = window;

const context = vm.createContext({
  window,
  document: window.document,
  localStorage: window.localStorage,
  location: window.location,
  btoa: window.btoa,
  Blob: window.Blob,
  URL: window.URL,
  URLSearchParams: window.URLSearchParams,
  console,
  setTimeout: () => {},
  clearTimeout: () => {},
  setInterval: () => {},
  clearInterval: () => {}
});

try {
  vm.runInContext(js, context);

  const runner = `
    APP.user = {
      id: 'u1',
      role: 'area_leader',
      devotee: 'd1',
      name: 'Surya Narayana Das',
      email: 'suryakiranjune2@gmail.com'
    };
    
    let errors = 0;
    console.log('Total devotees in DB:', DB.devotees.length);

    // 1. Test seeded devotees
    for (const d of DB.devotees) {
      APP.route = '#/devotee/' + d.id;
      for (const tab of ['Overview','Preaching','Seva','Attendance','Care','Sadhana','Timeline','Friends','Notes']) {
        APP.tab.devotee = tab;
        const res = routeView();
        if (res.includes('View error')) {
          errors++;
          console.error('ERROR on devotee', d.id, d.name, 'tab:', tab);
        }
      }
    }

    // 2. Test edge case devotees (imported via CSV or MongoDB with ObjectId strings or populated objects)
    const mockImported = [
      {
        id: 'mock1',
        name: 'Adbut Gaur pr',
        email: 'adbut@test.com',
        phone: '9999999999',
        batch: '65f123456789012345678901', // unmapped mongo ObjectId
        dept: '65f123456789012345678902',
        careGroup: '65f123456789012345678903',
        facilitator: '65f123456789012345678904',
        mentor: 'nonexistent',
        friends: ['nonexistent_friend']
      },
      {
        id: 'mock2',
        name: 'Null Fields Devotee',
        batch: null,
        dept: null,
        careGroup: null,
        facilitator: null,
        mentor: null,
        friends: []
      },
      {
        id: 'mock3',
        name: 'Populated Objects Devotee',
        batch: { _id: 'b8', name: 'Gaurvani Sabha' },
        dept: { _id: 'dp1', name: 'Sankirtan' },
        careGroup: { _id: 'g1', name: 'Group 1' },
        facilitator: { _id: 'f1', name: 'Facilitator Pr' },
        friends: [{ _id: 'd1', name: 'Surya' }]
      }
    ];

    for (const m of mockImported) {
      const norm = normalizeDevotee(m);
      DB.devotees.push(norm);
      APP.route = '#/devotee/' + norm.id;
      for (const tab of ['Overview','Preaching','Seva','Attendance','Care','Sadhana','Timeline','Friends','Notes']) {
        APP.tab.devotee = tab;
        const res = routeView();
        if (res.includes('View error')) {
          errors++;
          console.error('ERROR on mock devotee', norm.id, norm.name, 'tab:', tab);
        }
      }
    }

    console.log('Finished testing! Total errors:', errors);
  `;
  vm.runInContext(runner, context);
} catch(e) {
  console.error('Execution failure:', e);
}
