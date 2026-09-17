const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');

const start = html.indexOf('function viewPreachingReports()');
const end = html.indexOf('function viewCare()', start);
console.log('viewPreachingReports bounds:', start, end);
console.log('Current content:\n', html.slice(start, end));
