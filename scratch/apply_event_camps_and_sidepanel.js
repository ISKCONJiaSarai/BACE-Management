const fs = require('fs');

let content = fs.readFileSync('public/index.html', 'utf8');
const isCRLF = content.includes('\r\n');
let lines = content.split(/\r?\n/);

console.log('Original line count:', lines.length);

// -------------------------------------------------------------------------------------
// 1. In assignDraft (around line 4835): add endDate
// -------------------------------------------------------------------------------------
const assignDraftIdx = lines.findIndex(l => l.includes('function assignDraft(){'));
if (assignDraftIdx !== -1) {
  const line = lines[assignDraftIdx + 1];
  if (line && !line.includes('endDate:')) {
    lines[assignDraftIdx + 1] = line.replace("date:iso(TODAY),", "date:iso(TODAY),endDate:iso(TODAY),");
    console.log('Added endDate to assignDraft');
  }
}

// -------------------------------------------------------------------------------------
// 2. In assignModal (isEvent block):
// Update title to "✨ Schedule Special Programme / Event / Camp"
// Add multi-day support with Start date & End date
// -------------------------------------------------------------------------------------
const isEventIdx = lines.findIndex(l => l.includes('const isEvent = d.type === \'Event\';'));
const isEventBlockEnd = lines.findIndex((l, i) => i > isEventIdx && l.includes('const isTask=d.type===\'Task\''));

const newEventModal = `  const isEvent = d.type === 'Event';

  /* ---------------- Schedule Event / Special Programme / Camp View (BACE Preaching) ---------------- */
  if(isEvent){
    return \`<div class="scrim" data-act="close-scrim"><div class="modal wide" data-stop="1">
     <div class="modal-h"><h2>✨ Schedule Special Programme / Event / Camp</h2><span class="tiny">Special programmes, seminars, festivals, kirtan, youth camps & multi-day retreats</span>
       <button class="icon-btn" style="margin-left:auto" data-act="close-scrim">\${ic('x')}</button></div>
     <div class="modal-b">
      <div class="form-row"><div class="field"><label>Programme / Event / Camp Title <span style="color:var(--danger)">*</span></label><input name="name" value="\${esc(d.name)}" placeholder="e.g. 3-Day Vrindavan Yatra Camp, Youth Fest Seminar, Janmashtami Mahotsav, Gita Residential Camp"></div>
        <div class="field"><label>Batch</label>
        <select name="batch">
          <option value="">-- All batches / Open to all --</option>
          \${activeBatches().map(b=>\`<option value="\${b.id}" \${d.batch===b.id?'selected':''}>\${esc(b.name)} (Level \${b.level})</option>\`).join('')}
        </select></div></div>
      <div class="form-row">
        <div class="field"><label>Start date <span style="color:var(--danger)">*</span></label><input type="date" name="date" value="\${d.date}"></div>
        <div class="field"><label>End date (for multi-day camps / retreats)</label><input type="date" name="endDate" value="\${d.endDate||d.date}"></div>
        <div class="field"><label>Start time</label><input type="time" name="start" value="\${d.start||'17:30'}"></div>
        <div class="field"><label>End time</label><input type="time" name="end" value="\${d.end||'20:30'}"></div>
      </div>
      <div class="form-row"><div class="field"><label>Location / Venue</label><input name="location" value="\${esc(d.location)}" placeholder="e.g. Main Temple Hall / BACE Centre / Campus Auditorium / Camp Site"></div>
        <div class="field"><label>Speaker / Lead Preacher</label>
        <input type="text" name="responsible" value="\${esc(dv(d.responsible)?.name || d.responsible || '')}" placeholder="e.g. HG Sundar Gopal Das"></div></div>
      <div class="form-row"><div class="field"><label>Expected Attendees</label><input type="number" name="expected" value="\${esc(d.expected||50)}" min="0" placeholder="e.g. 50"></div>
        <div class="field"><label>Budget Allocated (₹)</label><input type="number" name="budget" value="\${esc(d.budget||0)}" min="0" placeholder="e.g. 5000"></div></div>
      <div class="field"><label>Description / Agenda & Prasadam arrangements</label><textarea name="desc" placeholder="Special programme rundown, kirtan lead, speaker topic, prasadam arrangements, or guidelines for devotees…">\${esc(d.desc)}</textarea></div>
      <div class="field"><label>🔁 Repeats</label>
        <div class="chips">\${['One time','Weekly','Monthly','Annual'].map(r=>\`<button class="chip \${d.recurrence===r?'on':''}" data-act="draft" data-n="recurrence" data-v="\${r}">\${r}</button>\`).join('')}</div>
        \${d.recurrence!=='One time'?'<div class="hint">A recurring event schedule will be created and future event sessions generated automatically.</div>':''}</div>
     </div>
     <div class="modal-f"><button class="btn" data-act="close-scrim">Cancel</button>
       <button class="btn pri" data-act="save-assign">\${ic('check')}Create programme / camp</button></div></div></div>\`;
  }`;

