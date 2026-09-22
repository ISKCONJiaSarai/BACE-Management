const fs = require('fs');

global.window = {
  open: function(url, target) {
    let docContent = '';
    return {
      document: {
        open: () => {},
        write: (html) => { docContent += html; },
        close: () => {}
      },
      print: () => {},
      close: () => {},
      focus: () => {},
      _getHTML: () => docContent
    };
  },
  matchMedia: () => ({ matches: false, addEventListener: () => {} }),
  addEventListener: () => {},
  removeEventListener: () => {}
};

global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

global.navigator = { userAgent: 'node' };
global.location = { href: '', search: '', pathname: '', hash: '', origin: 'http://localhost' };
global.window.location = global.location;

global.URL = { createObjectURL: () => '' };
global.Blob = function(){};
global.Audio = function(){ return { src: '', play: () => Promise.resolve(), pause: () => {}, addEventListener: () => {} }; };
const makeDummyEl = () => ({ style: {}, classList: { add: ()=>{}, remove: ()=>{} }, setAttribute: ()=>{}, appendChild: ()=>{}, innerHTML: '', addEventListener: ()=>{} });
global.app = makeDummyEl();
global.document = {
  head: { appendChild: () => {} },
  documentElement: { setAttribute: () => {}, classList: { add: ()=>{}, remove: ()=>{} } },
  getElementById: (id) => (id === 'app' ? global.app : makeDummyEl()),
  querySelector: () => makeDummyEl(),
  querySelectorAll: () => [],
  createElement: (tag) => makeDummyEl(),
  body: { appendChild: () => {} },
  addEventListener: () => {},
  removeEventListener: () => {}
};

global.toast = (msg, icon) => console.log('TOAST:', icon, msg);

// Read inline_app.js
const code = fs.readFileSync('scratch/inline_app.js', 'utf8');

// Execute
eval(code + '\nglobal.DB = DB; global.APP = APP; global.ROLES = ROLES;');

console.log('App code loaded into sandbox successfully!');

// Test Batch Monthly Report
if (typeof exportBatchMonthlyReportPDF === 'function') {
  let winRef;
  const origOpen = window.open;
  window.open = function() {
    winRef = origOpen.apply(this, arguments);
    return winRef;
  };
  const bids = (DB.batches || []).map(b => b.id);
  console.log('Available batches:', bids);
  if (bids.length) {
    exportBatchMonthlyReportPDF(bids[0]);
    if (winRef) {
      fs.writeFileSync('scratch/rendered_batch_report.html', winRef._getHTML(), 'utf8');
      console.log('Saved scratch/rendered_batch_report.html (len ' + winRef._getHTML().length + ')');
    }
  }
}

// Test Care Report
if (typeof exportCareReportPDF === 'function') {
  let winRef;
  const origOpen = window.open;
  window.open = function() {
    winRef = origOpen.apply(this, arguments);
    return winRef;
  };
  exportCareReportPDF();
  if (winRef) {
    fs.writeFileSync('scratch/rendered_care_report.html', winRef._getHTML(), 'utf8');
    console.log('Saved scratch/rendered_care_report.html (len ' + winRef._getHTML().length + ')');
  }
}

// Test Devotee Report
if (typeof exportDevoteeReportPDF === 'function') {
  let winRef;
  const origOpen = window.open;
  window.open = function() {
    winRef = origOpen.apply(this, arguments);
    return winRef;
  };
  exportDevoteeReportPDF('deity', 'weekly');
  if (winRef) {
    fs.writeFileSync('scratch/rendered_devotee_report.html', winRef._getHTML(), 'utf8');
    console.log('Saved scratch/rendered_devotee_report.html (len ' + winRef._getHTML().length + ')');
  }
}

// Test Three Departments Matrix
if (typeof exportThreeDepartmentsMatrixPDF === 'function') {
  let winRef;
  const origOpen = window.open;
  window.open = function() {
    winRef = origOpen.apply(this, arguments);
    return winRef;
  };
  exportThreeDepartmentsMatrixPDF('weekly');
  if (winRef) {
    fs.writeFileSync('scratch/rendered_matrix_report.html', winRef._getHTML(), 'utf8');
    console.log('Saved scratch/rendered_matrix_report.html (len ' + winRef._getHTML().length + ')');
  }
}

// Test Morning Period Report
if (typeof exportMorningPeriodReportPDF === 'function') {
  let winRef;
  const origOpen = window.open;
  window.open = function() {
    winRef = origOpen.apply(this, arguments);
    return winRef;
  };
  // Populate mock morning data
  APP.morningData = {
    weekly: {
      startDate: '2026-09-15',
      endDate: '2026-09-22',
      totalSessions: 7,
      totalPossible: 70,
      totalAttended: 58,
      totalOnTime: 42,
      totalGrace: 10,
      totalLate: 6,
      avgAttendancePct: 83,
      avgPunctualityPct: 74,
      buckets: [{label: '4:00 - 4:30', count: 42}, {label: '4:30 - 5:00', count: 10}],
      devStats: [
        { name: 'Govinda Das', appointment: 'Ashram Resident', standardTime: '04:30', presentCount: 7, onTimeCount: 6, graceCount: 1, lateCount: 0, absentCount: 0, attendanceRate: 100, punctualityRate: 86, punctualityGrowthDelta: 5, statusBadge: '🌟 Exemplary' }
      ]
    },
    monthly: {
      startDate: '2026-08-23',
      endDate: '2026-09-22',
      totalSessions: 30,
      totalPossible: 300,
      totalAttended: 250,
      totalOnTime: 190,
      totalGrace: 40,
      totalLate: 20,
      avgAttendancePct: 83,
      avgPunctualityPct: 77,
      buckets: [{label: '4:00 - 4:30', count: 190}],
      devStats: [
        { name: 'Govinda Das', appointment: 'Ashram Resident', standardTime: '04:30', presentCount: 29, onTimeCount: 25, graceCount: 3, lateCount: 1, absentCount: 1, attendanceRate: 97, punctualityRate: 86, punctualityGrowthDelta: 5, statusBadge: '🌟 Exemplary' }
      ]
    }
  };
  exportMorningPeriodReportPDF('weekly');
  if (winRef) {
    fs.writeFileSync('scratch/rendered_morning_period_report.html', winRef._getHTML(), 'utf8');
    console.log('Saved scratch/rendered_morning_period_report.html (len ' + winRef._getHTML().length + ')');
  }

  // Test Morning Growth Report
  exportMorningGrowthReportPDF();
  if (winRef) {
    fs.writeFileSync('scratch/rendered_morning_growth_report.html', winRef._getHTML(), 'utf8');
    console.log('Saved scratch/rendered_morning_growth_report.html (len ' + winRef._getHTML().length + ')');
  }
}

console.log('All report renders completed successfully!');
