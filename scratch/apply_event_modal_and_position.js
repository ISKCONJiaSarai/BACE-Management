const fs = require('fs');

let content = fs.readFileSync('public/index.html', 'utf8');
const isCRLF = content.includes('\r\n');
const lines = content.split(/\r?\n/);

console.log('Initial line count:', lines.length);

// 1. In assignModal (around line 4845), add the isEvent view
const assignModalStart = lines.findIndex(l => l.includes('function assignModal(){'));
console.log('assignModalStart:', assignModalStart);

const isClassIdx = lines.findIndex((l, i) => i > assignModalStart && l.includes("const isClass=d.type==='Class';"));
console.log('isClassIdx:', isClassIdx);

const eventModalSnippet = `  const isEvent = d.type === 'Event';

  /* ---------------- Schedule Event / Special Programme View (BACE Preaching) ---------------- */
  if(isEvent){
    return \`<div class="scrim" data-act="close-scrim"><div class="modal wide" data-stop="1">
     <div class="modal-h"><h2>✨ Schedule Special Programme / Event</h2><span class="tiny">Special programmes, seminars, festivals, kirtan and camps</span>
       <button class="icon-btn" style="margin-left:auto" data-act="close-scrim">\${ic('x')}</button></div>
     <div class="modal-b">
      <div class="form-row"><div class="field"><label>Event Name / Programme Title <span style="color:var(--danger)">*</span></label><input name="name" value="\${esc(d.name)}" placeholder="e.g. Janmashtami Special Kirtan & Katha, Youth Fest Seminar, BACE Camp"></div>
        <div class="field"><label>Batch</label>
        <select name="batch">
          <option value="">-- All batches / Open to all --</option>
          \${activeBatches().map(b=>\`<option value="\${b.id}" \${d.batch===b.id?'selected':''}>\${esc(b.name)} (Level \${b.level})</option>\`).join('')}
        </select></div></div>
      <div class="form-row t3"><div class="field"><label>Date <span style="color:var(--danger)">*</span></label><input type="date" name="date" value="\${d.date}"></div>
        <div class="field"><label>Start time</label><input type="time" name="start" value="\${d.start||'17:30'}"></div>
        <div class="field"><label>End time</label><input type="time" name="end" value="\${d.end||'20:30'}"></div></div>
      <div class="form-row"><div class="field"><label>Location / Venue</label><input name="location" value="\${esc(d.location)}" placeholder="e.g. Main Temple Hall / BACE Centre / Campus Auditorium"></div>
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
       <button class="btn pri" data-act="save-assign">\${ic('check')}Create event</button></div></div></div>\`;
  }`;

lines.splice(isClassIdx + 1, 0, eventModalSnippet);
console.log('Inserted isEvent modal in assignModal');

// 2. In batchDashboardBody, move Events & special programmes to be directly below Today & next class, and remove it from the bottom
const todayNextClassEnd = lines.findIndex(l => l.includes("Schedule class</button>`:'')}"));
console.log('todayNextClassEnd:', todayNextClassEnd);

const eventSectionSnippet = `      \${section('✨ Events & special programmes',events.length?\`<div class="tbl-wrap">\${actTable(events)}</div>\`
        :emptyState('No events yet','Create an event for this batch.',ownsBatch(b.id)?\`<button class="btn pri" data-act="open-schedule" data-batch="\${b.id}" data-type="Event">Create event</button>\`:''),
        ownsBatch(b.id)?\`<button class="btn sm pri" data-act="open-schedule" data-batch="\${b.id}" data-type="Event">\${ic('plus')}Create event</button>\`:null)}`;

lines.splice(todayNextClassEnd + 1, 0, eventSectionSnippet);
console.log('Inserted Events section directly below Today & next class');

// Now remove the old events section at the bottom of batchDashboardBody
const oldEventSectionIdx = lines.findIndex((l, i) => i > todayNextClassEnd + 5 && l.includes("section('✨ Events & special programmes'"));
console.log('oldEventSectionIdx:', oldEventSectionIdx);
if (oldEventSectionIdx !== -1) {
  // Line before was `</div></div>` which ends the grid
  lines.splice(oldEventSectionIdx, 2); // removes the section and the emptyState line
  const lastGridIdx = lines.findIndex((l, i) => i > oldEventSectionIdx - 5 && l.includes('</div></div>'));
  lines[lastGridIdx] = '    </div></div>`;';
  console.log('Removed duplicate Events section from the bottom of batchDashboardBody');
}

// 3. Update viewBatch header to add Create event button
const vbHeaderIdx = lines.findIndex(l => l.includes('<button class="btn pri" data-act="open-schedule" data-batch="${b.id}" data-type="Class">${ic(\'plus\')}Schedule class</button>'));
if (vbHeaderIdx !== -1) {
  lines[vbHeaderIdx] = `      <button class="btn" data-act="open-schedule" data-batch="\${b.id}" data-type="Event">✨ Create event</button>
      <button class="btn pri" data-act="open-schedule" data-batch="\${b.id}" data-type="Class">\${ic('plus')}Schedule class</button>\`:null)+`;
  console.log('Updated viewBatch header with Create event button');
}

