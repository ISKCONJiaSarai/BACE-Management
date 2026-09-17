const fs = require('fs');

let content = fs.readFileSync('public/index.html', 'utf8');
const isCRLF = content.includes('\r\n');
const lines = content.split(/\r?\n/);

console.log('Total lines:', lines.length);

// 1. Update fieldHTML to support multicheck
const fieldHtmlIdx = lines.findIndex(l => l.includes('function fieldHTML(f){'));
console.log('fieldHtmlIdx:', fieldHtmlIdx);
const multicheckSnippet = `  if(f.t==='multicheck'){
    const selSet = new Set([].concat(f.v||[]).map(String));
    return \`<div class="field"><label>\${esc(f.l)}</label>
      <div style="display:flex;flex-wrap:wrap;gap:8px;padding:8px 10px;background:var(--surface-2);border:1px solid var(--line);border-radius:var(--r);max-height:140px;overflow-y:auto">
        \${(f.opts||[]).map(o=>{
          const val=Array.isArray(o)?o[0]:o,lab=Array.isArray(o)?o[1]:o;
          const chk=selSet.has(String(val));
          return \`<label style="display:inline-flex;align-items:center;gap:6px;padding:4px 9px;border-radius:16px;background:\${chk?'var(--accent-soft)':'var(--surface)'};border:1px solid \${chk?'var(--accent)':'var(--line)'};cursor:pointer;font-size:12.5px;color:var(--ink)">
            <input type="checkbox" name="\${f.n}" value="\${esc(val)}" \${chk?'checked':''} style="margin:0">
            <span>\${esc(lab)}</span>
          </label>\`;
        }).join('')}
      </div>
      \${f.hint?\`<div class="hint">\${esc(f.hint)}</div>\`:''}
    </div>\`;
  }`;

// Insert multicheck handling inside fieldHTML
lines.splice(fieldHtmlIdx + 2, 0, multicheckSnippet);
console.log('Added multicheck to fieldHTML');

// 2. Update collect() to handle checkboxes
const collectIdx = lines.findIndex(l => l.includes('function collect(){'));
console.log('collectIdx:', collectIdx);
lines[collectIdx] = `function collect(){
  const o={};
  document.querySelectorAll('#modalform [name]').forEach(el=>{
    if(el.type === 'checkbox'){
      if(!o[el.name]) o[el.name] = [];
      if(el.checked) o[el.name].push(el.value);
    } else {
      o[el.name]=el.value;
    }
  });
  return o;
}`;
console.log('Updated collect()');

// 3. Update teamSection(opts)
const teamSecIdx = lines.findIndex(l => l.includes('function teamSection(opts){'));
console.log('teamSecIdx:', teamSecIdx);
const teamSecEndIdx = lines.findIndex((l, i) => i > teamSecIdx && l.includes('function deptDashboardBody(dp){'));
console.log('teamSecEndIdx:', teamSecEndIdx);

const newTeamSec = `function teamSection(opts){
  /* opts: { incharge, coordinator (id or id[]), facilitators (id[]), volunteers (id[]), canEdit, editAct, editId } */
  const roles=[];
  if(opts.incharge)roles.push({label:'Incharge',ids:[opts.incharge],color:'var(--saffron)'});
  const coords=[].concat(opts.coordinator||[]).filter(Boolean);
  if(coords.length)roles.push({label:coords.length>1?'Coordinators':'Coordinator',ids:coords,color:'var(--indigo)'});
  const facs=[].concat(opts.facilitators||opts.facilitator||[]).filter(Boolean);
  if(facs.length)roles.push({label:facs.length>1?'Facilitators':'Facilitator',ids:facs,color:'var(--green)'});
  const vols=[].concat(opts.volunteers||[]).filter(Boolean);
  if(vols.length)roles.push({label:'Volunteers',ids:vols,color:'var(--teal)'});
  if(!roles.length)return '';
  const rows=roles.map(r=>\`
    <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid var(--line-2);">
      <span style="min-width:108px;font-size:11.5px;font-weight:600;color:var(--ink-2);text-transform:uppercase;letter-spacing:.04em;padding-top:6px">\${r.label}</span>
      <div style="display:flex;flex-wrap:wrap;gap:7px;flex:1">
        \${r.ids.map(did=>{
          const d=dv(did);if(!d)return '';
          return \`<a href="#/devotee/\${did}" style="display:inline-flex;align-items:center;gap:7px;padding:5px 10px 5px 5px;border-radius:20px;background:var(--surface-2);border:1px solid var(--line);text-decoration:none;color:inherit" title="View devotee profile">
            <span class="av s" style="background:\${avc(d.name)}">\${initials(d.name)}</span>
            <span style="font-size:13px;font-weight:600">\${esc(d.name)}</span>
          </a>\`;
        }).join('')}
      </div>
    </div>\`).join('');
  const teamPickerAct=opts.editAct?opts.editAct+'-team':null;
  const facPickerAct=opts.editAct==='edit-batch'?'edit-batch-facilitators':null;
  return section('👥 Team',\`<div class="card-b" style="padding:0 4px">\${rows}<div style="height:6px"></div></div>\`,
    opts.canEdit?\`<button class="btn sm" data-act="\${opts.editAct}" data-id="\${opts.editId}">\${ic('edit')}Edit roles</button>\${facPickerAct?\`<button class="btn sm" data-act="\${facPickerAct}" data-id="\${opts.editId}">🧑‍🏫 Manage facilitators (\${facs.length})</button>\`:''}<button class="btn sm" data-act="\${teamPickerAct}" data-id="\${opts.editId}">\${ic('people')}Manage volunteers (\${vols.length})</button>\`:'')
}`;

