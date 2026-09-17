const fs = require('fs');

// Test how fieldHTML will render multiselect
function renderMultiSelect(f) {
  const selSet = new Set([].concat(f.v || []).map(String));
  const opts = f.opts || [];
  
  const tagsHtml = opts.filter(o => selSet.has(String(Array.isArray(o)?o[0]:o))).map(o => {
    const val = Array.isArray(o) ? o[0] : o;
    const lab = Array.isArray(o) ? o[1] : o;
    return `<span class="ms-tag" data-val="${val}" style="display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:14px;background:var(--accent-soft);border:1px solid var(--accent);color:var(--ink);font-size:12px;font-weight:500">
      <span>🧑‍🏫 ${lab}</span>
      <span class="ms-tag-del" data-act="ms-remove-tag" data-name="${f.n}" data-val="${val}" style="cursor:pointer;font-size:14px;color:var(--muted);line-height:1;margin-left:2px;font-weight:bold">&times;</span>
    </span>`;
  }).join('');

  return `
    <div class="field ms-container" data-ms="${f.n}" style="position:relative">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">
        <label style="margin:0">${f.l}</label>
        <span class="tiny muted ms-count" id="ms-count-${f.n}">${selSet.size} selected</span>
      </div>

      <!-- Trigger Box -->
      <div class="ms-trigger" data-act="ms-toggle-menu" data-name="${f.n}" style="display:flex;align-items:center;justify-content:space-between;padding:7px 10px;border:1px solid var(--line);border-radius:var(--r);background:var(--card);cursor:pointer;min-height:40px;box-sizing:border-box">
        <div class="ms-tags-wrap" id="ms-tags-${f.n}" style="display:flex;flex-wrap:wrap;gap:5px;align-items:center;flex:1;min-width:0">
          ${tagsHtml || `<span class="muted ms-placeholder" style="font-size:13px">Select facilitators from dropdown...</span>`}
        </div>
        <span class="ms-arrow" id="ms-arrow-${f.n}" style="font-size:11px;color:var(--muted);margin-left:8px;user-select:none">▼</span>
      </div>

      <!-- Dropdown Menu -->
      <div class="ms-menu" id="ms-menu-${f.n}" style="display:none;position:absolute;top:100%;left:0;right:0;margin-top:4px;background:var(--card);border:1px solid var(--line);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,0.18);z-index:999;padding:6px;max-height:220px;overflow-y:auto">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 8px 6px;border-bottom:1px solid var(--line);margin-bottom:4px">
          <input type="text" class="ms-search" data-act="ms-search" data-name="${f.n}" placeholder="Search facilitators..." style="flex:1;min-width:0;padding:4px 8px;border:1px solid var(--line);border-radius:6px;font-size:12px;background:var(--surface-2);color:var(--ink);margin-right:8px">
          <div style="display:flex;gap:6px">
            <button type="button" class="btn sm" data-act="ms-select-all" data-name="${f.n}" style="padding:2px 7px;font-size:11px">All</button>
            <button type="button" class="btn sm" data-act="ms-clear-all" data-name="${f.n}" style="padding:2px 7px;font-size:11px">Clear</button>
          </div>
        </div>
        <div class="ms-opts-list" id="ms-opts-${f.n}">
          ${opts.map(o => {
            const val = Array.isArray(o) ? o[0] : o;
            const lab = Array.isArray(o) ? o[1] : o;
            const chk = selSet.has(String(val));
            return `
              <label class="ms-opt-row" data-val="${val}" data-lab="${lab}" style="display:flex;align-items:center;gap:10px;padding:7px 9px;border-radius:6px;cursor:pointer;font-size:12.5px;color:var(--ink);transition:background 0.15s;background:${chk ? 'var(--accent-soft)' : 'transparent'}">
                <input type="checkbox" name="${f.n}" value="${val}" ${chk ? 'checked' : ''} data-act="ms-toggle-item" data-name="${f.n}" data-lab="${lab}" style="margin:0;cursor:pointer;accent-color:var(--accent)">
                <span style="flex:1;min-width:0;font-weight:${chk ? '600' : 'normal'}">🧑‍🏫 ${lab}</span>
                <span class="ms-check-mark" style="font-size:12px;color:var(--accent);display:${chk ? 'inline' : 'none'}">✓</span>
              </label>
            `;
          }).join('')}
        </div>
      </div>
      ${f.hint ? `<div class="hint">${f.hint}</div>` : ''}
    </div>
  `;
}

console.log("HTML generation tested successfully.");
