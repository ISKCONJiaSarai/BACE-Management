const fs = require('fs');

let content = fs.readFileSync('public/index.html', 'utf8');
const isCRLF = content.includes('\r\n');
const lines = content.split(/\r?\n/);

console.log('Total lines initially:', lines.length);

// 1. Update batchPreachingFunnel to the new 6 stages
const bpfStart = lines.findIndex(l => l.includes('function batchPreachingFunnel(bid){'));
const bpfEnd = lines.findIndex((l, i) => i > bpfStart && l.includes('function showBatchFacilitatorsModal(batchId){'));
console.log('bpfStart:', bpfStart, 'bpfEnd:', bpfEnd);

const newBpf = `function batchPreachingFunnel(bid){
  const b = batch(bid);
  const mems = batchMembers(bid);

  // 1. Registered: all those in the batch members list
  const registered = mems.length;

  // 2. Interested: batch members who are active or interested (not inactive)
  const interested = mems.filter(d => d.status === 'Active' || d.status === 'New').length;

  // 3. Attending Class: batch members who attend classes (attendance marked or attendancePct > 0)
  const attendingClass = mems.filter(d => (d.attendancePct || 0) > 0 || (DB.attendance||[]).some(a => a.devotee === d.id && a.status === 'Present')).length;

  // 4. Regular: batch members who attend regularly (>=60% attendance and active)
  const regular = mems.filter(d => (d.attendancePct || 0) >= 60 && d.status === 'Active').length;

  // 5. Sadhana: batch members practicing sadhana (sadhana log, >=4 rounds, or morning program)
  const sadhana = mems.filter(d => {
    const sRec = (DB.sadhana || []).find(s => s.devotee === d.id);
    const rounds = sRec?.rounds || d.sadhana?.rounds || 0;
    const prog = sRec?.program || d.sadhana?.morningProgram || 0;
    return rounds >= 4 || prog > 0;
  }).length;

  // 6. Actively Serving: batch members actively serving in seva/department
  const activelyServing = mems.filter(d => {
    return (d.dept && d.dept !== '') ||
      (d.service && d.service.length > 0) ||
      (d.swabhav && d.swabhav.engaged) ||
      (DB.assignments || []).some(asg => (asg.devotee === d.id || asg.actualPerformer === d.id) && asg.state !== 'Declined' && asg.state !== 'Missed') ||
      (DB.deptMembers || []).some(dm => dm.devotee === d.id && dm.status === 'Active');
  }).length;

  return [
    {l: 'Registered', v: registered, color: 'var(--indigo)', r: '#/devotees', tip: \`Registered batch members: \${registered}\`},
    {l: 'Interested', v: interested, color: '#4f46e5', r: '#/devotees', tip: \`Interested & active members: \${interested}\`},
    {l: 'Attending Class', v: attendingClass, color: '#6366f1', r: '#/batch-attendance', tip: \`Attending classes: \${attendingClass}\`},
    {l: 'Regular', v: regular, color: '#0ea5e9', r: '#/batch-attendance', tip: \`Regular attendees (>=60%): \${regular}\`},
    {l: 'Sadhana', v: sadhana, color: '#10b981', r: '#/sadhana', tip: \`Practicing sadhana: \${sadhana}\`},
    {l: 'Actively Serving', v: activelyServing, color: '#f59e0b', r: '#/assign', tip: \`Actively serving in seva: \${activelyServing}\`}
  ];
}`;

lines.splice(bpfStart, bpfEnd - bpfStart, newBpf);
console.log('Updated batchPreachingFunnel');

