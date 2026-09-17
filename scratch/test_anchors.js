const fs = require('fs');

// We will test applying the full updates and verifying node syntax and behavior.
let html = fs.readFileSync('public/index.html', 'utf8');

// Check that we can locate:
// 1. stat function definition
const statPos = html.indexOf('const stat=(lbl,val,foot=\'\',o={})=>{');
console.log('statPos:', statPos);

// 2. viewPreachingReports
const vprPos = html.indexOf('function viewPreachingReports(){');
console.log('vprPos:', vprPos);

// 3. actions switch
const actPos = html.indexOf('case \'export-batch-report\':{');
console.log('actPos:', actPos);

// 4. seed batch incharge
const seedPos = html.indexOf('const bG = DB.batches.find(b => b.id === \'b8\');');
console.log('seedPos:', seedPos);
