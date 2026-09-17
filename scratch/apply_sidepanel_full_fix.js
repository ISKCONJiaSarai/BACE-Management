const fs = require('fs');

let content = fs.readFileSync('public/index.html', 'utf8');
const isCRLF = content.includes('\r\n');
let lines = content.split(/\r?\n/);

console.log('Original line count:', lines.length);

// -------------------------------------------------------------------------------------
// 1. Add saveActivitiesToStorage, loadActivitiesFromStorage, saveAssignmentsToStorage, loadAssignmentsFromStorage
// (Right next to saveBatchesToStorage around line 9960)
// -------------------------------------------------------------------------------------
const saveBatchesIdx = lines.findIndex(l => l.includes('function saveBatchesToStorage(){'));
const storageHelpersSnippet = `function saveActivitiesToStorage(){
  try{
    localStorage.setItem('bace_activities_store', JSON.stringify(DB.activities || []));
  }catch(e){console.warn('saveActivitiesToStorage error:', e)}
}

function loadActivitiesFromStorage(){
  try{
    const raw = localStorage.getItem('bace_activities_store');
    if(!raw) return;
    const list = JSON.parse(raw);
    if(Array.isArray(list)){
      list.forEach(saved => {
        const a = (DB.activities||[]).find(x => x.id === saved.id);
        if(a){
          Object.assign(a, saved);
        } else {
          DB.activities.push(saved);
        }
      });
    }
  }catch(e){console.warn('loadActivitiesFromStorage error:', e)}
}

function saveAssignmentsToStorage(){
  try{
    localStorage.setItem('bace_assignments_store', JSON.stringify(DB.assignments || []));
  }catch(e){console.warn('saveAssignmentsToStorage error:', e)}
}

function loadAssignmentsFromStorage(){
  try{
    const raw = localStorage.getItem('bace_assignments_store');
    if(!raw) return;
    const list = JSON.parse(raw);
    if(Array.isArray(list)){
      list.forEach(saved => {
        const as = (DB.assignments||[]).find(x => x.id === saved.id);
        if(as){
          Object.assign(as, saved);
        } else {
          DB.assignments.push(saved);
        }
      });
    }
  }catch(e){console.warn('loadAssignmentsFromStorage error:', e)}
}
`;

lines.splice(saveBatchesIdx, 0, storageHelpersSnippet);
console.log('Inserted activity & assignment storage helper functions');

// -------------------------------------------------------------------------------------
// 2. Call loadActivitiesFromStorage() & loadAssignmentsFromStorage() at boot
// (Around line 14905)
// -------------------------------------------------------------------------------------
const bootIdx = lines.findIndex(l => l.includes('loadBatchesFromStorage();'));
if (bootIdx !== -1) {
  lines.splice(bootIdx + 1, 0, 'loadActivitiesFromStorage();\nloadAssignmentsFromStorage();');
  console.log('Added loadActivitiesFromStorage & loadAssignmentsFromStorage to boot');
}

// -------------------------------------------------------------------------------------
// 3. In activityModal:
// - Remove data-act="close-scrim" from .drawer-wrap so outside clicks do NOT close
// - Ensure suggested devotees select and Assign button are properly flexed and visible
// - Ensure live data from respective batch is selected
// -------------------------------------------------------------------------------------
const actModalStart = lines.findIndex(l => l.includes('function activityModal(id){'));
const actModalEnd = lines.findIndex((l, i) => i > actModalStart && l.includes('function qrPanel(){'));