// 2. Add persistence functions (saveBatchesToStorage, loadBatchesFromStorage, etc.)
const bpfNewIdx = lines.findIndex(l => l.includes('function batchPreachingFunnel(bid){'));
const storageCode = `
/* ---------- LocalStorage Persistence Layer for Batches, Reports & Filters ---------- */
function saveBatchesToStorage(){
  try{
    const data = (DB.batches||[]).map(b => ({
      id: b.id, name: b.name, level: b.level, desc: b.desc, freq: b.freq,
      day: b.day, time: b.time, start: b.start, status: b.status,
      incharge: b.incharge, coordinator: b.coordinator,
      facilitators: b.facilitators || [], volunteers: b.volunteers || [],
      budget: b.budget
    }));
    localStorage.setItem('bace_batches_store', JSON.stringify(data));
  }catch(e){console.warn('saveBatchesToStorage error:', e)}
}

function loadBatchesFromStorage(){
  try{
    const raw = localStorage.getItem('bace_batches_store');
    if(!raw) return;
    const list = JSON.parse(raw);
    if(Array.isArray(list)){
      list.forEach(saved => {
        const b = (DB.batches||[]).find(x => x.id === saved.id);
        if(b){
          Object.assign(b, saved);
        } else {
          DB.batches.push(saved);
        }
      });
    }
  }catch(e){console.warn('loadBatchesFromStorage error:', e)}
}

function saveReportsToStorage(){
  try{
    localStorage.setItem('bace_reports_store', JSON.stringify(DB.reports || []));
  }catch(e){console.warn('saveReportsToStorage error:', e)}
}

function loadReportsFromStorage(){
  try{
    const raw = localStorage.getItem('bace_reports_store');
    if(!raw) return;
    const list = JSON.parse(raw);
    if(Array.isArray(list)){
      list.forEach(saved => {
        const idx = (DB.reports||[]).findIndex(r => (saved.id && r.id === saved.id) || (saved.batch && r.batch === saved.batch));
        if(idx >= 0){
          Object.assign(DB.reports[idx], saved);
        } else {
          DB.reports.push(saved);
        }
      });
    }
  }catch(e){console.warn('loadReportsFromStorage error:', e)}
}

function saveDevoteesToStorage(){
  try{
    const list = (DB.devotees||[]).map(d => ({
      id: d.id, batch: d.batch, level: d.level, facilitator: d.facilitator,
      isFacilitator: d.isFacilitator, appointment: d.appointment, batchRole: d.batchRole,
      dept: d.dept, status: d.status, attendancePct: d.attendancePct, batchHistory: d.batchHistory
    }));
    localStorage.setItem('bace_devotees_store', JSON.stringify(list));
  }catch(e){console.warn('saveDevoteesToStorage error:', e)}
}

function loadDevoteesFromStorage(){
  try{
    const raw = localStorage.getItem('bace_devotees_store');
    if(!raw) return;
    const list = JSON.parse(raw);
    if(Array.isArray(list)){
      list.forEach(saved => {
        const d = (DB.devotees||[]).find(x => x.id === saved.id);
        if(d){
          if(saved.batch !== undefined) d.batch = saved.batch;
          if(saved.level !== undefined) d.level = saved.level;
          if(saved.facilitator !== undefined) d.facilitator = saved.facilitator;
          if(saved.isFacilitator !== undefined) d.isFacilitator = saved.isFacilitator;
          if(saved.appointment !== undefined) d.appointment = saved.appointment;
          if(saved.batchRole !== undefined) d.batchRole = saved.batchRole;
          if(saved.dept !== undefined) d.dept = saved.dept;
          if(saved.status !== undefined) d.status = saved.status;
          if(saved.batchHistory !== undefined) d.batchHistory = saved.batchHistory;
        }
      });
    }
  }catch(e){console.warn('loadDevoteesFromStorage error:', e)}
}

function savePreachingFilters(){
  try{
    if(APP.filters.repBatch) localStorage.setItem('bace_rep_batch', APP.filters.repBatch);
    if(APP.range) localStorage.setItem('bace_date_range', JSON.stringify(APP.range));
  }catch(e){}
}

function loadPreachingFilters(){
  try{
    const sb = localStorage.getItem('bace_rep_batch');
    if(sb && (DB.batches||[]).some(b => b.id === sb)) APP.filters.repBatch = sb;
    const sr = localStorage.getItem('bace_date_range');
    if(sr) APP.range = Object.assign(APP.range, JSON.parse(sr));
  }catch(e){}
}
`;

lines.splice(bpfNewIdx, 0, storageCode);
console.log('Added storage functions');

