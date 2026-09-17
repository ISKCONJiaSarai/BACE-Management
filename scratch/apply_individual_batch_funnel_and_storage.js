const fs = require('fs');

let content = fs.readFileSync('public/index.html', 'utf8');
const isCRLF = content.includes('\r\n');
const lines = content.split(/\r?\n/);

console.log('Initial line count:', lines.length);

// 1. Replace the old Batch funnel and budget in batchDashboardBody
const bdbStart = lines.findIndex(l => l.includes('const mode = APP.tab[\'bfunnel_\'+b.id]'));
const bdbBudgetEnd = lines.findIndex((l, i) => i > bdbStart && l.includes('${section(\'⏰ Follow-ups\''));

console.log('bdbStart:', bdbStart, 'bdbBudgetEnd:', bdbBudgetEnd);

if (bdbStart !== -1 && bdbBudgetEnd !== -1) {
  // Line before bdbStart is `${(()=>{`
  const replaceStart = bdbStart - 1;
  const newBatchBodyComponents = `      \${section('🎯 Batch preaching funnel', \`<div class="card-b">
        <p class="tiny muted" style="margin-top:0;margin-bottom:12px">Conversion and progression of souls connected with \${esc(b.name)}</p>
        \${funnel(batchPreachingFunnel(b.id))}
        <div class="tiny" style="margin-top:10px;display:flex;justify-content:space-between;align-items:center">
          <span>Tracks member progression from Registered to Actively Serving.</span>
          <span style="color:var(--ink-3)">Click any bar to drill down</span>
        </div>
      </div>\`, \`<span class="badge b-purple" style="font-size:11px">6-Stage Funnel</span>\`)}
      \${section('🧾 Budget', \`<div class="card-b click" data-act="open-budget" data-kind="batch" data-id="\${b.id}" style="cursor:pointer" title="Click to update collected budget & expenses">
        <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:6px"><span class="muted">Budget Overview</span><b>\${pct(b.budget.spent, b.budget.allocated)}% spent</b></div>
        \${prog(pct(b.budget.spent, b.budget.allocated), pct(b.budget.spent, b.budget.allocated)>95?'var(--danger)':'var(--mustard)')}
        <div class="grid g3" style="gap:8px;margin-top:10px">
          <div><div class="tiny">Collected</div><b style="font-family:var(--f-head);font-size:15px;color:var(--green)">\${money(b.budget.allocated)}</b></div>
          <div><div class="tiny">Expenses</div><b style="font-family:var(--f-head);font-size:15px;color:var(--danger)">\${money(b.budget.spent)}</b></div>
          <div><div class="tiny">Remaining</div><b style="font-family:var(--f-head);font-size:15px;color:var(--ink)">\${money(b.budget.allocated - b.budget.spent)}</b></div>
        </div>
        <div class="tiny muted" style="margin-top:8px;display:flex;align-items:center;gap:4px">
          \${ic('edit')} Tap anywhere on budget to edit collection & expenses
        </div></div>\`, ownsBatch(b.id)?\`<button class="btn sm" data-act="open-budget" data-kind="batch" data-id="\${b.id}">\${ic('edit')}Edit budget</button>\`:null)}`;

  lines.splice(replaceStart, bdbBudgetEnd - replaceStart, newBatchBodyComponents);
  console.log('Replaced batch funnel and budget in batchDashboardBody');
}

// 2. In openBatchForm, update label from "Budget allocated (₹)" to "Collected budget (₹)"
const obfAllocIdx = lines.findIndex(l => l.includes('FLD(\'allocated\',\'Budget allocated (₹)\''));
if (obfAllocIdx !== -1) {
  lines[obfAllocIdx] = lines[obfAllocIdx]
    .replace('Budget allocated (₹)', 'Collected budget (₹)')
    .replace('Budget spent (₹)', 'Expenses spent (₹)');
  console.log('Updated openBatchForm budget labels');
}

// 3. Add saveAttendanceToStorage and loadAttendanceFromStorage
const storageMarker = lines.findIndex(l => l.includes('function savePreachingFilters(){'));
if (storageMarker !== -1) {
  const attStorageCode = `function saveAttendanceToStorage(){
  try{
    localStorage.setItem('bace_attendance_store', JSON.stringify(DB.attendance || []));
  }catch(e){console.warn('saveAttendanceToStorage error:', e)}
}

function loadAttendanceFromStorage(){
  try{
    const raw = localStorage.getItem('bace_attendance_store');
    if(!raw) return;
    const list = JSON.parse(raw);
    if(Array.isArray(list)){
      list.forEach(saved => {
        const existing = (DB.attendance||[]).find(a => a.id === saved.id || (a.ref === saved.ref && a.devotee === saved.devotee));
        if(existing){
          Object.assign(existing, saved);
        } else {
          DB.attendance.push(saved);
        }
      });
    }
  }catch(e){console.warn('loadAttendanceFromStorage error:', e)}
}
`;
  lines.splice(storageMarker, 0, attStorageCode);
  console.log('Added attendance storage functions');
}

