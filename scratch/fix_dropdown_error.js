const fs = require('fs');
const vm = require('vm');

let code = fs.readFileSync('public/index.html', 'utf8');
const isCrlf = code.includes('\r\n');
if (isCrlf) {
  code = code.replace(/\r\n/g, '\n');
}

// 1. Update updateMultiSelectUI to also update footer count
const oldUpdateUI = `  checkboxes.forEach(cb => {
    const row = cb.closest('.ms-opt-row');
    if(row){
      row.style.background = cb.checked ? 'var(--accent-soft)' : 'transparent';
      const mark = row.querySelector('.ms-check-mark');
      if(mark) mark.style.display = cb.checked ? 'inline' : 'none';
      const labelSpan = row.querySelector('.ms-opt-label');
      if(labelSpan) labelSpan.style.fontWeight = cb.checked ? '600' : 'normal';
    }
  });
}`;

const newUpdateUI = `  checkboxes.forEach(cb => {
    const row = cb.closest('.ms-opt-row');
    if(row){
      row.style.background = cb.checked ? 'var(--accent-soft)' : 'transparent';
      const mark = row.querySelector('.ms-check-mark');
      if(mark) mark.style.display = cb.checked ? 'inline' : 'none';
      const labelSpan = row.querySelector('.ms-opt-label');
      if(labelSpan) labelSpan.style.fontWeight = cb.checked ? '600' : 'normal';
    }
  });
  const footerCount = container.querySelector('#ms-footer-count-' + name);
  if(footerCount) footerCount.textContent = \`\${checked.length} selected\`;
}`;

if (!code.includes(oldUpdateUI)) {
  console.error('Failed to find oldUpdateUI');
  process.exit(1);
}
code = code.replace(oldUpdateUI, newUpdateUI);

// 2. Update fieldHTML multiselect definition with solid background, flex column layout, and footer
const oldMenuDef = `      <!-- Dropdown Menu -->
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
      </div>`;

const newMenuDef = `      <!-- Dropdown Menu with 100% Solid Opaque Background -->
      <div class="ms-menu" id="ms-menu-\${esc(f.n)}" style="display:none;position:absolute;top:calc(100% + 4px);left:0;right:0;background:#ffffff;background:var(--surface);border:1px solid var(--line);border-radius:10px;box-shadow:0 12px 36px rgba(0,0,0,0.22),0 2px 8px rgba(0,0,0,0.08);z-index:10000;padding:8px;box-sizing:border-box">
        <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:8px;border-bottom:1px solid var(--line);margin-bottom:6px;background:inherit">
          <input type="text" class="ms-search" data-act="ms-search" data-name="\${esc(f.n)}" placeholder="Filter facilitators..." style="flex:1;min-width:0;padding:6px 10px;border:1px solid var(--line);border-radius:6px;font-size:12.5px;background:var(--surface-2);color:var(--ink);margin-right:8px">
          <div style="display:flex;gap:6px">
            <button type="button" class="btn sm" data-act="ms-select-all" data-name="\${esc(f.n)}" style="padding:4px 9px;font-size:11.5px">All</button>
            <button type="button" class="btn sm" data-act="ms-clear-all" data-name="\${esc(f.n)}" style="padding:4px 9px;font-size:11.5px">Clear</button>
          </div>
        </div>
        <div class="ms-opts-list" id="ms-opts-\${esc(f.n)}" style="display:flex;flex-direction:column;gap:3px;max-height:180px;overflow-y:auto;background:inherit">
          \${opts.map(o => {
            const val = Array.isArray(o) ? o[0] : o;
            const lab = Array.isArray(o) ? o[1] : o;
            const chk = selSet.has(String(val));
            return \`
              <label class="ms-opt-row" data-val="\${esc(val)}" data-lab="\${esc(lab).toLowerCase()}" style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border-radius:6px;cursor:pointer;font-size:13px;color:var(--ink);transition:background 0.15s;box-sizing:border-box;background:\${chk ? 'var(--accent-soft)' : 'transparent'}">
                <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0">
                  <input type="checkbox" name="\${esc(f.n)}" value="\${esc(val)}" \${chk ? 'checked' : ''} data-act="ms-toggle-item" data-name="\${esc(f.n)}" data-lab="\${esc(lab)}" style="margin:0;cursor:pointer;accent-color:var(--accent);width:16px;height:16px">
                  <span class="ms-opt-label" style="font-weight:\${chk ? '600' : 'normal'}">🧑‍🏫 \${esc(lab)}</span>
                </div>
                <span class="ms-check-mark" style="font-size:13px;font-weight:bold;color:var(--accent);display:\${chk ? 'inline' : 'none'}">✓</span>
              </label>
            \`;
          }).join('')}
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;padding-top:8px;border-top:1px solid var(--line);margin-top:6px;background:inherit">
          <span class="tiny muted" id="ms-footer-count-\${esc(f.n)}">\${selSet.size} selected</span>
          <button type="button" class="btn sm pri" data-act="ms-toggle-menu" data-name="\${esc(f.n)}" style="padding:4px 14px;font-size:12px">Done ✓</button>
        </div>
      </div>`;

if (!code.includes(oldMenuDef)) {
  console.error('Failed to find oldMenuDef');
  process.exit(1);
}
code = code.replace(oldMenuDef, newMenuDef);

if (isCrlf) {
  code = code.replace(/\n/g, '\r\n');
}

// Check syntax
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
console.log('Successfully updated public/index.html with solid background & layout fix!');