// 3. Update viewPreachingReports budget block and exportBatchMonthlyReportPDF budget section
const expPdfIdx = lines.findIndex(l => l.includes('function exportBatchMonthlyReportPDF(bid){'));
const viewReportsIdx = lines.findIndex(l => l.includes('function viewPreachingReports(){'));
console.log('expPdfIdx:', expPdfIdx, 'viewReportsIdx:', viewReportsIdx);

// Inside exportBatchMonthlyReportPDF, add Budget section before signatures
const pdfSigIdx = lines.findIndex((l, i) => i > expPdfIdx && i < viewReportsIdx && l.includes('<div class="signatures">'));
console.log('pdfSigIdx:', pdfSigIdx);

const pdfBudgetSnippet = `  <div class="section-title">🧾 Budget & Accounts (Collection & Expenses)</div>
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;margin-bottom:16px;display:grid;grid-template-columns:repeat(4,1fr);gap:10px">
    <div class="meta-item"><span>Collected Budget</span><b style="color:#16a34a;font-size:14px">₹\${Number(m.budget.allocated).toLocaleString()}</b></div>
    <div class="meta-item"><span>Total Expenses (Spent)</span><b style="color:#dc2626;font-size:14px">₹\${Number(m.budget.spent).toLocaleString()}</b></div>
    <div class="meta-item"><span>Remaining Balance</span><b style="color:#0f172a;font-size:14px">₹\${Number(m.budget.allocated - m.budget.spent).toLocaleString()}</b></div>
    <div class="meta-item"><span>Utilisation</span><b style="color:\${m.util>90?'#dc2626':'#2563eb'};font-size:14px">\${m.util}%</b></div>
  </div>
`;
lines.splice(pdfSigIdx, 0, pdfBudgetSnippet);
console.log('Added budget section in exportBatchMonthlyReportPDF');

// 4. Update Budget in viewPreachingReports to make it clickable and show "Collected" instead of "Allocated"
const vprBudgetIdx = lines.findIndex(l => l.includes('${section(\'🧾 Budget\',`<div class="card-b">${budgetBlock(b.budget)}</div>`)}'));
console.log('vprBudgetIdx:', vprBudgetIdx);

const newVprBudget = `      \${section('🧾 Budget', \`<div class="card-b click" data-act="open-budget" data-kind="batch" data-id="\${bid}" style="cursor:pointer" title="Click to update collected budget & expenses">
        <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:6px"><span class="muted">Budget Overview</span><b>\${pct(b.budget.spent, b.budget.allocated)}% spent</b></div>
        \${prog(pct(b.budget.spent, b.budget.allocated), pct(b.budget.spent, b.budget.allocated)>95?'var(--danger)':'var(--mustard)')}
        <div class="grid g3" style="gap:8px;margin-top:10px">
          <div><div class="tiny">Collected</div><b style="font-family:var(--f-head);font-size:15px;color:var(--green)">\${money(b.budget.allocated)}</b></div>
          <div><div class="tiny">Expenses</div><b style="font-family:var(--f-head);font-size:15px;color:var(--danger)">\${money(b.budget.spent)}</b></div>
          <div><div class="tiny">Remaining</div><b style="font-family:var(--f-head);font-size:15px;color:var(--ink)">\${money(b.budget.allocated - b.budget.spent)}</b></div>
        </div>
        <div class="tiny muted" style="margin-top:8px;display:flex;align-items:center;gap:4px">
          \${ic('edit')} Tap anywhere on budget to edit collection & expenses
        </div></div>\`, \`<button class="btn sm" data-act="open-budget" data-kind="batch" data-id="\${bid}">\${ic('edit')}Edit budget</button>\`)}`;

lines[vprBudgetIdx] = newVprBudget;
console.log('Updated preaching reports budget card to clickable collected & expenses');

// 5. Update openBudgetForm to support batch collection & expenses labels
const obfBudgetIdx = lines.findIndex(l => l.includes('function openBudgetForm(kind,id){'));
console.log('obfBudgetIdx:', obfBudgetIdx);
const obfBudgetEnd = lines.findIndex((l, i) => i > obfBudgetIdx && l.includes('function drillList(title,acts,sub){'));
console.log('obfBudgetEnd:', obfBudgetEnd);

