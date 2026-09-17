const assert = require('assert');
const fs = require('fs');

// Test 1: Funnel percentage calculation
const html = fs.readFileSync('public/index.html', 'utf8');

// Extract the funnel function from index.html
const funnelMatch = html.match(/function funnel\(rows, batchId = ''\)[\s\S]*?\n\}/);
assert(funnelMatch, 'funnel function found in index.html');

// Create mock environment for funnel function
const esc = s => String(s);
const tipAttr = s => `title="${s}"`;
const pct = (a, b) => b ? Math.round((a / b) * 100) : 0;

const testFunnelFn = new Function('rows', 'batchId', 'esc', 'tipAttr', 'pct', `
  ${funnelMatch[0]}
  return funnel(rows, batchId);
`);

const rows = [
  { l: 'Registered', v: 106 },
  { l: 'Interested', v: 103 },
  { l: 'Attending Class', v: 24 },
  { l: 'Regular', v: 24 },
  { l: 'Sadhana', v: 24 },
  { l: 'Actively Serving', v: 3 }
];

const rendered = testFunnelFn(rows, 'b1', esc, tipAttr, pct);
console.log('--- Rendered Funnel HTML ---');
console.log(rendered);

assert(rendered.includes('97%'), 'Interested shows 97%');
assert(rendered.includes('23%'), 'Attending Class, Regular, Sadhana show 23%');
assert(rendered.includes('3%'), 'Actively Serving shows 3%');
// Ensure 100% is NOT displayed in funnel-conv for sub-stages 3 or 4
const convMatches = [...rendered.matchAll(/<div class="funnel-conv"[^>]*>([\s\S]*?)<\/div>/g)].map(m => m[1].trim());
console.log('Funnel conv column values:', convMatches);
assert.strictEqual(convMatches[0], '', 'Registered has no right side %');
assert.strictEqual(convMatches[1], '97%', 'Interested has 97%');
assert.strictEqual(convMatches[2], '23%', 'Attending Class has 23%');
assert.strictEqual(convMatches[3], '23%', 'Regular has 23% (FIXED: was 100%)');
assert.strictEqual(convMatches[4], '23%', 'Sadhana has 23% (FIXED: was 100%)');
assert.strictEqual(convMatches[5], '3%', 'Actively Serving has 3% (FIXED: was 13%)');

console.log('✅ ALL FUNNEL PERCENTAGE ASSERTIONS PASSED!');
