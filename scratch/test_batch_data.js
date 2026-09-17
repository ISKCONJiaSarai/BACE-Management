const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');

// Extract the script body
const startTag = '<script>';
const endTag = '</script>';
const scriptStart = html.indexOf('<script>');
const scriptEnd = html.lastIndexOf('</script>');
const scriptContent = html.substring(scriptStart + 8, scriptEnd);

// Let's create a minimal mocked environment
const jsdom = require('node:vm');
const context = {
  window: { addEventListener: () => {} },
  document: { 
    addEventListener: () => {},
    getElementById: () => ({ addEventListener: () => {} }),
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({ appendChild: () => {}, setAttribute: () => {} }),
    head: { appendChild: () => {} },
    body: { appendChild: () => {} }
  },
  navigator: { userAgent: 'node' },
  localStorage: {
    store: {},
    getItem(k) { return this.store[k] || null; },
    setItem(k, v) { this.store[k] = String(v); },
    removeItem(k) { delete this.store[k]; }
  },
  sessionStorage: { getItem: () => null, setItem: () => {} },
  btoa: (str) => Buffer.from(str).toString('base64'),
  atob: (b64) => Buffer.from(b64, 'base64').toString('utf8'),
  Blob: global.Blob || class Blob {},
  URL: global.URL || { createObjectURL: () => '' },
  URLSearchParams: global.URLSearchParams,
  console,
  setTimeout: () => {},
  setInterval: () => {},
  location: { hash: '#/batch/b1', search: '', pathname: '/' }
};

jsdom.createContext(context);
try {
  jsdom.runInContext(scriptContent, context);
  console.log('Script ran successfully!');
  const b1 = context.batch('b1');
  console.log('Batch b1:', b1.name);
  console.log('b1.volunteers:', b1.volunteers);
  console.log('b1.facilitators:', b1.facilitators);
  
  const vols = context.getBatchVolunteers('b1');
  console.log('getBatchVolunteers(b1) count:', vols.length);
  console.log('Volunteers names:', vols.map(v => v.name));

  const funnel = context.batchPreachingFunnel('b1');
  console.log('Funnel stages:', funnel.map(f => `${f.l}: ${f.v}`));

  const servingDevs = context.getFunnelStageDevotees('b1', 'serving');
  console.log('Serving devotees count:', servingDevs.length);
  console.log('Serving devotees:', servingDevs.map(d => ({
    name: d.name,
    dept: d.dept,
    service: d.service,
    skills: d.skills,
    att: d.attendancePct,
    roles: d.roles,
    appointment: d.appointment,
    isFacilitator: d.isFacilitator
  })));

} catch (err) {
  console.error('Error running script:', err);
}