const newOpenBudget = `function openBudgetForm(kind,id){
  const isBatch = kind==='batch';
  const b=kind==='dept'?dept(id).budget:isBatch?batch(id).budget:act(id).budget;
  openForm(isBatch ? 'Update batch budget (collection & expenses)' : 'Update budget',[
    FLD('allocated', isBatch ? 'Collected budget (₹)' : 'Budget allocated (₹)','number',{v:b.allocated,half:1}),
    FLD('spent', isBatch ? 'Expenses spent (₹)' : 'Amount spent (₹)','number',{v:b.spent,half:1})
  ],'save-budget',{kind,id},
  \`Remaining balance and utilisation rate are calculated automatically.\`);
}`;

lines.splice(obfBudgetIdx, obfBudgetEnd - obfBudgetIdx, newOpenBudget);
console.log('Updated openBudgetForm');

// 6. Update save-batch, save-batch-facilitators, save-batch-team, save-budget, save-batch-narrative to save to storage
// Also add open-budget click action
const openBudgetCaseIdx = lines.findIndex(l => l.includes('case \'edit-budget\':'));
console.log('openBudgetCaseIdx:', openBudgetCaseIdx);
if (openBudgetCaseIdx !== -1) {
  lines[openBudgetCaseIdx] = `  case 'open-budget':\n  case 'edit-budget':stop();openBudgetForm(t.dataset.kind||'batch',id||t.dataset.id);break;`;
}

const saveBudgetCaseIdx = lines.findIndex(l => l.includes('case \'save-budget\':{'));
console.log('saveBudgetCaseIdx:', saveBudgetCaseIdx);
if (saveBudgetCaseIdx !== -1) {
  const saveBudgetEnd = lines.findIndex((l, i) => i > saveBudgetCaseIdx && l.includes('toast(\'Budget updated\',\'🧾\');'));
  lines.splice(saveBudgetEnd, 0, '    if(kind===\'batch\') saveBatchesToStorage();');
  console.log('Added saveBatchesToStorage in save-budget');
}

// In save-batch, call saveBatchesToStorage
const sbSaveIdx = lines.findIndex(l => l.includes('logAudit(\'Batch updated\',b.name);toast(\'Batch updated\')}'));
console.log('sbSaveIdx:', sbSaveIdx);
if (sbSaveIdx !== -1) {
  lines[sbSaveIdx] = '      saveBatchesToStorage();logAudit(\'Batch updated\',b.name);toast(\'Batch updated\')}';
}

const sbCreateIdx = lines.findIndex(l => l.includes('logAudit(\'Batch created\',v.name);toast(\'Batch created with its own group chat\')}'));
console.log('sbCreateIdx:', sbCreateIdx);
if (sbCreateIdx !== -1) {
  lines[sbCreateIdx] = '      saveBatchesToStorage();logAudit(\'Batch created\',v.name);toast(\'Batch created with its own group chat\')}';
}

const sbFacIdx = lines.findIndex(l => l.includes('logAudit(\'Batch facilitators updated\','));
console.log('sbFacIdx:', sbFacIdx);
if (sbFacIdx !== -1) {
  lines.splice(sbFacIdx, 0, '      saveBatchesToStorage();');
}

const sbVolIdx = lines.findIndex(l => l.includes('logAudit(\'Batch team updated\',b.name);'));
console.log('sbVolIdx:', sbVolIdx);
if (sbVolIdx !== -1) {
  lines.splice(sbVolIdx, 0, '    saveBatchesToStorage();');
}

const sbNarrIdx = lines.findIndex(l => l.includes('case \'save-batch-narrative\':{const b=batch(id);'));
console.log('sbNarrIdx:', sbNarrIdx);
if (sbNarrIdx !== -1) {
  const narrToastIdx = lines.findIndex((l, i) => i > sbNarrIdx && l.includes('toast(\'Report narrative saved\');'));
  lines.splice(narrToastIdx, 0, '    saveReportsToStorage();');
}