lines.splice(isEventIdx, isEventBlockEnd - isEventIdx, newEventModal);
console.log('Replaced isEvent block in assignModal');

// -------------------------------------------------------------------------------------
// 3. Update checklistBlock(a) to have inline quick-add and interactive items
// -------------------------------------------------------------------------------------
const checklistIdx = lines.findIndex(l => l.includes('function checklistBlock(a){'));
const checklistEnd = lines.findIndex((l, i) => i > checklistIdx && l.includes('function viewDept(id){'));

const newChecklistBlock = `function checklistBlock(a){
  const items = a.actionItems || [];
  const done = items.filter(i=>i.done).length;
  return \`\${prog(pct(done,items.length||1),'var(--green)')}
   <div class="tiny" style="margin:6px 0 10px">\${done} of \${items.length} complete</div>
   <div class="list" style="border:1px solid var(--line);border-radius:12px;margin-bottom:8px">
    \${items.map((i,k)=>\`<div class="li click" data-act="toggle-item" data-id="\${a.id}" data-i="\${k}" style="cursor:pointer;display:flex;align-items:center;gap:10px">
      <input type="checkbox" \${i.done?'checked':''} style="pointer-events:none;width:16px;height:16px;accent-color:var(--green)">
      <span class="grow"><span class="t" style="\${i.done?'text-decoration:line-through;color:var(--ink-3)':''}">\${esc(i.t)}</span></span>
      <button class="btn ghost sm" data-act="del-action-item" data-id="\${a.id}" data-i="\${k}" title="Delete item" style="padding:2px 6px;font-size:12px;opacity:0.6">✕</button>
    </div>\`).join('')
    ||'<div class="li tiny">No action items yet. Add one below!</div>'}</div>
   <div style="display:flex;gap:8px;margin-top:6px">
     <input type="text" id="new-item-inp-\${a.id}" placeholder="Type new action item & press Enter..." style="flex:1;padding:6px 10px;border:1px solid var(--line);border-radius:8px;font-size:13px;background:var(--card);color:var(--ink)" onkeydown="if(event.key==='Enter'){document.getElementById('btn-add-item-\${a.id}').click();event.preventDefault();}">
     <button class="btn sm pri" id="btn-add-item-\${a.id}" data-act="quick-add-item" data-id="\${a.id}">+ Add item</button>
   </div>\`;
}`;

lines.splice(checklistIdx, checklistEnd - checklistIdx, newChecklistBlock);
console.log('Updated checklistBlock with inline quick-add and row clicks');

// -------------------------------------------------------------------------------------
// 4. Update activityModal(id) - side panel drawer
// - Scope devotees from the respective batch with batch switcher
// - Custom devotee input with datalist auto-complete from actual data
// - Required edit / save
// - Budget block always visible with edit button
// - Action items connected
// - Bottom buttons: Mark attendance & Mark completed / Reopen
// -------------------------------------------------------------------------------------
const actModalStart = lines.findIndex(l => l.includes('function activityModal(id){'));
const actModalEnd = lines.findIndex((l, i) => i > actModalStart && l.includes('function qrPanel(){'));

