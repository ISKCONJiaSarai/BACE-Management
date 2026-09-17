const fs = require('fs');
const vm = require('vm');

let code = fs.readFileSync('public/index.html', 'utf8');
const isCrlf = code.includes('\r\n');
if (isCrlf) {
  code = code.replace(/\r\n/g, '\n');
}

// 1. In render(): preserve drawer scroll position
const oldRender = `function render(){
  DB.devotees.forEach(normalizeDevotee);
  const app=document.getElementById('app');
  if(!APP.user){app.innerHTML=viewLogin();initGoogleAuth();return}`;

const newRender = `function render(){
  DB.devotees.forEach(normalizeDevotee);
  const app=document.getElementById('app');
  if(!APP.user){app.innerHTML=viewLogin();initGoogleAuth();return}

  // Preserve drawer scroll position if side panel is open
  const drawerBody = document.querySelector('.drawer .modal-b');
  const prevDrawerScroll = drawerBody ? drawerBody.scrollTop : 0;`;

if (!code.includes(oldRender)) {
  console.error('Failed to find oldRender');
  process.exit(1);
}
code = code.replace(oldRender, newRender);

// 2. Restore drawer scroll position after setting app.innerHTML
const oldAppInner = `  app.innerHTML=\`<div class="\${shellClass}">\${sidebar()}<div class="main">\${topbar()}<div class="view">\${body}</div></div></div>
    \${mobileScrim}\${sbToggleBtn}\${botnav()}\${fab()}\${modalHTML()}\`;`;

const newAppInner = `  app.innerHTML=\`<div class="\${shellClass}">\${sidebar()}<div class="main">\${topbar()}<div class="view">\${body}</div></div></div>
    \${mobileScrim}\${sbToggleBtn}\${botnav()}\${fab()}\${modalHTML()}\`;
  const newDrawerBody = document.querySelector('.drawer .modal-b');
  if (newDrawerBody && prevDrawerScroll > 0) {
    newDrawerBody.scrollTop = prevDrawerScroll;
  }`;

if (!code.includes(oldAppInner)) {
  console.error('Failed to find oldAppInner');
  process.exit(1);
}
code = code.replace(oldAppInner, newAppInner);

// 3. In open-activity and router activity case: reset APP.sideDevFilterBatch to current activity's batch
const oldOpenAct = `case 'open-activity':stop();APP.modal={kind:'activity',id};render();break;`;
const newOpenAct = `case 'open-activity':stop();{
    const a = act(id);
    APP.sideDevFilterBatch = a ? (a.batch || '') : '';
    APP.modal = {kind: 'activity', id};
    render();
    break;
  }`;

if (!code.includes(oldOpenAct)) {
  console.error('Failed to find oldOpenAct');
  process.exit(1);
}
code = code.replace(oldOpenAct, newOpenAct);

const oldRouterAct = `case 'activity':{const a=act(arg);if(a){APP.modal={kind:'activity',id:arg};}return viewAssign()}`;
const newRouterAct = `case 'activity':{const a=act(arg);if(a){APP.sideDevFilterBatch = a.batch || '';APP.modal={kind:'activity',id:arg};}return viewAssign()}`;

if (!code.includes(oldRouterAct)) {
  console.error('Failed to find oldRouterAct');
  process.exit(1);
}
code = code.replace(oldRouterAct, newRouterAct);

// 4. In document.addEventListener('click'):
// Add SELECT protection and remove duplicate case 'side-filter-batch'
const oldClickStart = `document.addEventListener('click',e=>{
  const t=e.target.closest('[data-act]');
  const link=e.target.closest('a[href^="#/"]');
  if(link&&!t){e.preventDefault();go(link.getAttribute('href'));return}
  if(!t){return}`;

const newClickStart = `document.addEventListener('click',e=>{
  const t=e.target.closest('[data-act]');
  const link=e.target.closest('a[href^="#/"]');
  if(link&&!t){e.preventDefault();go(link.getAttribute('href'));return}
  if(!t){return}
  if(t.tagName==='SELECT'||e.target.tagName==='SELECT'||e.target.tagName==='OPTION'){return}`;

