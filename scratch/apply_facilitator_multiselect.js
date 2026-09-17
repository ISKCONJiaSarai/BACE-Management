const fs = require('fs');
const vm = require('vm');

let code = fs.readFileSync('public/index.html', 'utf8');
const isCrlf = code.includes('\r\n');
if (isCrlf) {
  code = code.replace(/\r\n/g, '\n');
}

// 1. In openBatchForm: change field type to 'multiselect'
const oldField = `FLD('facilitators','Facilitators (from hierarchy)','multicheck',{v:facIds,opts:hFacs.map(x=>[x.id,x.name]),hint:'Check all facilitators who guide devotees in this batch'}),`;
const newField = `FLD('facilitators','Facilitators (from hierarchy)','multiselect',{v:facIds,opts:hFacs.map(x=>[x.id,x.name]),hint:'Select all facilitators who guide devotees in this batch'}),`;

if (!code.includes(oldField)) {
  console.error('Failed to find oldField in openBatchForm');
  process.exit(1);
}
code = code.replace(oldField, newField);

// 2. Add updateMultiSelectUI helper function and update fieldHTML for multiselect
const oldFieldHTML = `function fieldHTML(f){
  const v=f.v??'';
  if(f.t==='multicheck'){
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

const newFieldHTML = `function updateMultiSelectUI(name){
  const container = document.querySelector(\`.ms-container[data-ms="\${name}"]\`);
  if(!container) return;
  const checkboxes = container.querySelectorAll(\`input[type="checkbox"][name="\${name}"]\`);
  const checked = Array.from(checkboxes).filter(cb => cb.checked);
  
  const countEl = container.querySelector('.ms-count');
  if(countEl) countEl.textContent = \`\${checked.length} selected\`;
  
  const tagsWrap = container.querySelector('.ms-tags-wrap');
  if(tagsWrap){
    if(checked.length === 0){
      tagsWrap.innerHTML = \`<span class="muted ms-placeholder" style="font-size:13px">Select facilitators from dropdown...</span>\`;
    } else {
      tagsWrap.innerHTML = checked.map(cb => {
        const lab = cb.dataset.lab || cb.value;
        return \`<span class="ms-tag" data-val="\${esc(cb.value)}" style="display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:14px;background:var(--accent-soft);border:1px solid var(--accent);color:var(--ink);font-size:12px;font-weight:500">
          <span>🧑‍🏫 \${esc(lab)}</span>
          <span class="ms-tag-del" data-act="ms-remove-tag" data-name="\${esc(name)}" data-val="\${esc(cb.value)}" title="Remove" style="cursor:pointer;font-size:14px;color:var(--muted);line-height:1;margin-left:2px;font-weight:bold">&times;</span>
        </span>\`;
      }).join('');
    }
  }
  
  checkboxes.forEach(cb => {
    const row = cb.closest('.ms-opt-row');
    if(row){
      row.style.background = cb.checked ? 'var(--accent-soft)' : 'transparent';
      const mark = row.querySelector('.ms-check-mark');
      if(mark) mark.style.display = cb.checked ? 'inline' : 'none';
      const labelSpan = row.querySelector('.ms-opt-label');
      if(labelSpan) labelSpan.style.fontWeight = cb.checked ? '600' : 'normal';
    }
  });
}

function fieldHTML(f){
  const v=f.v??'';
  if(f.t==='multiselect' || f.t==='multicheck'){
    const selSet = new Set([].concat(f.v||[]).map(String));
    const opts = f.opts || [];
    const tagsHtml = opts.filter(o => selSet.has(String(Array.isArray(o)?o[0]:o))).map(o => {
      const val = Array.isArray(o) ? o[0] : o;
      const lab = Array.isArray(o) ? o[1] : o;
      return \`<span class="ms-tag" data-val="\${esc(val)}" style="display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:14px;background:var(--accent-soft);border:1px solid var(--accent);color:var(--ink);font-size:12px;font-weight:500">
        <span>🧑‍🏫 \${esc(lab)}</span>
        <span class="ms-tag-del" data-act="ms-remove-tag" data-name="\${esc(f.n)}" data-val="\${esc(val)}" title="Remove" style="cursor:pointer;font-size:14px;color:var(--muted);line-height:1;margin-left:2px;font-weight:bold">&times;</span>
      </span>\`;
    }).join('');

    return \`<div class="field ms-container" data-ms="\${esc(f.n)}" style="position:relative">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">
        <label style="margin:0">\${esc(f.l)}</label>
        <span class="tiny muted ms-count" id="ms-count-\${esc(f.n)}">\${selSet.size} selected</span>
      </div>

      <!-- Multi-select Dropdown Trigger Box -->
      <div class="ms-trigger" data-act="ms-toggle-menu" data-name="\${esc(f.n)}" style="display:flex;align-items:center;justify-content:space-between;padding:7px 11px;border:1px solid var(--line);border-radius:var(--r);background:var(--card);cursor:pointer;min-height:40px;box-sizing:border-box">
        <div class="ms-tags-wrap" id="ms-tags-\${esc(f.n)}" style="display:flex;flex-wrap:wrap;gap:5px;align-items:center;flex:1;min-width:0">
          \${tagsHtml || \`<span class="muted ms-placeholder" style="font-size:13px">Select facilitators from dropdown...</span>\`}
        </div>
        <span class="ms-arrow" id="ms-arrow-\${esc(f.n)}" style="font-size:11px;color:var(--muted);margin-left:8px;user-select:none">▼</span>
      </div>

      <!-- Dropdown Menu -->
      <div class="ms-menu" id="ms-menu-\${esc(f.n)}" style="display:none;position:absolute;top:100%;left:0;right:0;margin-top:4px;background:var(--surface-1);border:1px solid var(--line);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,0.18);z-index:999;padding:6px;max-height:220px;overflow-y:auto">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 8px 6px;border-bottom:1px solid var(--line);margin-bottom:4px">
          <input type="text" class="ms-search" data-act="ms-search" data-name="\${esc(f.n)}" placeholder="Filter facilitators..." style="flex:1;min-width:0;padding:4px 8px;border:1px solid var(--line);border-radius:6px;font-size:12px;background:var(--surface-2);color:var(--ink);margin-right:8px">
          <div style="display:flex;gap:6px">
            <button type="button" class="btn sm" data-act="ms-select-all" data-name="\${esc(f.n)}" style="padding:2px 7px;font-size:11px">All</button>
            <button type="button" class="btn sm" data-act="ms-clear-all" data-name="\${esc(f.n)}" style="padding:2px 7px;font-size:11px">Clear</button>
          </div>
        </div>
        <div class="ms-opts-list" id="ms-opts-\${esc(f.n)}">
          \${opts.map(o => {
            const val = Array.isArray(o) ? o[0] : o;
            const lab = Array.isArray(o) ? o[1] : o;
            const chk = selSet.has(String(val));
            return \`
              <label class="ms-opt-row" data-val="\${esc(val)}" data-lab="\${esc(lab).toLowerCase()}" style="display:flex;align-items:center;gap:10px;padding:7px 9px;border-radius:6px;cursor:pointer;font-size:12.5px;color:var(--ink);transition:background 0.15s;background:\${chk ? 'var(--accent-soft)' : 'transparent'}">
                <input type="checkbox" name="\${esc(f.n)}" value="\${esc(val)}" \${chk ? 'checked' : ''} data-act="ms-toggle-item" data-name="\${esc(f.n)}" data-lab="\${esc(lab)}" style="margin:0;cursor:pointer;accent-color:var(--accent)">
                <span class="ms-opt-label" style="flex:1;min-width:0;font-weight:\${chk ? '600' : 'normal'}">🧑‍🏫 \${esc(lab)}</span>
                <span class="ms-check-mark" style="font-size:12px;color:var(--accent);display:\${chk ? 'inline' : 'none'}">✓</span>
              </label>
            \`;
          }).join('')}
        </div>
      </div>
      \${f.hint ? \`<div class="hint">\${esc(f.hint)}</div>\` : ''}
    </div>\`;
  }`;

if (!code.includes(oldFieldHTML)) {
  console.error('Failed to find oldFieldHTML');
  process.exit(1);
}
code = code.replace(oldFieldHTML, newFieldHTML);

// 3. Add click handlers for ms-toggle-menu, ms-remove-tag, ms-select-all, ms-clear-all and outside click
const clickAnchor = `document.addEventListener('click',e=>{
  const t=e.target.closest('[data-act]');
  const link=e.target.closest('a[href^="#/"]');
  if(link&&!t){e.preventDefault();go(link.getAttribute('href'));return}
  if(!t){return}
  if(t.tagName==='SELECT'||e.target.tagName==='SELECT'||e.target.tagName==='OPTION'){return}`;

const newClickAnchor = `document.addEventListener('click',e=>{
  // Close any open multi-select dropdowns if clicking outside
  if (!e.target.closest('.ms-container')) {
    document.querySelectorAll('.ms-menu').forEach(menu => {
      menu.style.display = 'none';
      const name = menu.id.replace('ms-menu-', '');
      const arrow = document.getElementById('ms-arrow-' + name);
      if(arrow) arrow.textContent = '▼';
    });
  }

  const t=e.target.closest('[data-act]');
  const link=e.target.closest('a[href^="#/"]');
  if(link&&!t){e.preventDefault();go(link.getAttribute('href'));return}
  if(!t){return}
  if(t.tagName==='SELECT'||e.target.tagName==='SELECT'||e.target.tagName==='OPTION'){return}`;

if (!code.includes(clickAnchor)) {
  console.error('Failed to find clickAnchor');
  process.exit(1);
}
code = code.replace(clickAnchor, newClickAnchor);

// Add cases inside switch(a) in click handler
const switchAnchor = `case 'check-approval-status':checkApprovalStatus();break;`;
const newSwitchCases = `case 'check-approval-status':checkApprovalStatus();break;
  case 'ms-toggle-menu':{
    const name = t.dataset.name;
    const menu = document.getElementById('ms-menu-' + name);
    const arrow = document.getElementById('ms-arrow-' + name);
    if(menu){
      const isOpen = menu.style.display === 'block';
      // Close other open menus
      document.querySelectorAll('.ms-menu').forEach(m => m.style.display = 'none');
      document.querySelectorAll('.ms-arrow').forEach(a => a.textContent = '▼');
      if(!isOpen){
        menu.style.display = 'block';
        if(arrow) arrow.textContent = '▲';
        setTimeout(()=>{
          const sInp = menu.querySelector('.ms-search');
          if(sInp) sInp.focus();
        }, 50);
      }
    }
    break}
  case 'ms-remove-tag':stop();{
    const name = t.dataset.name, val = t.dataset.val;
    const cb = document.querySelector(\`#modalform input[type="checkbox"][name="\${name}"][value="\${val}"]\`);
    if(cb){
      cb.checked = false;
      updateMultiSelectUI(name);
    }
    break}
  case 'ms-select-all':stop();{
    const name = t.dataset.name;
    document.querySelectorAll(\`#modalform input[type="checkbox"][name="\${name}"]\`).forEach(cb => cb.checked = true);
    updateMultiSelectUI(name);
    break}
  case 'ms-clear-all':stop();{
    const name = t.dataset.name;
    document.querySelectorAll(\`#modalform input[type="checkbox"][name="\${name}"]\`).forEach(cb => cb.checked = false);
    updateMultiSelectUI(name);
    break}`;

if (!code.includes(switchAnchor)) {
  console.error('Failed to find switchAnchor');
  process.exit(1);
}
code = code.replace(switchAnchor, newSwitchCases);

// 4. In document.addEventListener('change'): add ms-toggle-item
const changeAnchor = `switch(a){`;
const newChangeCase = `switch(a){
   case 'ms-toggle-item':{
     updateMultiSelectUI(t.dataset.name);
     break}
`;

if (!code.includes(changeAnchor)) {
  console.error('Failed to find changeAnchor');
  process.exit(1);
}
code = code.replace(changeAnchor, newChangeCase);

// 5. In document.addEventListener('input'): add ms-search filter handler
const inputListenerCheck = `document.addEventListener('input',e=>{`;
if (code.includes(inputListenerCheck)) {
  const oldInput = `document.addEventListener('input',e=>{`;
  const newInput = `document.addEventListener('input',e=>{
  const msSearch = e.target.closest('[data-act="ms-search"]');
  if(msSearch){
    const name = msSearch.dataset.name;
    const query = msSearch.value.trim().toLowerCase();
    const rows = document.querySelectorAll(\`#ms-opts-\${name} .ms-opt-row\`);
    rows.forEach(r => {
      const lab = r.dataset.lab || '';
      r.style.display = (!query || lab.includes(query)) ? 'flex' : 'none';
    });
    return;
  }`;
  code = code.replace(oldInput, newInput);
} else {
  // If no input listener, add one
  const insertBeforeKeydown = `document.addEventListener('keydown',`;
  const newInputHandler = `document.addEventListener('input',e=>{
  const msSearch = e.target.closest('[data-act="ms-search"]');
  if(msSearch){
    const name = msSearch.dataset.name;
    const query = msSearch.value.trim().toLowerCase();
    const rows = document.querySelectorAll(\`#ms-opts-\${name} .ms-opt-row\`);
    rows.forEach(r => {
      const lab = r.dataset.lab || '';
      r.style.display = (!query || lab.includes(query)) ? 'flex' : 'none';
    });
  }
});
document.addEventListener('keydown',`;
  code = code.replace(insertBeforeKeydown, newInputHandler);
}

if (isCrlf) {
  code = code.replace(/\n/g, '\r\n');
}

// 6. Check syntax
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
console.log('Successfully updated public/index.html with multi-select facilitators dropdown!');