const newActivityModal = `function activityModal(id){
  const a=act(id);if(!a)return'';
  const asg=assignsFor(a.id);const f=filled(a);
  const mine=asg.find(x=>x.devotee===APP.user.devotee);
  const manager=ownsDept(a.dept)||ownsBatch(a.batch)||['coordinator','admin','area_leader','preaching_manager'].includes(APP.user.role);

  // Determine current active batch for suggestions
  const selBatchId = APP.sideDevFilterBatch !== undefined ? APP.sideDevFilterBatch : (a.batch || '');
  let scopeDevs = [];
  let scopeTitle = '';

  if(selBatchId){
    const bObj = batch(selBatchId);
    scopeTitle = bObj ? bObj.name : 'Batch';
    const bMems = batchMembers(selBatchId);
    scopeDevs = bMems.filter(x=>x.status!=='Inactive'&&!asg.some(s=>s.devotee===x.id));
  } else if(a.dept){
    scopeTitle = dept(a.dept)?.name || 'Department';
    scopeDevs = DB.devotees.filter(x=>x.status!=='Inactive'&&x.dept===a.dept&&!asg.some(s=>s.devotee===x.id));
  } else {
    scopeTitle = 'All Devotees';
    scopeDevs = DB.devotees.filter(x=>x.status!=='Inactive'&&!asg.some(s=>s.devotee===x.id));
  }
  scopeDevs.sort((p,q)=>q.attendancePct-p.attendancePct);

  const isMultiDay = a.endDate && a.endDate !== a.date;
  const whenLabel = isMultiDay 
    ? \`\${fmtD(a.date)} → \${fmtD(a.endDate)} (\${Math.round((new Date(a.endDate)-new Date(a.date))/(864e5))+1} days)\`
    : fmtD(a.date);

  return \`<div class="drawer-wrap" data-act="close-scrim"><div class="drawer" data-stop="1">
   <div class="modal-h"><div><h2 style="font-size:18px">\${typeEmoji(a.type)} \${esc(a.name)}</h2>
     <div class="tiny">\${esc(scopeName(a))} · \${whenLabel}\${a.start?\` · \${a.start}–\${a.end}\`:''}</div></div>
     <button class="icon-btn" style="margin-left:auto" data-act="close-scrim">\${ic('x')}</button></div>
   <div class="modal-b">
    <div class="chips" style="margin-bottom:13px">\${sbadge(a.status)}\${sbadge(a.priority)}\${a.location?badge(a.location,'grey'):''}
      \${isMultiDay?badge('⛺ Multi-day Camp','indigo'):''}
      \${a.recurrence!=='One time'?badge('🔁 '+a.recurrence,'sky'):''}\${a.overridden?badge('Exception','amber'):''}</div>
    <p class="muted" style="margin-top:0">\${esc(a.desc||'')}</p>
    \${a.type!=='Task'?\`<div class="fill-meter" style="margin:14px 0;display:flex;align-items:center;flex-wrap:wrap;gap:8px">
      \${APP.editNeedAct===a.id ? \`
        <div style="display:inline-flex;align-items:center;gap:6px">
          <span>Required:</span>
          <button class="btn sm" data-act="act-need-step" data-v="-1" style="padding:2px 7px;font-size:12px">−</button>
          <input type="number" id="act-need-input" value="\${a.need}" min="0" max="99" style="width:48px;padding:3px 6px;text-align:center;font-size:13px;border:1px solid var(--line);border-radius:6px;background:var(--card);color:var(--ink)" onkeydown="if(event.key==='Enter'){document.getElementById('save-need-btn').click();event.preventDefault();}">
          <button class="btn sm" data-act="act-need-step" data-v="1" style="padding:2px 7px;font-size:12px">+</button>
          <button class="btn sm pri" id="save-need-btn" data-act="save-act-need" data-id="\${a.id}" style="padding:3px 9px;font-size:11px">Save</button>
          <button class="btn sm" data-act="toggle-edit-need" data-id="\${a.id}" style="padding:3px 7px;font-size:11px">✕</button>
        </div>
      \` : \`
        <span>Required <b>\${a.need}</b>\${manager?\`<button class="btn sm" data-act="toggle-edit-need" data-id="\${a.id}" style="padding:2px 8px;font-size:11px;margin-left:6px;border-radius:6px">✏️ Edit</button>\`:''}</span>
      \`}
      <span style="margin-left:auto">Assigned <b>\${f}</b></span>
      \${f<a.need?\`<span class="badge b-red">⚠️ \${a.need-f} MORE REQUIRED</span>\`:\`<span class="badge b-green">✓ FILLED</span>\`}
    </div>\`:''}
    \${mine?\`<div class="note" style="margin-bottom:14px"><b>Your assignment:</b> \${mine.state}
      \${['Completed','Completed by Another'].includes(mine.state)?\`<br>Performed by \${esc(nameOf(mine.actualPerformer||mine.devotee))} at \${esc(mine.completedAt||'—')}\`:\`
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
        <button class="btn sm pri" data-act="complete-self" data-id="\${mine.id}">I have done it ✓</button>
        <button class="btn sm" data-act="complete-other" data-id="\${mine.id}">Someone else did this</button>
        \${mine.state==='Assigned'?\`<button class="btn sm" data-act="accept-assign" data-id="\${mine.id}">Accept</button>
        <button class="btn sm danger" data-act="decline-assign" data-id="\${mine.id}">Decline</button>\`:''}</div>\`}</div>\`:''}
    <h3 style="margin:16px 0 8px">Assigned devotees</h3>
    <div class="list" style="border:1px solid var(--line);border-radius:12px">
      \${asg.length?asg.map(x=>\`<div class="li" style="display:flex;align-items:center;gap:8px">\${av(nameOf(x.devotee))}
        <span class="grow"><span class="t">\${esc(nameOf(x.devotee))}</span>
        <span class="d">\${x.actualPerformer&&x.actualPerformer!==x.devotee?'Performed by '+esc(nameOf(x.actualPerformer)):(x.completedAt?'Completed '+esc(x.completedAt):esc(dv(x.devotee)?.service||(dv(x.devotee)?.batch?batch(dv(x.devotee)?.batch)?.name:'')))}</span></span>
        \${sbadge(x.state)}\${manager?\`<button class="btn sm danger" data-act="unassign" data-id="\${x.id}" style="padding:3px 8px;font-size:12px">Remove</button>\`:''}</div>\`).join('')
      :'<div class="li tiny">Nobody assigned yet.</div>'}</div>
    \${manager&&a.type!=='Task'?\`<div style="display:flex;align-items:center;justify-content:space-between;margin:16px 0 8px">
      <h3 style="margin:0">Suggested devotees (\${esc(scopeTitle)})</h3>
      <button class="btn sm" data-act="toggle-custom-devotee" data-a="\${a.id}">+ Custom devotee</button>
    </div>
    <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px">
      <span class="tiny muted" style="white-space:nowrap">From batch:</span>
      <select data-act="side-filter-batch" data-a="\${a.id}" style="padding:5px 8px;border:1px solid var(--line);border-radius:7px;font-size:12px;background:var(--card);color:var(--ink);flex:1">
        <option value="" \${!selBatchId?'selected':''}>All Batches / Community</option>
        \${DB.batches.map(b=>\`<option value="\${b.id}" \${selBatchId===b.id?'selected':''}>Batch: \${esc(b.name)} (\${batchMembers(b.id).length} members)</option>\`).join('')}
      </select>
    </div>
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">
      <select id="scope-devotee-sel" style="flex:1;padding:8px 10px;border:1px solid var(--line);border-radius:9px;font-size:13px;background:var(--card);color:var(--ink)">
        <option value="">Select devotee (\${scopeDevs.length} available)...</option>
        \${scopeDevs.map(d=>\`<option value="\${d.id}">\${esc(d.name)}\${d.batch && d.batch!==selBatchId ? \` (\${batch(d.batch)?.name||''})\` : ''} · \${d.attendancePct}% attendance</option>\`).join('')}
      </select>
      <button class="btn sm pri" data-act="assign-from-sel" data-a="\${a.id}">Assign</button>
    </div>
    \${APP.customDevoteeAct===a.id?\`<div style="display:flex;gap:8px;margin-bottom:12px;background:var(--surface-2);padding:10px 12px;border-radius:10px;border:1px solid var(--line);align-items:center">
      <input type="text" id="custom-devotee-input" list="side-dev-datalist" placeholder="Search / type devotee name..." style="flex:1;padding:7px 11px;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--ink);font-size:13px" onkeydown="if(event.key==='Enter'){document.getElementById('assign-custom-btn').click();event.preventDefault();}">
      <datalist id="side-dev-datalist">
        \${DB.devotees.filter(x=>x.status!=='Inactive').map(d=>\`<option value="\${esc(d.name)}">\${esc(d.name)} (\${esc(batch(d.batch)?.name||dept(d.dept)?.name||'Community')})</option>\`).join('')}
      </datalist>
      <button class="btn sm pri" id="assign-custom-btn" data-act="assign-custom-devotee" data-a="\${a.id}">Assign</button>
      <button class="btn sm" data-act="toggle-custom-devotee" data-a="\${a.id}">✕</button>
    </div>\`:''}\`:''}
    <h3 style="margin:16px 0 8px">Action items</h3>\${checklistBlock(a)}
    <h3 style="margin:16px 0 8px">Budget</h3>
    \${budgetBlock(a.budget||{allocated:0,spent:0})}
    \${manager?\`<button class="btn sm" style="margin-top:8px" data-act="edit-budget" data-kind="activity" data-id="\${a.id}">\${ic('edit')}Update budget</button>\`:''}
    \${a.proof?\`<h3 style="margin:16px 0 8px">Completion proof</h3><div class="note">📷 Photo uploaded by \${esc(nameOf(a.proof.by))} · retained until \${fmtD(a.proof.retainUntil)}</div>\`:''}
    \${a.report?\`<h3 style="margin:16px 0 8px">Report</h3><div class="note">\${esc(a.report)}</div>\`:''}
    \${a.templateId&&manager?\`<h3 style="margin:16px 0 8px">🔁 Recurring exception</h3>
      <div class="list" style="border:1px solid var(--line);border-radius:12px">
        <button class="li click" data-act="except-one" data-id="\${a.id}"><span class="grow"><span class="t">Change only this occurrence</span>
          <span class="d">Today's rota changes; the template stays as it is</span></span>\${ic('arrow')}</button>
        <button class="li click" data-act="except-future" data-id="\${a.id}"><span class="grow"><span class="t">Change this and all future occurrences</span>
          <span class="d">Updates the template from this date onward; history is retained</span></span>\${ic('arrow')}</button></div>\`:''}
   </div>
   <div class="modal-f">
     \${manager?\`
       <button class="btn" data-act="go-attendance-act" data-id="\${a.id}">\${ic('clock')}Mark attendance</button>
       \${a.status==='Completed'?\`
         <button class="btn" style="background:var(--green);color:#fff;border-color:var(--green)" data-act="reopen-activity" data-id="\${a.id}">\${ic('check')}Completed (Reopen)</button>
       \`:\`
         <button class="btn pri" data-act="complete-activity" data-id="\${a.id}">\${ic('check')}Mark completed</button>
       \`}
     \`:''}</div></div></div>\`;
}`;

