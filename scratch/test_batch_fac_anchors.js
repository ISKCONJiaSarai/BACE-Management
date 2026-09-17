const fs = require('fs');

const html = fs.readFileSync('public/index.html', 'utf8');

// 1. Locate teamSection
const teamSecIdx = html.indexOf('function teamSection(opts){');
console.log('teamSecIdx:', teamSecIdx);

// 2. Locate openBatchForm
const openBatchIdx = html.indexOf('function openBatchForm(id){');
console.log('openBatchIdx:', openBatchIdx);

// 3. Locate batchDashboardBody
const bdbIdx = html.indexOf('function batchDashboardBody(b){');
console.log('bdbIdx:', bdbIdx);

// 4. Locate save-batch
const saveBatchIdx = html.indexOf('case \'save-batch\':{');
console.log('saveBatchIdx:', saveBatchIdx);