lines.splice(teamSecIdx, teamSecEndIdx - teamSecIdx, newTeamSec);
console.log('Updated teamSection()');

// 4. Update batchDashboardBody(b)
const bdbIdx = lines.findIndex(l => l.includes('function batchDashboardBody(b){'));
console.log('bdbIdx:', bdbIdx);
const bdbGridIdx = lines.findIndex((l, i) => i > bdbIdx && l.includes('return `<div class="grid g6"'));
console.log('bdbGridIdx:', bdbGridIdx);
const bdbTeamSecIdx = lines.findIndex((l, i) => i > bdbIdx && l.includes('${teamSection({incharge:b.incharge,coordinator:b.coordinator'));
console.log('bdbTeamSecIdx:', bdbTeamSecIdx);

// Replace from bdbGridIdx to bdbTeamSecIdx + 1
const newBdbTop = `  const facList=(b.facilitators && b.facilitators.length) ? b.facilitators.map(dv).filter(Boolean) : getBatchFacilitators(b.id);
  const facIds=facList.map(f=>f.id);
  return \`<div class="grid g-batch-dash" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:12px;margin-bottom:15px">
    \${stat('Members',m.members.length,\`\${m.neu} new this month\`,{em:'👥',r:'#/devotees'})}
    \${stat('Facilitators',facList.length,\`guiding devotees\`,{em:'🧑‍🏫',act:'edit-batch-facilitators',id:b.id})}
    \${stat('Attendance',m.attendance+'%',\`best \${m.best}% · lowest \${m.low}%\`,{em:'✅',r:'#/batch-attendance'})}
    \${stat('Classes',m.classes.length,'in the record',{em:'📖',r:'#/classes'})}
    \${stat('Events',m.events.length,'special programmes',{em:'✨',r:'#/classes'})}
    \${stat('Follow-ups',m.fus.pending,\`\${m.fus.overdue} overdue\`,{em:'⏰',tint:m.fus.overdue>0,act:'go',r:'#/followups'})}
    \${stat('Budget used',m.util+'%',money(b.budget.spent)+' of '+money(b.budget.allocated),{em:'🧾',r:'#/preaching-reports'})}</div>
   \${teamSection({incharge:b.incharge,coordinator:b.coordinator,facilitators:facIds,volunteers:(b.volunteers||[]),canEdit:ownsBatch(b.id),editAct:'edit-batch',editId:b.id})}`;

lines.splice(bdbGridIdx, (bdbTeamSecIdx - bdbGridIdx) + 1, newBdbTop);
console.log('Updated batchDashboardBody() with facilitators dashboard box and team facilitators');

// 5. Update openBatchForm
const obfIdx = lines.findIndex(l => l.includes('function openBatchForm(id){'));
console.log('obfIdx:', obfIdx);
const obfEndIdx = lines.findIndex((l, i) => i > obfIdx && l.includes('function openGroupForm(id){'));
console.log('obfEndIdx:', obfEndIdx);