lines.splice(actModalStart, actModalEnd - actModalStart, newActivityModal);
console.log('Replaced activityModal with active side panel');

// -------------------------------------------------------------------------------------
// 5. In batchAttendancePanel & attendanceMatrix: include Events alongside Classes
// -------------------------------------------------------------------------------------
const bAttPanelIdx = lines.findIndex(l => l.includes('function batchAttendancePanel(){'));
if (bAttPanelIdx !== -1) {
  const clLineIdx = lines.findIndex((l, i) => i > bAttPanelIdx && l.includes('batchActs(bid).filter(a=>a.type===\'Class\')'));
  if (clLineIdx !== -1) {
    lines[clLineIdx] = lines[clLineIdx].replace("a.type==='Class'", "(a.type==='Class'||a.type==='Event')");
    console.log('Updated batchAttendancePanel to include Events');
  }
}

const bAttMatrixIdx = lines.findIndex(l => l.includes('function attendanceMatrix(){'));
if (bAttMatrixIdx !== -1) {
  const clMatrixIdx = lines.findIndex((l, i) => i > bAttMatrixIdx && l.includes('batchActs(bid).filter(a=>a.type===\'Class\'&&a.status===\'Completed\')'));
  if (clMatrixIdx !== -1) {
    lines[clMatrixIdx] = lines[clMatrixIdx].replace("a.type==='Class'", "(a.type==='Class'||a.type==='Event')");
    console.log('Updated attendanceMatrix to include Events');
  }
}

