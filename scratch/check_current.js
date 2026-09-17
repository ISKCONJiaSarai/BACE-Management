const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');

// 1. Check stat definition
console.log('stat has o.id?', html.includes('if (o.id !== undefined)'));

// 2. Check seed batches incharge / volunteers
console.log('batches incharge seed?', html.includes('bG.incharge ='));

