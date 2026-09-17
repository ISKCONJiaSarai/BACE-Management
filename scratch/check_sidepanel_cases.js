const fs = require('fs');
const lines = fs.readFileSync('public/index.html', 'utf8').split(/\r?\n/);

const actions = [
  'toggle-item',
  'add-item',
  'act-need-step',
  'save-act-need',
  'toggle-edit-need',
  'go-attendance-act',
  'complete-activity',
  'toggle-custom-devotee',
  'assign-custom-devotee',
  'assign-from-sel',
  'unassign',
  'edit-budget'
];

actions.forEach(act => {
  const hits = lines.map((l, i) => l.includes(`case '${act}':`) ? (i + 1) : 0).filter(Boolean);
  console.log(act + ':', hits);
});