// In batchAttendancePanel action buttons: add Create event button beside Schedule class
const bAttSchedBtnIdx = lines.findIndex(l => l.includes('style="border-color:var(--indigo-soft);color:var(--indigo)">${ic(\'plus\')}Schedule class</button>'));
if (bAttSchedBtnIdx !== -1) {
  lines[bAttSchedBtnIdx] = `        <button class="btn sm" data-act="open-schedule" data-batch="\${bid}" data-type="Event">✨ Create event</button>
        <button class="btn sm" data-act="open-schedule" data-batch="\${bid}" data-type="Class" style="border-color:var(--indigo-soft);color:var(--indigo)">\${ic('plus')}Schedule class</button>`;
  console.log('Added Create event button beside Schedule class in batchAttendancePanel');
}

// -------------------------------------------------------------------------------------
// 6. In viewClasses: add Create event button beside Schedule class
// -------------------------------------------------------------------------------------
const viewClassesIdx = lines.findIndex(l => l.includes('function viewClasses(){'));
if (viewClassesIdx !== -1) {
  const headLineIdx = lines.findIndex((l, i) => i > viewClassesIdx && l.includes('head(\'✨ BACE Preaching\',\'Classes & events\''));
  if (headLineIdx !== -1) {
    // Next line is `<button class="btn pri" data-act="open-schedule" data-type="Class">${ic('plus')}Schedule class</button>`)+
    lines[headLineIdx + 1] = `    \`<button class="btn" data-act="open-schedule" data-type="Event" style="margin-right:6px">✨ Create event / camp</button><button class="btn pri" data-act="open-schedule" data-type="Class">\${ic('plus')}Schedule class</button>\`)+`;
    console.log('Added Create event button in viewClasses header');
  }

  // Also in emptyState of viewClasses:
  const emptyStateIdx = lines.findIndex((l, i) => i > viewClassesIdx && l.includes('empty:emptyState(\'Nothing here\',\'No classes or events match this filter.\''));
  if (emptyStateIdx !== -1) {
    lines[emptyStateIdx] = lines[emptyStateIdx].replace(
      "'<button class=\"btn pri\" data-act=\"open-schedule\" data-type=\"Class\">Schedule class</button>'",
      "'<button class=\"btn\" data-act=\"open-schedule\" data-type=\"Event\" style=\"margin-right:6px\">✨ Create event / camp</button><button class=\"btn pri\" data-act=\"open-schedule\" data-type=\"Class\">Schedule class</button>'"
    );
    console.log('Added Create event button in viewClasses emptyState');
  }
}

