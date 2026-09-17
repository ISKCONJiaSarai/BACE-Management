const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('public/index.html', 'utf8');

const dom = new JSDOM(html, {
  runScripts: "dangerously",
  resources: "usable",
  url: "http://localhost:5000/"
});

const { window } = dom;

setTimeout(() => {
  try {
    const { APP, DB, viewPreachingReports, batchPreachingFunnel, getBatchFacilitators, getBatchVolunteers } = window;
    console.log('App user:', APP.user?.name);
    console.log('DB batches:', DB.batches.map(b => b.name));

    // Test for first batch
    const bid = DB.batches[0].id;
    console.log('Testing batch:', DB.batches[0].name, 'id:', bid);

    const fun = batchPreachingFunnel(bid);
    console.log('Batch funnel stages:', fun.map(f => `${f.l}: ${f.v}`));

    const facs = getBatchFacilitators(bid);
    console.log('Batch facilitators:', facs.map(f => f.name));

    const vols = getBatchVolunteers(bid);
    console.log('Batch volunteers:', vols.map(v => v.name));

    const viewHtml = viewPreachingReports();
    console.log('viewPreachingReports HTML length:', viewHtml.length);

    // Check assertions
    const checks = {
      'Has Incharge': viewHtml.includes('Incharge:'),
      'Has Coordinator': viewHtml.includes('Coordinator:'),
      'Has Facilitators Stat': viewHtml.includes('open-batch-facilitators'),
      'Has Volunteers Stat': viewHtml.includes('open-batch-volunteers'),
      'Has 6-Stage Funnel': viewHtml.includes('Batch preaching funnel') && fun.length === 6,
      'Has Generate Monthly Report PDF': viewHtml.includes('Generate Monthly Report (PDF)'),
      'NO Submit Weekly Report': !viewHtml.includes('Submit weekly report'),
      'NO Progression Box': !viewHtml.includes('🎓 Progression'),
      'NO Community-wide Preaching Funnel': !viewHtml.includes('Community-wide preaching funnel'),
      'NO Level Distribution': !viewHtml.includes('Level distribution'),
    };

    console.log('Verifications:');
    let allPassed = true;
    for (const [k, v] of Object.entries(checks)) {
      console.log(`  [${v ? 'PASS' : 'FAIL'}] ${k}`);
      if (!v) allPassed = false;
    }

    if (allPassed) {
      console.log('\nALL 10 VERIFICATIONS PASSED SUCCESSFULLY!');
    } else {
      console.error('\nSOME VERIFICATIONS FAILED!');
      process.exit(1);
    }
    process.exit(0);
  } catch (err) {
    console.error('Error during testing:', err);
    process.exit(1);
  }
}, 500);