if (!code.includes(oldClickStart)) {
  console.error('Failed to find oldClickStart');
  process.exit(1);
}
code = code.replace(oldClickStart, newClickStart);

// Remove case 'side-filter-batch' from click listener
const oldSideFilterClick = `  case 'side-filter-batch':stop();{
    APP.sideDevFilterBatch = t.value;
    render();
    break}`;

if (!code.includes(oldSideFilterClick)) {
  console.error('Failed to find oldSideFilterClick');
  process.exit(1);
}
code = code.replace(oldSideFilterClick, '');

// 5. In activityModal: update select with data-act="side-select-assign" and improve styling
const oldDevSel = `<select id="scope-devotee-sel" style="flex:1 1 0%;min-width:0;padding:8px 10px;border:1px solid var(--line);border-radius:9px;font-size:13px;background:var(--card);color:var(--ink)">
        <option value="">Select devotee (\${scopeDevs.length} available)...</option>
        \${scopeDevs.map(d=>\`<option value="\${d.id}">\${esc(d.name)}\${d.batch && d.batch!==selBatchId ? \` (\${batch(d.batch)?.name||''})\` : ''} · \${d.attendancePct}% attendance</option>\`).join('')}
      </select>`;

const newDevSel = `<select id="scope-devotee-sel" data-act="side-select-assign" data-a="\${a.id}" style="flex:1 1 0%;min-width:0;padding:8px 10px;border:1px solid var(--line);border-radius:9px;font-size:13px;background:var(--card);color:var(--ink);cursor:pointer;text-overflow:ellipsis">
        <option value="">\${scopeDevs.length ? \`Select devotee (\${scopeDevs.length} available)...\` : 'No available devotees in this batch'}</option>
        \${scopeDevs.map(d=>\`<option value="\${d.id}">\${esc(d.name)}\${d.batch && d.batch!==selBatchId ? \` (\${batch(d.batch)?.name||''})\` : ''} · \${d.attendancePct}% attendance</option>\`).join('')}
      </select>`;

if (!code.includes(oldDevSel)) {
  console.error('Failed to find oldDevSel');
  process.exit(1);
}
code = code.replace(oldDevSel, newDevSel);

// 6. In document.addEventListener('change'): Add case 'side-select-assign'
const oldChange = `case 'side-filter-batch':{APP.sideDevFilterBatch=t.value;render();break}`;
const newChange = `case 'side-filter-batch':{APP.sideDevFilterBatch=t.value;render();break}
   case 'side-select-assign':{
     const aId=t.dataset.a;
     const dId=t.value;
     if(dId){
       if(!DB.assignments.some(x=>x.activity===aId && x.devotee===dId)){
         DB.assignments.push({id:uid('as'),activity:aId,devotee:dId,state:'Assigned',actualPerformer:null,completedAt:null});
         const a=act(aId);if(a&&a.status==='Scheduled')a.status='Assigned';
         DB.notifications.unshift({id:uid('n'),em:'🪔',title:'Seva assigned',body:\`\${nameOf(dId)} assigned to \${a?.name||''}\`,date:iso(TODAY),read:false,cat:'Management'});
         logAudit('Seva assigned',\`\${nameOf(dId)} → \${a?.name||''}\`);
         toast(nameOf(dId)+' assigned');
         saveAssignmentsToStorage();saveActivitiesToStorage();
       }
       render();
     }
     break}`;

if (!code.includes(oldChange)) {
  console.error('Failed to find oldChange');
  process.exit(1);
}
code = code.replace(oldChange, newChange);

if (isCrlf) {
  code = code.replace(/\n/g, '\r\n');
}

// 7. Check syntax by parsing script tags
const sStart = code.indexOf('<script>');
const sEnd = code.lastIndexOf('</script>');
const scriptSrc = code.substring(sStart + 8, sEnd);

try {
  new vm.Script(scriptSrc);
  console.log('Syntax OK!');
} catch (e) {
  console.error('Syntax error:', e);
  process.exit(1);
}

fs.writeFileSync('public/index.html', code, 'utf8');
console.log('Successfully updated public/index.html');