// -------------------------------------------------------------------------------------
// 7. In viewBatchAttendance header: add Create event button beside Schedule class
// -------------------------------------------------------------------------------------
const vbAttIdx = lines.findIndex(l => l.includes('function viewBatchAttendance(){'));
if (vbAttIdx !== -1) {
  const btnLineIdx = lines.findIndex((l, i) => i > vbAttIdx && l.includes('<button class="btn pri" data-act="open-schedule" data-batch="${bid}" data-type="Class">'));
  if (btnLineIdx !== -1) {
    lines[btnLineIdx] = `    \`<button class="btn" data-act="open-schedule" data-batch="\${bid}" data-type="Event" style="margin-right:6px">✨ Create event / camp</button><button class="btn pri" data-act="open-schedule" data-batch="\${bid}" data-type="Class">\${ic('plus')}Schedule class</button>\`)+`;
    console.log('Added Create event button in viewBatchAttendance header');
  }
}

// -------------------------------------------------------------------------------------
// 8. In FAB menu: add Create event / camp option
// -------------------------------------------------------------------------------------
const fabActsIdx = lines.findIndex(l => l.includes("const acts=[['Assign seva','📋','open-assign','assign'],['Schedule class','🗓️','open-schedule','preaching']"));
if (fabActsIdx !== -1) {
  lines[fabActsIdx] = lines[fabActsIdx].replace(
    "['Schedule class','🗓️','open-schedule','preaching'],",
    "['Schedule class','🗓️','open-schedule','preaching'],['Create event / camp','✨','open-schedule-event','preaching'],"
  );
  console.log('Added Create event to FAB menu');
}

