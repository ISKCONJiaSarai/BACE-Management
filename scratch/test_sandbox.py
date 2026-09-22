# -*- coding: utf-8 -*-
import io, sys, re, subprocess

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Node script to run in Node environment with jsdom or mock window and call each export function
node_runner = """
const fs = require('fs');

// Read inline_app.js
const code = fs.readFileSync('scratch/inline_app.js', 'utf8');

// Set up browser-like environment
const capturedDocs = {};

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
  }
};
global.document = {
  getElementById: (id) => null,
  createElement: (tag) => ({ style: {}, appendChild: () => {} }),
  body: { appendChild: () => {} }
};
global.toast = (msg, icon) => console.log('TOAST:', icon, msg);

// Execute the code
eval(code);

console.log('App code loaded into sandbox!');

// Test 1: Batch Monthly Report
if (typeof exportBatchMonthlyReportPDF === 'function') {
  const origOpen = window.open;
  let winRef;
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

// Test 2: Morning Period Report
if (typeof exportMorningPeriodReportPDF === 'function') {
  let winRef;
  window.open = function() {
    let doc = '';
    return {
      document: { open: ()=>{}, write: (h)=>{ doc += h; }, close: ()=>{} },
      _getHTML: () => doc
    };
  };
  exportMorningPeriodReportPDF('weekly');
  // Need APP.morningData
}

// Test 3: Care Report
if (typeof exportCareReportPDF === 'function') {
  let winRef;
  window.open = function() {
    winRef = {
      doc: '',
      document: { open: ()=>{}, write: function(h){ this.doc += h; }.bind(this), close: ()=>{} },
      _getHTML: function() { return this.doc; }
    };
    winRef.document.doc = '';
    return winRef;
  };
  exportCareReportPDF();
  if (winRef) {
    fs.writeFileSync('scratch/rendered_care_report.html', winRef.document.doc, 'utf8');
    console.log('Saved scratch/rendered_care_report.html (len ' + winRef.document.doc.length + ')');
  }
}

// Test 4: Devotee Report
if (typeof exportDevoteeReportPDF === 'function') {
  let doc = '';
  window.open = function() {
    return {
      document: { open: ()=>{}, write: (h)=>{ doc += h; }, close: ()=>{} },
      print: ()=>{}, focus: ()=>{}
    };
  };
  exportDevoteeReportPDF('deity', 'weekly');
  if (doc) {
    fs.writeFileSync('scratch/rendered_devotee_report.html', doc, 'utf8');
    console.log('Saved scratch/rendered_devotee_report.html (len ' + doc.length + ')');
  }
}

// Test 5: Three Departments Matrix Report
if (typeof exportThreeDepartmentsMatrixPDF === 'function') {
  let doc = '';
  window.open = function() {
    return {
      document: { open: ()=>{}, write: (h)=>{ doc += h; }, close: ()=>{} }
    };
  };
  exportThreeDepartmentsMatrixPDF('weekly');
  if (doc) {
    fs.writeFileSync('scratch/rendered_matrix_report.html', doc, 'utf8');
    console.log('Saved scratch/rendered_matrix_report.html (len ' + doc.length + ')');
  }
}
""";

with open('scratch/test_sandbox.js', 'w', encoding='utf-8') as f:
    f.write(node_runner)

print('Wrote scratch/test_sandbox.js')
res = subprocess.run(['node', 'scratch/test_sandbox.js'], capture_output=True, text=True)
print('Sandbox exit code:', res.returncode)
print('STDOUT:\n', res.stdout)
print('STDERR:\n', res.stderr)