const newObf = `function openBatchForm(id){
  const b=id?batch(id):null;
  const allDevs=DB.devotees.map(x=>[x.id,x.name]);
  const hFacs=getHierarchyFacilitators();
  const volIds=(b?.volunteers||[]);
  const facIds=(b?.facilitators||[]);
  openForm(b?'Edit batch':'Create batch',[
    FLD('name','Batch name','text',{v:b?.name,ph:'e.g. Sreshtha'}),
    FLD('desc','Description','textarea',{v:b?.desc}),
    FLD('level','Level','select',{v:b?.level||1,opts:[[1,'Level 1'],[2,'Level 2'],[3,'Level 3']],half:1}),
    FLD('incharge','Incharge (senior responsible)','select',{v:b?.incharge||'',opts:[['','— None —'],...allDevs],half:1}),
    FLD('coordinator','Coordinator','select',{v:b?.coordinator,opts:DB.devotees.map(x=>[x.id,x.name]),half:1}),
    FLD('facilitators','Facilitators (from hierarchy)','multicheck',{v:facIds,opts:hFacs.map(x=>[x.id,x.name]),hint:'Check all facilitators who guide devotees in this batch'}),
    FLD('freq','Meeting frequency','select',{v:b?.freq||'Weekly',opts:['Weekly','Fortnightly','Monthly'],half:1}),
    FLD('day','Meeting day','select',{v:b?.day||'Thu',opts:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],half:1}),
    FLD('time','Class time','text',{v:b?.time||'7:00 pm',half:1}),
    FLD('start','Start date','date',{v:b?.start||iso(TODAY),half:1}),
    FLD('allocated','Budget allocated (₹)','number',{v:b?.budget.allocated||0,half:1}),
    FLD('spent','Budget spent (₹)','number',{v:b?.budget.spent||0,half:1}),
    FLD('status','Status','select',{v:b?.status||'Active',opts:['Active','Inactive','Archived']})
  ],'save-batch',{id},'',
  b?\`<div style="display:flex;gap:7px;margin-right:auto"><button class="btn sm" data-act="edit-batch-facilitators" data-id="\${b.id}">🧑‍🏫 Facilitators (\${facIds.length})</button><button class="btn sm" data-act="edit-batch-team" data-id="\${b.id}">\${ic('people')}Volunteers (\${volIds.length})</button></div>\`:null);
}`;

lines.splice(obfIdx, obfEndIdx - obfIdx, newObf);
console.log('Updated openBatchForm()');

// 6. Update save-batch to persist facilitators
const sbIdx = lines.findIndex(l => l.includes('case \'save-batch\':{'));
console.log('sbIdx:', sbIdx);
const sbEndIdx = lines.findIndex((l, i) => i > sbIdx && l.includes('case \'edit-batch-team\':stop();{'));
console.log('sbEndIdx:', sbEndIdx);

const newSb = `  case 'save-batch':{const v=collect(),ctx=APP.modal.ctx;
    if(!v.name.trim()){toast('A batch needs a name','⚠️');break}
    if(ctx.id){const b=batch(ctx.id);Object.assign(b,{name:v.name,desc:v.desc,level:+v.level,incharge:v.incharge||'',coordinator:v.coordinator,
      freq:v.freq,day:v.day,time:v.time,start:v.start,status:v.status,budget:{allocated:+v.allocated||0,spent:+v.spent||0}});
      if(v.facilitators !== undefined){
        b.facilitators = Array.isArray(v.facilitators) ? v.facilitators : (v.facilitators ? [v.facilitators] : []);
      }
      logAudit('Batch updated',b.name);toast('Batch updated')}
    else{
      const facList = v.facilitators ? (Array.isArray(v.facilitators) ? v.facilitators : [v.facilitators]) : [];
      const b={id:uid('b'),name:v.name,desc:v.desc,level:+v.level,day:v.day,time:v.time,freq:v.freq,status:v.status,
        incharge:v.incharge||'d1',coordinator:v.coordinator,facilitators:facList,start:v.start,budget:{allocated:+v.allocated||0,spent:+v.spent||0}};
      DB.batches.push(b);
      DB.threads.push({id:uid('th'),type:'batch',name:b.name+' chat',members:[b.coordinator],ref:b.id,messages:[],pinnedNote:null});
      logAudit('Batch created',v.name);toast('Batch created with its own group chat')}
    APP.modal='';render();break}
  case 'edit-batch-facilitators':stop();{
    const b=batch(id);
    if(!b){toast('Batch not found','⚠️');break}
    const hFacs = getHierarchyFacilitators();
    openPicker({title:'Manage facilitators — '+b.name,
      sub:'Select facilitators for this batch from the overall hierarchy facilitators list.',
      items:hFacs.map(d=>({
        id:d.id,
        label:d.name,
        sub:d.phone ? \`\${d.phone} · \${d.appointment||'Facilitator'}\` : (d.appointment||'Facilitator'),
        avatar:d.name
      })),
      selected:(b.facilitators||[]),
      multi:true,
      save:'save-batch-facilitators',
      ctx:{id}});
    break}
  case 'save-batch-facilitators':{const m=APP.modal;const b=batch(m.ctx.id);
    if(b){
      b.facilitators=m.selected;
      logAudit('Batch facilitators updated',\`\${b.name} — \${m.selected.length} facilitator(s)\`);
      toast(\`Facilitators updated — \${m.selected.length} assigned\`);
    }
    APP.modal='';render();break}`;

lines.splice(sbIdx, sbEndIdx - sbIdx, newSb);
console.log('Updated save-batch and added edit-batch-facilitators & save-batch-facilitators');

const finalHtml = lines.join(isCRLF ? '\r\n' : '\n');
fs.writeFileSync('public/index.html', finalHtml);
console.log('Successfully updated public/index.html!');