// 4. In save-attendance, call saveAttendanceToStorage()
const saveAttIdx = lines.findIndex(l => l.includes('case \'save-attendance\':{'));
if (saveAttIdx !== -1) {
  lines[saveAttIdx] = '  case \'save-attendance\':{saveAttendanceToStorage();logAudit(\'Attendance marked\',\'Attendance saved by \'+nameOf(APP.user.devotee));';
  console.log('Added saveAttendanceToStorage call in save-attendance');
}

// 5. In save-batch-members, call saveDevoteesToStorage() and saveBatchesToStorage()
const sbmIdx = lines.findIndex(l => l.includes('logAudit(\'Batch members updated\',batch(m.ctx.id).name+\' now has \'+m.selected.length+\' members\');'));
if (sbmIdx !== -1) {
  lines.splice(sbmIdx, 0, '    saveDevoteesToStorage();saveBatchesToStorage();');
  console.log('Added saveDevoteesToStorage in save-batch-members');
}

// 6. In save-devotee, call saveDevoteesToStorage()
const sdIdx1 = lines.findIndex(l => l.includes("logAudit('Devotee updated',"));
if (sdIdx1 !== -1) {
  lines.splice(sdIdx1, 0, '      saveDevoteesToStorage();saveBatchesToStorage();');
  console.log('Added saveDevoteesToStorage in save-devotee (edit)');
}

const sdIdx2 = lines.findIndex(l => l.includes('logAudit(\'Devotee created\','));
if (sdIdx2 !== -1) {
  lines.splice(sdIdx2, 0, '      saveDevoteesToStorage();saveBatchesToStorage();');
  console.log('Added saveDevoteesToStorage in save-devotee (create)');
}

// 7. In convert-contact, call saveDevoteesToStorage()
const scIdx = lines.findIndex(l => l.includes('logAudit(\'Contact converted\','));
if (scIdx !== -1) {
  lines.splice(scIdx, 0, '    saveDevoteesToStorage();');
  console.log('Added saveDevoteesToStorage in convert-contact');
}

// 8. In change handler for att-batch and att-class, persist them
const chgAttBatchIdx = lines.findIndex(l => l.includes('case \'att-batch\':APP.filters.attBatch=t.value;APP.filters.attClass=null;render();break;'));
if (chgAttBatchIdx !== -1) {
  lines[chgAttBatchIdx] = '   case \'att-batch\':APP.filters.attBatch=t.value;APP.filters.attClass=null;try{localStorage.setItem(\'bace_att_batch\',t.value)}catch(e){}render();break;';
}
const chgAttClassIdx = lines.findIndex(l => l.includes('case \'att-class\':APP.filters.attClass=t.value;render();break;'));
if (chgAttClassIdx !== -1) {
  lines[chgAttClassIdx] = '   case \'att-class\':APP.filters.attClass=t.value;try{localStorage.setItem(\'bace_att_class\',t.value)}catch(e){}render();break;';
}

// 9. In boot sequence, also call loadAttendanceFromStorage() and load att-batch/att-class
const bootMarker = lines.findIndex(l => l.includes('loadPreachingFilters();'));
if (bootMarker !== -1) {
  const bootAddition = `loadAttendanceFromStorage();
try{
  const sbAttB = localStorage.getItem('bace_att_batch');
  if(sbAttB && (DB.batches||[]).some(b=>b.id===sbAttB)) APP.filters.attBatch = sbAttB;
  const sbAttC = localStorage.getItem('bace_att_class');
  if(sbAttC) APP.filters.attClass = sbAttC;
}catch(e){}`;
  lines.splice(bootMarker + 1, 0, bootAddition);
  console.log('Added loadAttendanceFromStorage and att filter restores in boot sequence');
}

const finalHtml = lines.join(isCRLF ? '\r\n' : '\n');
fs.writeFileSync('public/index.html', finalHtml);
console.log('Successfully updated public/index.html!');
