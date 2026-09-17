const fs = require('fs');
const assert = require('assert');

// Simple DOM & mock setup
const html = fs.readFileSync('public/index.html', 'utf8');

// 1. Verify that 'side-filter-batch' does NOT exist in click listener
const cClick = html.indexOf("document.addEventListener('click'");
const cChange = html.indexOf("document.addEventListener('change'");
const clickSection = html.substring(cClick, cChange);

assert.ok(!clickSection.includes("case 'side-filter-batch':"), "side-filter-batch must NOT be in click listener");
console.log("PASS 1: side-filter-batch removed from click listener.");

// 2. Verify SELECT protection in click listener
assert.ok(clickSection.includes("t.tagName==='SELECT'||e.target.tagName==='SELECT'||e.target.tagName==='OPTION'"), "SELECT click protection present");
console.log("PASS 2: SELECT click protection present in click listener.");

// 3. Verify side-select-assign and side-filter-batch in change listener
const changeSection = html.substring(cChange, cChange + 3000);
assert.ok(changeSection.includes("case 'side-select-assign':"), "side-select-assign in change listener");
assert.ok(changeSection.includes("case 'side-filter-batch':"), "side-filter-batch in change listener");
console.log("PASS 3: side-select-assign and side-filter-batch present in change listener.");

// 4. Verify scroll preservation in render
assert.ok(html.includes("const prevDrawerScroll = drawerBody ? drawerBody.scrollTop : 0;"), "Scroll position captured");
assert.ok(html.includes("newDrawerBody.scrollTop = prevDrawerScroll;"), "Scroll position restored");
console.log("PASS 4: Drawer scroll position captured and restored.");

// 5. Verify open-activity resets sideDevFilterBatch
assert.ok(html.includes("APP.sideDevFilterBatch = a ? (a.batch || '') : '';"), "open-activity resets filter batch");
console.log("PASS 5: open-activity resets sideDevFilterBatch.");

// 6. Verify scope-devotee-sel attributes
assert.ok(html.includes('id="scope-devotee-sel" data-act="side-select-assign"'), "scope-devotee-sel has data-act");
console.log("PASS 6: scope-devotee-sel properly wired with data-act.");

console.log("\nALL VERIFICATIONS PASSED SUCCESSFULLY!");