// 7. Update change handlers for rep-batch and range to call savePreachingFilters()
const chgRangeIdx = lines.findIndex(l => l.includes('case \'range\':APP.range[t.dataset.n]=t.value;render();break;'));
console.log('chgRangeIdx:', chgRangeIdx);
if (chgRangeIdx !== -1) {
  lines[chgRangeIdx] = 'case \'range\':APP.range[t.dataset.n]=t.value;savePreachingFilters();render();break;';
}

const chgRepBatchIdx = lines.findIndex(l => l.includes('case \'rep-batch\':APP.filters.repBatch=t.value;render();break;'));
console.log('chgRepBatchIdx:', chgRepBatchIdx);
if (chgRepBatchIdx !== -1) {
  lines[chgRepBatchIdx] = 'case \'rep-batch\':APP.filters.repBatch=t.value;savePreachingFilters();render();break;';
}

// 8. Update boot/init sequence at bottom of script
const initAppRouteIdx = lines.findIndex(l => l.includes('APP.route=location.hash||\'#/\';'));
console.log('initAppRouteIdx:', initAppRouteIdx);
const bootCode = `loadBatchesFromStorage();
loadReportsFromStorage();
loadDevoteesFromStorage();
loadPreachingFilters();`;
lines.splice(initAppRouteIdx + 1, 0, bootCode);
console.log('Added load calls to boot sequence');

// 9. Update export-batch-report CSV labels to Collected and Expenses
const expReportIdx = lines.findIndex(l => l.includes('case \'export-batch-report\':{const m=batchMetrics('));
console.log('expReportIdx:', expReportIdx);
if (expReportIdx !== -1) {
  const expEnd = lines.findIndex((l, i) => i > expReportIdx && l.includes('toast(\'Batch report exported\',\'⬇️\');break}'));
  const newExpLines = [
    '  case \'export-batch-report\':{const m=batchMetrics(id, APP.range.from, APP.range.to),b=batch(id);',
    '    const funnelStages = batchPreachingFunnel(id);',
    '    const facs = getBatchFacilitators(id);',
    '    const vols = getBatchVolunteers(id);',
    '    const bIncharge = b.incharge || \'d1\';',
    '    const bCoordinator = b.coordinator || b.facilitators?.[0] || \'d1\';',
    '    exportReport(b.name+\' monthly report\',[\'Metric\',\'Value\'],[',
    '      [\'Batch Name\', b.name], [\'Batch Level\', \'Level \' + b.level],',
    '      [\'Incharge\', nameOf(bIncharge)], [\'Coordinator\', nameOf(bCoordinator)],',
    '      [\'Report Period\', `${fmtD(APP.range.from)} to ${fmtD(APP.range.to)}`],',
    '      [\'Total members (Registered)\', m.members.length], [\'Active members\', m.active], [\'New members\', m.neu], [\'Inactive members\', m.inactive],',
    '      [\'Facilitators\', facs.length], [\'Volunteers\', vols.length],',
    '      ...funnelStages.map(fs => [\'Funnel — \' + fs.l, fs.v]),',
    '      [\'Classes\', m.classes.length], [\'Events\', m.events.length], [\'Average attendance %\', m.attendance],',
    '      [\'Best class attendance %\', m.best], [\'Lowest class attendance %\', m.low], [\'Total attendance marks\', m.totalAtt],',
    '      [\'Follow-ups total\', m.fus.total], [\'Follow-ups completed\', m.fus.done], [\'Follow-ups pending\', m.fus.pending], [\'Follow-ups overdue\', m.fus.overdue],',
    '      [\'Collected budget\', m.budget.allocated], [\'Expenses (spent)\', m.budget.spent], [\'Remaining balance\', m.budget.allocated - m.budget.spent], [\'Utilisation %\', m.util]]);',
    '    toast(\'Batch report exported\',\'⬇️\');break}'
  ];
  lines.splice(expReportIdx, expEnd - expReportIdx + 1, ...newExpLines);
  console.log('Updated export-batch-report CSV');
}

const finalHtml = lines.join(isCRLF ? '\r\n' : '\n');
fs.writeFileSync('public/index.html', finalHtml);
console.log('Successfully wrote updated public/index.html!');
