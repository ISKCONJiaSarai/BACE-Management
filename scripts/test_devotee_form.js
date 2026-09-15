const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');

const startScript = html.indexOf('<script>');
const endScript = html.lastIndexOf('</script>');
const js = html.substring(startScript + 8, endScript);

const vm = require('vm');
const window = {
  location: { hash: '#/devotees', search: '' },
  localStorage: {
    getItem: (k) => null,
    setItem: () => {},
    removeItem: () => {}
  },
  addEventListener: () => {},
  document: {
    head: { appendChild: () => {} },
    body: { appendChild: () => {} },
    documentElement: { style: { setProperty: () => {} } },
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

    // 1. Test opening the form for Add Devotee
    openDevoteeForm(null);
    console.log('Modal title:', APP.modal.title);
    console.log('Total Fields count:', APP.modal.fields.length);

    const orgField = APP.modal.fields.find(f => f.n === 'org');
    const occField = APP.modal.fields.find(f => f.n === 'occupation');
    const eduField = APP.modal.fields.find(f => f.n === 'highestEducation');
    const jobField = APP.modal.fields.find(f => f.n === 'presentStudiesOrJob');
    const attField = APP.modal.fields.find(f => f.n === 'attendancePct' || f.n === 'attendance');

    console.log('org field type:', orgField?.t, '(Expected: text)');
    console.log('occupation field type:', occField?.t, '(Expected: text)');
    console.log('highestEducation field type:', eduField?.t, '(Expected: text)');
    console.log('presentStudiesOrJob field type:', jobField?.t, '(Expected: text)');
    console.log('attendance field present:', !!attField, '(Expected: false)');

    if (orgField?.t !== 'text' || occField?.t !== 'text' || eduField?.t !== 'text' || jobField?.t !== 'text') {
      throw new Error('Fields are not fillable text boxes!');
    }
    if (attField) {
      throw new Error('Attendance option should NOT be present!');
    }

    // Verify template fields presence
    const expectedTemplateFields = [
      'name', 'phone', 'email', 'batch', 'batchRole', 'residence', 'attendanceMode',
      'level', 'status', 'org', 'occupation', 'highestEducation', 'presentStudiesOrJob',
      'dept', 'careGroup', 'sadhanaRounds', 'skills'
    ];
    for (const fieldName of expectedTemplateFields) {
      const found = APP.modal.fields.find(f => f.n === fieldName);
      if (!found) throw new Error('Missing expected template field: ' + fieldName);
    }
    console.log('All expected template fields are present in the form!');

    // 2. Test rendering the modal HTML
    const html = formModal();
    console.log('Modal HTML generated successfully, length:', html.length);

    console.log('--- ALL ADD DEVOTEE CHECKS PASSED CLEANLY! ---');
  `;
  vm.runInContext(runner, context);
} catch(e) {
  console.error('Test failed:', e);
  process.exit(1);
}
