const fs = require('fs');

const html = fs.readFileSync('public/index.html', 'utf8');

// Let's verify each requirement directly in the code:
console.log('--- REQUIREMENT 1: Automated Monthly Reports & NO Submit weekly report ---');
const hasSubmitWeekly = html.includes('Submit weekly report');
const hasGenerateMonthlyPDF = html.includes('Generate Monthly Report (PDF)');
const hasDownloadMonthlyPDFAct = html.includes('data-act="download-batch-monthly-report-pdf"');
console.log('NO "Submit weekly report":', !hasSubmitWeekly);
console.log('HAS "Generate Monthly Report (PDF)":', hasGenerateMonthlyPDF);
console.log('HAS "download-batch-monthly-report-pdf" handler:', html.includes('case \'download-batch-monthly-report-pdf\':'));
console.log('HAS exportBatchMonthlyReportPDF function:', html.includes('function exportBatchMonthlyReportPDF(bid)'));

console.log('\n--- REQUIREMENT 2: Remove community-wise preaching funnel & level distribution ---');
const vprSection = html.slice(html.indexOf('function viewPreachingReports()'), html.indexOf('function viewCare()'));
const vprHasCommFunnel = vprSection.includes('Community-wide preaching funnel');
const vprHasLevelDist = vprSection.includes('Level distribution');
console.log('NO Community-wide preaching funnel in viewPreachingReports:', !vprHasCommFunnel);
console.log('NO Level distribution in viewPreachingReports:', !vprHasLevelDist);

console.log('\n--- REQUIREMENT 3: 6-Stage Individual Batch Preaching Funnel ---');
const hasFunnelContacts = html.includes('{l: \'Contacts\', v: totalContacts');
const hasFunnelInterested = html.includes('{l: \'Interested (active)\', v: interestedActive');
const hasFunnelAttending = html.includes('{l: \'Attending class\', v: attendingClass');
const hasFunnelRegular = html.includes('{l: \'Regular\', v: regular');
const hasFunnelSadhana = html.includes('{l: \'Sadhana\', v: sadhana');
const hasFunnelServing = html.includes('{l: \'Actively serving\', v: activelyServing');
console.log('HAS Contacts stage:', hasFunnelContacts);
console.log('HAS Interested (active) stage:', hasFunnelInterested);
console.log('HAS Attending class stage:', hasFunnelAttending);
console.log('HAS Regular stage:', hasFunnelRegular);
console.log('HAS Sadhana stage:', hasFunnelSadhana);
console.log('HAS Actively serving stage:', hasFunnelServing);
console.log('Funnel placed directly below Members & Team:', vprSection.indexOf('👥 Members & Team') < vprSection.indexOf('🎯 Batch preaching funnel'));

console.log('\n--- REQUIREMENT 4: Facilitators & Volunteers stats + Incharge/Coordinator Banner ---');
console.log('HAS Incharge banner:', vprSection.includes('Incharge:'));
console.log('HAS Coordinator banner:', vprSection.includes('Coordinator:'));
console.log('HAS Facilitators stat with open-batch-facilitators:', vprSection.includes('open-batch-facilitators'));
console.log('HAS Volunteers stat with open-batch-volunteers:', vprSection.includes('open-batch-volunteers'));
console.log('HAS showBatchFacilitatorsModal function:', html.includes('function showBatchFacilitatorsModal('));
console.log('HAS showBatchVolunteersModal function:', html.includes('function showBatchVolunteersModal('));
console.log('HAS open-batch-facilitators click handler:', html.includes('case \'open-batch-facilitators\':'));
console.log('HAS open-batch-volunteers click handler:', html.includes('case \'open-batch-volunteers\':'));

console.log('\n--- REQUIREMENT 5: Remove progression box ---');
const vprHasProgression = vprSection.includes('🎓 Progression');
console.log('NO Progression box in viewPreachingReports:', !vprHasProgression);

console.log('\n--- REQUIREMENT 6: Responsive dashboards & graphs ---');
console.log('HAS g6 grid for batch stats:', vprSection.includes('grid g6'));
console.log('HAS 145px width for funnel labels:', html.includes('.funnel-lbl{width:145px;'));