// 4. Update case 'open-schedule': and case 'open-assign':
const openAssignCaseIdx = lines.findIndex(l => l.includes("case 'open-schedule':"));
const openAssignEndIdx = lines.findIndex((l, i) => i > openAssignCaseIdx && l.includes("APP.modal='assign';render();break}"));
console.log('openAssignCaseIdx:', openAssignCaseIdx, 'openAssignEndIdx:', openAssignEndIdx);

const newOpenAssignCase = `  case 'open-schedule':
  case 'open-assign':{stop();APP.draft.assign=null;const d=assignDraft();
    const reqType = t.dataset.type || (a==='open-schedule'||t.dataset.act==='open-schedule'?'Class':'Seva');
    d.type = reqType;
    if(t.dataset.batch) d.batch = t.dataset.batch;
    else if(d.type==='Class') d.batch = (activeBatches()[0]||{}).id||'';
    if(t.dataset.dept) d.dept = t.dataset.dept;
    if(d.type==='Event' && !d.start){ d.start='17:30'; d.end='20:30'; }
    APP.fabOpen=false;APP.modal='assign';render();break}`;

lines.splice(openAssignCaseIdx, openAssignEndIdx - openAssignCaseIdx + 1, newOpenAssignCase);
console.log('Updated open-schedule / open-assign handler');

// 5. Update save-assign to handle Event
const saveAssignIdx = lines.findIndex(l => l.includes("case 'save-assign':{syncAssign();const d=assignDraft();"));
const saveAssignValidationIdx = lines.findIndex((l, i) => i > saveAssignIdx && l.includes("if(!d.name.trim()){toast("));
if (saveAssignValidationIdx !== -1) {
  lines[saveAssignValidationIdx] = lines[saveAssignValidationIdx].replace(
    "toast(d.type==='Class'?'Please give the class a name / topic':'Please give the seva / service a name','⚠️');",
    "toast(d.type==='Class'?'Please give the class a name / topic':d.type==='Event'?'Please enter the event / programme title':'Please give the seva / service a name','⚠️');"
  );
  console.log('Updated name validation in save-assign');
}

const saveAssignBatchLineIdx = lines.findIndex((l, i) => i > saveAssignIdx && l.includes("dept:d.type==='Class'?null:d.dept,batch:d.type==='Class'?d.batch:null"));
console.log('saveAssignBatchLineIdx:', saveAssignBatchLineIdx);

if (saveAssignBatchLineIdx !== -1) {
  lines[saveAssignBatchLineIdx] = lines[saveAssignBatchLineIdx]
    .replace("dept:d.type==='Class'?null:d.dept,batch:d.type==='Class'?d.batch:null", "dept:(d.type==='Class'||d.type==='Event')?null:d.dept,batch:(d.type==='Class'||d.type==='Event')?d.batch:null")
    .replace("expected:0", "expected:+d.expected||0");
  console.log('Updated activity creation for Event in save-assign');
}

// In save-assign notifications:
const saveAssignToastIdx = lines.findIndex((l, i) => i > saveAssignIdx && l.includes("if(d.type==='Class'){"));
if (saveAssignToastIdx !== -1) {
  const eventToastSnippet = `    } else if(d.type==='Event'){
      DB.notifications.unshift({id:uid('n'),em:'✨',title:'Event scheduled',body:\`\${d.name} on \${fmtD(d.date)}\`,date:iso(TODAY),read:false,cat:'Preaching'});
      logAudit('Event scheduled',\`\${d.name} (\${batch(d.batch)?.name||''}) on \${d.date}\`);
      toast(created>1?\`Event scheduled — \${created} sessions created\`:'Event scheduled successfully','✨');`;
  
  const taskToastIdx = lines.findIndex((l, i) => i > saveAssignToastIdx && l.includes("} else if(isTask){"));
  lines.splice(taskToastIdx, 0, eventToastSnippet);
  console.log('Added Event toast/audit in save-assign');
}

// 6. In syncAssign, add 'expected'
const syncAssignIdx = lines.findIndex(l => l.includes('function syncAssign(){'));
if (syncAssignIdx !== -1) {
  const fieldsLineIdx = lines.findIndex((l, i) => i > syncAssignIdx && l.includes("['name','date','start','end','location'"));
  if (fieldsLineIdx !== -1) {
    lines[fieldsLineIdx] = lines[fieldsLineIdx].replace("'responsible']", "'responsible','expected']");
    console.log('Added expected to syncAssign');
  }
}

const finalHtml = lines.join(isCRLF ? '\r\n' : '\n');
fs.writeFileSync('public/index.html', finalHtml);
console.log('Successfully written updated public/index.html!');
