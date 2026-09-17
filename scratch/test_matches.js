const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');

// 1. stat function update
const oldStat = `const stat=(lbl,val,foot='',o={})=>{
  const act = o.act || (o.r ? 'go' : '');
  const attrs = [];
  if (act) attrs.push(\`data-act="\${act}"\`);
  if (o.arg !== undefined) attrs.push(\`data-arg="\${esc(o.arg)}"\`);
  if (o.r) attrs.push(\`data-r="\${o.r}"\`);`;

const newStat = `const stat=(lbl,val,foot='',o={})=>{
  const act = o.act || (o.r ? 'go' : '');
  const attrs = [];
  if (act) attrs.push(\`data-act="\${act}"\`);
  if (o.arg !== undefined) attrs.push(\`data-arg="\${esc(o.arg)}"\`);
  if (o.id !== undefined) attrs.push(\`data-id="\${esc(o.id)}"\`);
  if (o.r) attrs.push(\`data-r="\${o.r}"\`);`;

console.log('Has oldStat:', html.includes(oldStat));

// 2. batch seed update
const oldSeed = `  // Link batch coordinators & facilitators
  const bG = DB.batches.find(b => b.id === 'b8');
  if (bG && audaryaId) { bG.coordinator = audaryaId; bG.facilitators = [audaryaId, 'd1']; }
  const bN = DB.batches.find(b => b.id === 'b7');
  if (bN && dhirendraId) { bN.coordinator = dhirendraId; bN.facilitators = [dhirendraId, 'd1']; }
  const bT = DB.batches.find(b => b.id === 'b1');
  if (bT && audaryaId) { bT.coordinator = audaryaId; bT.facilitators = [audaryaId]; }
  DB.batches.forEach(b => {
    if (!b.coordinator) {
      b.coordinator = (b.level === 3 ? dhirendraId : audaryaId) || 'd1';
      b.facilitators = [b.coordinator];
    }
  });`;

console.log('Has oldSeed:', html.includes(oldSeed));