const newActivityModal = `function activityModal(id){
  const a=act(id);if(!a)return'';
  const asg=assignsFor(a.id);const f=filled(a);
  const mine=asg.find(x=>x.devotee===APP.user.devotee);
  const manager=ownsDept(a.dept)||ownsBatch(a.batch)||['coordinator','admin','area_leader','preaching_manager'].includes(APP.user.role);

  // Determine current active batch for suggestions (default to activity batch if set)
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

  return \`<div class="drawer-wrap"><div class="drawer" data-stop="1">
   <div class="modal-h"><div><h2 style="font-size:18px">\${typeEmoji(a.type)} \${esc(a.name)}</h2>
     <div class="tiny">\${esc(scopeName(a))} · \${whenLabel}\${a.start?\` · \${a.start}–\${a.end}\`:''}</div></div>
     <button class="icon-btn" style="margin-left:auto" data-act="close-scrim" title="Close panel">\${ic('x')}</button></div>
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
      <select data-act="side-filter-batch" data-a="\${a.id}" style="padding:5px 8px;border:1px solid var(--line);border-radius:7px;font-size:12px;background:var(--card);color:var(--ink);flex:1;min-width:0">
        <option value="" \${!selBatchId?'selected':''}>All Batches / Community</option>
        \${DB.batches.map(b=>\`<option value="\${b.id}" \${selBatchId===b.id?'selected':''}>Batch: \${esc(b.name)} (\${batchMembers(b.id).length} members)</option>\`).join('')}
      </select>
    </div>
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">
      <select id="scope-devotee-sel" style="flex:1 1 0%;min-width:0;padding:8px 10px;border:1px solid var(--line);border-radius:9px;font-size:13px;background:var(--card);color:var(--ink)">
        <option value="">Select devotee (\${scopeDevs.length} available)...</option>
        \${scopeDevs.map(d=>\`<option value="\${d.id}">\${esc(d.name)}\${d.batch && d.batch!==selBatchId ? \` (\${batch(d.batch)?.name||''})\` : ''} · \${d.attendancePct}% attendance</option>\`).join('')}
      </select>
      <button class="btn sm pri" data-act="assign-from-sel" data-a="\${a.id}" style="flex-shrink:0;padding:8px 14px;white-space:nowrap">\${ic('plus')}Assign</button>
    </div>
    \${APP.customDevoteeAct===a.id?\`<div style="display:flex;gap:8px;margin-bottom:12px;background:var(--surface-2);padding:10px 12px;border-radius:10px;border:1px solid var(--line);align-items:center">
      <input type="text" id="custom-devotee-input" list="side-dev-datalist" placeholder="Search / type devotee name..." style="flex:1 1 0%;min-width:0;padding:7px 11px;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--ink);font-size:13px" onkeydown="if(event.key==='Enter'){document.getElementById('assign-custom-btn').click();event.preventDefault();}">
      <datalist id="side-dev-datalist">
        \${DB.devotees.filter(x=>x.status!=='Inactive').map(d=>\`<option value="\${esc(d.name)}">\${esc(d.name)} (\${esc(batch(d.batch)?.name||dept(d.dept)?.name||'Community')})</option>\`).join('')}
      </datalist>
      <button class="btn sm pri" id="assign-custom-btn" data-act="assign-custom-devotee" data-a="\${a.id}" style="flex-shrink:0">\${ic('check')}Assign</button>
      <button class="btn sm" data-act="toggle-custom-devotee" data-a="\${a.id}" style="flex-shrink:0">✕</button>
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
console.log('Replaced activityModal with active side panel and responsive Assign button');

// -------------------------------------------------------------------------------------
// 4. Update close-scrim handler:
// Only close if explicit button with data-act="close-scrim" was clicked. Clicking outside does NOT close.
// -------------------------------------------------------------------------------------
const closeScrimIdx = lines.findIndex(l => l.includes("case 'close-scrim':{"));
const closeScrimEndIdx = lines.findIndex((l, i) => i > closeScrimIdx && l.includes("APP.modal='';APP.fabOpen=false;render();break}"));

const newCloseScrim = `  case 'close-scrim':{
    // Close ONLY if clicked an explicit close button (like the top right (x) button or a Cancel button)
    const isExplicitBtn = t.closest('.icon-btn') || t.tagName==='BUTTON' || t.closest('button');
    if(!isExplicitBtn) break; // clicking outside the panel will NOT close
    APP.modal='';APP.fabOpen=false;render();break}`;

lines.splice(closeScrimIdx, closeScrimEndIdx - closeScrimIdx + 1, newCloseScrim);
console.log('Updated close-scrim to only close on explicit close button click');

// -------------------------------------------------------------------------------------
// 5. In document.addEventListener('change'):
// Add case 'side-filter-batch'
// -------------------------------------------------------------------------------------
const changeCaseIdx = lines.findIndex(l => l.includes("document.addEventListener('change',e=>{"));
const changeSwitchIdx = lines.findIndex((l, i) => i > changeCaseIdx && l.includes("switch(a){"));

lines.splice(changeSwitchIdx + 1, 0, `   case 'side-filter-batch':{APP.sideDevFilterBatch=t.value;render();break}`);
console.log('Added side-filter-batch to change event listener');

// -------------------------------------------------------------------------------------
// 6. In click event listener:
// Call saveActivitiesToStorage() and saveAssignmentsToStorage() on all mutating activity actions!
// -------------------------------------------------------------------------------------
// 6a. assign-from-sel
const assignSelIdx = lines.findIndex(l => l.includes("case 'assign-from-sel':stop();{"));
if (assignSelIdx !== -1) {
  const assignSelEndIdx = lines.findIndex((l, i) => i > assignSelIdx && l.includes("render();"));
  lines.splice(assignSelEndIdx, 0, "    saveAssignmentsToStorage();saveActivitiesToStorage();");
  console.log('Added storage save to assign-from-sel');
}

// 6b. assign-custom-devotee
const assignCustomIdx = lines.findIndex(l => l.includes("case 'assign-custom-devotee':stop();{"));
if (assignCustomIdx !== -1) {
  const assignCustomEndIdx = lines.findIndex((l, i) => i > assignCustomIdx && l.includes("render();"));
  lines.splice(assignCustomEndIdx, 0, "    saveAssignmentsToStorage();saveActivitiesToStorage();");
  console.log('Added storage save to assign-custom-devotee');
}

// 6c. unassign
const unassignIdx = lines.findIndex(l => l.includes("case 'unassign':stop();{"));
if (unassignIdx !== -1) {
  const unassignEndIdx = lines.findIndex((l, i) => i > unassignIdx && l.includes("toast('Removed');render();break}"));
  lines[unassignEndIdx] = "    saveAssignmentsToStorage();saveActivitiesToStorage();toast('Removed');render();break}";
  console.log('Added storage save to unassign');
}

// 6d. save-act-need
const saveNeedIdx = lines.findIndex(l => l.includes("case 'save-act-need':stop();{"));
if (saveNeedIdx !== -1) {
  const saveNeedEndIdx = lines.findIndex((l, i) => i > saveNeedIdx && l.includes("toast('Required volunteers set to '+val);"));
  lines.splice(saveNeedEndIdx, 0, "      saveActivitiesToStorage();");
  console.log('Added storage save to save-act-need');
}

// 6e. toggle-item
const toggleItemIdx = lines.findIndex(l => l.includes("case 'toggle-item':{"));
if (toggleItemIdx !== -1) {
  lines[toggleItemIdx] = "  case 'toggle-item':{const a=act(id);a.actionItems[+t.dataset.i].done=!a.actionItems[+t.dataset.i].done;saveActivitiesToStorage();";
  console.log('Added storage save to toggle-item');
}

// 6f. quick-add-item
const quickAddIdx = lines.findIndex(l => l.includes("case 'quick-add-item':stop();{"));
if (quickAddIdx !== -1) {
  const qAddRenderIdx = lines.findIndex((l, i) => i > quickAddIdx && l.includes("toast('Action item added');"));
  lines.splice(qAddRenderIdx, 0, "      saveActivitiesToStorage();");
  console.log('Added storage save to quick-add-item');
}

// 6g. del-action-item
const delItemIdx = lines.findIndex(l => l.includes("case 'del-action-item':stop();{"));
if (delItemIdx !== -1) {
  const dItemRenderIdx = lines.findIndex((l, i) => i > delItemIdx && l.includes("toast('Action item removed');"));
  lines.splice(dItemRenderIdx, 0, "      saveActivitiesToStorage();");
  console.log('Added storage save to del-action-item');
}

// 6h. complete-activity & reopen-activity
const compActIdx = lines.findIndex(l => l.includes("case 'complete-activity':stop();{"));
if (compActIdx !== -1) {
  const compRenderIdx = lines.findIndex((l, i) => i > compActIdx && l.includes("logAudit('Activity completed',a.name);"));
  lines.splice(compRenderIdx, 0, "    saveActivitiesToStorage();saveAssignmentsToStorage();");
  console.log('Added storage save to complete-activity');
}

const reopenActIdx = lines.findIndex(l => l.includes("case 'reopen-activity':stop();{"));
if (reopenActIdx !== -1) {
  const reopenRenderIdx = lines.findIndex((l, i) => i > reopenActIdx && l.includes("logAudit('Activity reopened', a.name);"));
  lines.splice(reopenRenderIdx, 0, "      saveActivitiesToStorage();saveAssignmentsToStorage();");
  console.log('Added storage save to reopen-activity');
}

// 6i. save-budget
const saveBudgetIdx = lines.findIndex(l => l.includes("case 'save-budget':{"));
if (saveBudgetIdx !== -1) {
  const budgetSaveLineIdx = lines.findIndex((l, i) => i > saveBudgetIdx && l.includes("if(kind==='batch') saveBatchesToStorage();"));
  if (budgetSaveLineIdx !== -1) {
    lines[budgetSaveLineIdx] = "    if(kind==='batch') saveBatchesToStorage();\n    if(kind==='activity') saveActivitiesToStorage();";
    console.log('Added saveActivitiesToStorage to save-budget');
  }
}

// 6j. save-assign (when creating new activities)
const saveAssignIdx = lines.findIndex(l => l.includes("case 'save-assign':{syncAssign();const d=assignDraft();"));
if (saveAssignIdx !== -1) {
  const saveAssignEndIdx = lines.findIndex((l, i) => i > saveAssignIdx && l.includes("APP.draft.assign=null;APP.modal='';render();break}"));
  lines.splice(saveAssignEndIdx, 0, "    saveActivitiesToStorage();saveAssignmentsToStorage();");
  console.log('Added storage save to save-assign');
}

// -------------------------------------------------------------------------------------
// 7. In viewClasses: Add Volunteers column so assigned volunteer devotees reflect immediately!
// -------------------------------------------------------------------------------------
const viewClassesIdx = lines.findIndex(l => l.includes('function viewClasses(){'));
if (viewClassesIdx !== -1) {
  const attColIdx = lines.findIndex((l, i) => i > viewClassesIdx && l.includes("{h:'Attendance',c:a=>{"));
  if (attColIdx !== -1) {
    const volColSnippet = `      {h:'Volunteers',c:a=>{
        const f=filled(a);
        const asg=assignsFor(a.id);
        if(!a.need && !asg.length) return '<span class="tiny muted">—</span>';
        const names = asg.map(s=>nameOf(s.devotee)).join(', ');
        return \`<div style="min-width:96px" \${tipAttr(names ? 'Assigned: '+names : 'No devotees assigned yet')}>
          \${prog(a.need?f/a.need*100:(f?100:0), f<a.need?'var(--danger)':'var(--green)')}
          <span class="tiny">\${f} of \${a.need||f}\${names?\` · \${esc(asg[0]?nameOf(asg[0].devotee):'')}\${asg.length>1?\` +\${asg.length-1}\`:''}\`:''}</span>
        </div>\`;
      }},`;
    lines.splice(attColIdx, 0, volColSnippet);
    console.log('Added Volunteers column to viewClasses table');
  }
}

const finalHtml = lines.join(isCRLF ? '\r\n' : '\n');
fs.writeFileSync('public/index.html', finalHtml);
console.log('Successfully written updated public/index.html!');