// -------------------------------------------------------------------------------------
// 9. Update click listeners for:
// - side-filter-batch
// - quick-add-item
// - del-action-item
// - reopen-activity
// - open-schedule-event
// - go-attendance-act (support events & batches)
// - close-scrim backdrop click
// -------------------------------------------------------------------------------------
const clickCaseIdx = lines.findIndex(l => l.includes("case 'toggle-item':{"));
if (clickCaseIdx !== -1) {
  const extraCases = `  case 'side-filter-batch':stop();{
    APP.sideDevFilterBatch = t.value;
    render();
    break}
  case 'quick-add-item':stop();{
    const aId = t.dataset.id;
    const inp = document.getElementById('new-item-inp-' + aId);
    const text = inp ? inp.value.trim() : '';
    if(!text){ toast('Please enter an action item description','⚠️'); break; }
    const a = act(aId);
    if(a){
      if(!a.actionItems) a.actionItems = [];
      a.actionItems.push({t: text, done: false});
      logAudit('Action item added', a.name + ': ' + text);
      toast('Action item added');
      render();
    }
    break}
  case 'del-action-item':stop();{
    const aId = t.dataset.id, idx = +t.dataset.i;
    const a = act(aId);
    if(a && a.actionItems){
      a.actionItems.splice(idx, 1);
      logAudit('Action item removed', a.name);
      toast('Action item removed');
      render();
    }
    break}
  case 'reopen-activity':stop();{
    const a = act(id);
    if(a){
      a.status = 'Scheduled';
      logAudit('Activity reopened', a.name);
      toast('Activity reopened','🔄');
      render();
    }
    break}
  case 'open-schedule-event':stop();{
    APP.draft.assign = null;
    const d = assignDraft();
    d.type = 'Event';
    d.start = '17:30'; d.end = '20:30';
    APP.fabOpen = false; APP.modal = 'assign'; render(); break}
`;
  lines.splice(clickCaseIdx, 0, extraCases);
  console.log('Inserted side panel handlers before toggle-item');
}

// Update go-attendance-act
const goAttActIdx = lines.findIndex(l => l.includes("case 'go-attendance-act':stop();{"));
if (goAttActIdx !== -1) {
  const goAttEndIdx = lines.findIndex((l, i) => i > goAttActIdx && l.includes('break}'));
  const newGoAttCase = `  case 'go-attendance-act':stop();{const a=act(id);APP.modal='';
    if(a.batch){
      APP.filters.attBatch=a.batch;
      APP.filters.attClass=a.id;
      go('#/batch-attendance');
    } else if(a.dept){
      APP.tab.att='Seva & activities';
      APP.filters.attDept=a.dept;
      APP.filters.attAct=a.id;
      go('#/attendance');
    } else {
      APP.filters.attClass=a.id;
      go('#/batch-attendance');
    }
    break}`;
  lines.splice(goAttActIdx, goAttEndIdx - goAttActIdx + 1, newGoAttCase);
  console.log('Updated go-attendance-act handler');
}

// Update close-scrim backdrop click
const closeScrimIdx = lines.findIndex(l => l.includes("case 'close-scrim':{"));
if (closeScrimIdx !== -1) {
  const closeScrimEndIdx = lines.findIndex((l, i) => i > closeScrimIdx && l.includes("APP.modal='';APP.fabOpen=false;render();break}"));
  const newCloseScrimCase = `  case 'close-scrim':{
    const isExplicitCloseBtn = t.closest('[data-stop]');
    const isBackdropClick = e.target.classList && (e.target.classList.contains('scrim') || e.target.classList.contains('drawer-wrap'));
    if(!isExplicitCloseBtn && !isBackdropClick) break;
    APP.modal='';APP.fabOpen=false;render();break}`;
  lines.splice(closeScrimIdx, closeScrimEndIdx - closeScrimIdx + 1, newCloseScrimCase);
  console.log('Updated close-scrim handler to allow backdrop click to dismiss');
}


// In syncAssign: add endDate
const syncAssignIdx = lines.findIndex(l => l.includes('function syncAssign(){'));
if (syncAssignIdx !== -1) {
  const fieldsLineIdx = lines.findIndex((l, i) => i > syncAssignIdx && l.includes("['name','date',"));
  if (fieldsLineIdx !== -1 && !lines[fieldsLineIdx].includes("'endDate'")) {
    lines[fieldsLineIdx] = lines[fieldsLineIdx].replace("'date',", "'date','endDate',");
    console.log('Added endDate to syncAssign');
  }
}

// In save-assign: store endDate
const saveAssignBatchLineIdx = lines.findIndex(l => l.includes("cat:(d.type==='Class'||d.type==='Event')?'Classes':"));
if (saveAssignBatchLineIdx === -1) {
  const mkLineIdx = lines.findIndex(l => l.includes("cat:d.type==='Class'?'Classes':d.type==='Event'?'Preaching'"));
  if (mkLineIdx !== -1) {
    lines[mkLineIdx] = lines[mkLineIdx].replace("date,start:d.start,", "date,endDate:d.endDate||date,start:d.start,");
    console.log('Added endDate to created activity in save-assign');
  }
}

const finalHtml = lines.join(isCRLF ? '\r\n' : '\n');
fs.writeFileSync('public/index.html', finalHtml);
console.log('Successfully written updated public/index.html!');