// 3. preaching reports section
const oldVpr = `/* ---------------- preaching reports & analytics ---------------- */
function viewPreachingReports(){
  const bid=APP.filters.repBatch||DB.batches[0].id;
  const b=batch(bid),m=batchMetrics(bid);
  const s=STATS();
  const progressedDevs = m.members.filter(d => d.history && d.history.some(h => h.type === 'Batch' || h.type === 'Role')).length;
  const progressedContacts = batchContacts(bid).filter(c => c.timeline && c.timeline.length > 1).length;
  const progression=[{l:'New joiners this month',v:m.neu},
    {l:'Progressed from previous stage',v:progressedDevs + progressedContacts},
    {l:'Candidates for the next level',v:m.members.filter(d=>(d.attendancePct||0)>85).length}];
  return head('📈 BACE Preaching','Reports & analytics','Batch-wise monthly reports with classes, attendance, progression, follow-ups and budget',
    \`<button class="btn" data-act="export-batch-report" data-id="\${bid}">\${ic('download')}Export CSV</button>
     <button class="btn pri" data-act="add-report" data-kind="preaching">\${ic('doc')}Submit weekly report</button>\`)+
  \`<div class="card" style="margin-bottom:15px"><div class="toolbar">
     <select data-act="rep-batch">\${DB.batches.map(x=>\`<option value="\${x.id}" \${x.id===bid?'selected':''}>\${esc(x.name)} — Level \${x.level}</option>\`).join('')}</select>
     <input type="date" value="\${APP.range.from}" data-act="range" data-n="from"><input type="date" value="\${APP.range.to}" data-act="range" data-n="to">
     <span class="tiny" style="margin-left:auto">Showing \${fmtD(APP.range.from)} → \${fmtD(APP.range.to)}</span></div></div>
   <h2 style="margin-bottom:12px">\${esc(b.name)} — monthly report</h2>
   <div class="grid g-2-1" style="margin-bottom:15px">
    <div style="display:flex;flex-direction:column;gap:15px">
      \${section('👥 Members',\`<div class="grid g4" style="padding:16px 18px">
        \${stat('Total members',m.members.length,'in the batch',{r:'#/devotees'})}\${stat('Active',m.active,'attending',{r:'#/devotees'})}
        \${stat('New',m.neu,'joined this month',{r:'#/devotees'})}\${stat('Inactive',m.inactive,'not attending',{r:'#/devotees'})}</div>\`)}
      \${section('📖 Classes & events',\`<div class="grid g4" style="padding:16px 18px">
        \${stat('Classes',m.classes.length,'held or scheduled',{r:'#/classes'})}\${stat('Events',m.events.length,'special programmes',{r:'#/classes'})}
        \${stat('Average attendance',m.attendance+'%','across classes',{r:'#/batch-attendance'})}\${stat('Total attendance',m.totalAtt,'present marks recorded',{r:'#/batch-attendance'})}</div>\`)}
      \${section('📊 Attendance per class',m.perClass.length?\`<div class="card-b">\${barChart(m.perClass.slice(-6).map(p=>({l:fmtD(p.c.date).slice(0,6),v:p.pctv,color:'var(--indigo)',
        tip:\`\${p.c.name}\\n\${fmtLong(p.c.date)}\\nAttendance: \${p.pctv}%\\nPresent: \${p.present}\\nAbsent: \${p.total-p.present}\\nTotal: \${p.total}\`})),{unit:'%'})}
        <div class="tiny" style="margin-top:8px">Best \${m.best}% · lowest \${m.low}%</div></div>\`:emptyState('No completed classes','','',''))}
      \${section('🎓 Progression',\`<div class="list">\${progression.map(p=>\`<div class="li"><span class="grow"><span class="t">\${esc(p.l)}</span></span><b style="font-family:var(--f-head);font-size:18px">\${p.v}</b></div>\`).join('')}</div>\`)}
    </div>
    <div style="display:flex;flex-direction:column;gap:15px">
      \${section('🧾 Budget',\`<div class="card-b">\${budgetBlock(b.budget)}</div>\`)}
      \${section('⏰ Follow-ups',\`<div class="grid g2" style="padding:16px 18px;gap:9px">
        \${stat('Total',m.fus.total,'',{r:'#/followups'})}\${stat('Completed',m.fus.done,'',{r:'#/followups'})}
        \${stat('Pending',m.fus.pending,'',{r:'#/followups'})}\${stat('Overdue',m.fus.overdue,'',{tint:m.fus.overdue>0,r:'#/followups'})}</div>\`)}
      \${section('📝 Narrative',\`<div class="card-b">
        <div class="field"><label>Challenges</label><textarea name="ch">\${esc((DB.reports.find(r=>r.batch===bid)||{}).challenges||'')}</textarea></div>
        <div class="field"><label>Successes</label><textarea name="su">\${esc((DB.reports.find(r=>r.batch===bid)||{}).story||'')}</textarea></div>
        <div class="field"><label>Next month plan</label><textarea name="np">\${esc((DB.reports.find(r=>r.batch===bid)||{}).next||'')}</textarea></div>
        <button class="btn pri block" data-act="save-batch-narrative" data-id="\${bid}">\${ic('check')}Save report narrative</button></div>\`)}
    </div></div>
   <div class="grid g-2-1">
    \${section('Community-wide preaching funnel',\`<div class="card-b">\${funnelRows()}</div>\`)}
    \${section('Level distribution',\`<div class="card-b">\${barChart([1,2,3].map(l=>({l:'Level '+l,v:s.lvl[l-1],color:'var(--indigo)',
      tip:\`Level \${l}\\nDevotees: \${s.lvl[l-1]}\\nBatches: \${DB.batches.filter(x=>x.level===l).length}\`})),{horizontal:true})}</div>\`)}</div>\`;
}`;

console.log('Has oldVpr:', html.includes(oldVpr));
