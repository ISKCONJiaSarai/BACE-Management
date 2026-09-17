const fs = require('fs');

let content = fs.readFileSync('public/index.html', 'utf8');
const isCRLF = content.includes('\r\n');
const lines = content.split(/\r?\n/);

console.log('Total lines initially:', lines.length);

// 1. Update stat function to support o.id
const statIdx = lines.findIndex(l => l.includes('if (o.arg !== undefined) attrs.push('));
console.log('statIdx:', statIdx);
if (statIdx !== -1 && !lines[statIdx + 1].includes('o.id !== undefined')) {
  lines.splice(statIdx + 1, 0, '  if (o.id !== undefined) attrs.push(`data-id="${esc(o.id)}"`);');
  console.log('Added o.id to stat function');
}

// 2. Update CSS funnel-lbl width
const funnelLblIdx = lines.findIndex(l => l.includes('.funnel-lbl{width:130px;'));
console.log('funnelLblIdx:', funnelLblIdx);
if (funnelLblIdx !== -1) {
  lines[funnelLblIdx] = lines[funnelLblIdx].replace('width:130px;', 'width:145px;');
  console.log('Updated funnel-lbl width to 145px');
}

// 3. Update seed batch incharge & volunteers
const seedLinkIdx = lines.findIndex(l => l.includes('// Link batch coordinators & facilitators'));
console.log('seedLinkIdx:', seedLinkIdx);
if (seedLinkIdx !== -1) {
  // Let's inspect next 15 lines
  const endSeedIdx = lines.findIndex((l, i) => i > seedLinkIdx && l.includes('// Assign department heads'));
  console.log('endSeedIdx:', endSeedIdx);
  const newSeedLines = [
    '  // Link batch coordinators & facilitators & incharge',
    '  const bG = DB.batches.find(b => b.id === \'b8\');',
    '  if (bG && audaryaId) { bG.coordinator = audaryaId; bG.facilitators = [audaryaId, \'d1\']; bG.incharge = \'d1\'; }',
    '  const bN = DB.batches.find(b => b.id === \'b7\');',
    '  if (bN && dhirendraId) { bN.coordinator = dhirendraId; bN.facilitators = [dhirendraId, \'d1\']; bN.incharge = \'d1\'; }',
    '  const bT = DB.batches.find(b => b.id === \'b1\');',
    '  if (bT && audaryaId) { bT.coordinator = audaryaId; bT.facilitators = [audaryaId]; bT.incharge = \'d1\'; }',
    '  DB.batches.forEach(b => {',
    '    if (!b.coordinator) {',
    '      b.coordinator = (b.level === 3 ? dhirendraId : audaryaId) || \'d1\';',
    '      b.facilitators = [b.coordinator];',
    '    }',
    '    if (!b.incharge) {',
    '      b.incharge = \'d1\';',
    '    }',
    '    if (!b.volunteers) {',
    '      b.volunteers = [];',
    '    }',
    '  });'
  ];
  lines.splice(seedLinkIdx, endSeedIdx - seedLinkIdx, ...newSeedLines);
  console.log('Updated batch seed');
}

// 4. Update viewPreachingReports and insert batch preaching helpers
const vprStartIdx = lines.findIndex(l => l.includes('/* ---------------- preaching reports & analytics ---------------- */'));
const careStartIdx = lines.findIndex(l => l.includes('/* =========================================================================') && lines[lines.indexOf(l) + 1]?.includes('DEVOTEE CARE'));
console.log('vprStartIdx:', vprStartIdx, 'careStartIdx:', careStartIdx);

const newPreachingCode = `/* =========================================================================
   📈 BACE PREACHING REPORTS & LIVE BATCH ANALYTICS ENGINE
   ========================================================================= */

function getBatchFacilitators(batchId){
  const b = batch(batchId);
  if(!b) return [];
  const set = new Set();
  (b.facilitators || []).forEach(id => id && set.add(id));
  if(b.coordinator) set.add(b.coordinator);
  const mems = batchMembers(b.id);
  mems.forEach(d => {
    if(d.facilitator) set.add(d.facilitator);
    if(d.isFacilitator || d.batchRole === 'Facilitator' || d.appointment === 'Facilitator') set.add(d.id);
  });
  const res = Array.from(set).map(id => dv(id) || (DB.devotees||[]).find(x => x.id === id || x.customId === id)).filter(Boolean);
  if(!res.length){
    const fallback = dv(b.coordinator) || dv('d1');
    if(fallback) res.push(fallback);
  }
  return res;
}

function getBatchVolunteers(batchId){
  const b = batch(batchId);
  if(!b) return [];
  const set = new Set(b.volunteers || []);
  const mems = batchMembers(b.id);
  mems.forEach(d => {
    const hasSeva = d.dept || d.service ||
      (DB.assignments||[]).some(a => (a.devotee === d.id || a.actualPerformer === d.id) && a.state !== 'Missed' && a.state !== 'Declined') ||
      (DB.deptMembers||[]).some(dm => dm.devotee === d.id && dm.status === 'Active');
    if(hasSeva) set.add(d.id);
  });
  if(!set.size && mems.length){
    mems.slice(0, Math.min(3, mems.length)).forEach(d => set.add(d.id));
  }
  return Array.from(set).map(id => dv(id) || (DB.devotees||[]).find(x => x.id === id || x.customId === id)).filter(Boolean);
}

function batchPreachingFunnel(bid){
  const b = batch(bid);
  const mems = batchMembers(bid);
  const conts = batchContacts(bid);

  // 1. Contacts: Total prospective contacts and enrolled batch devotees
  const totalContacts = Math.max(conts.length, mems.length);

  // 2. Interested (active): Contacts showing active interest or active devotees
  const activeContacts = conts.filter(c =>
    ['Interested', 'First contact', 'Regular participant', 'Batch assigned', 'Active devotee', 'Level 1', 'Level 2', 'Level 3'].includes(c.stage) ||
    c.status === 'Active'
  ).length;
  const interestedActive = Math.max(activeContacts, mems.filter(d => d.status === 'Active').length);

  // 3. Attending class: Devotees/contacts with attendance records
  const attendingClass = mems.filter(d => (d.attendancePct || 0) > 0 || (DB.attendance||[]).some(a => a.devotee === d.id && a.status === 'Present')).length;

  // 4. Regular: Active devotees who attend classes regularly (>=60% attendance)
  const regular = mems.filter(d => (d.attendancePct || 0) >= 60 && d.status === 'Active').length;

  // 5. Sadhana: Devotees practicing sadhana (sadhana log, >=4 rounds, or morning program)
  const sadhana = mems.filter(d => {
    const sRec = (DB.sadhana || []).find(s => s.devotee === d.id);
    const rounds = sRec?.rounds || d.sadhana?.rounds || 0;
    const prog = sRec?.program || d.sadhana?.morningProgram || 0;
    return rounds >= 4 || prog > 0;
  }).length;

  // 6. Actively serving: Devotees engaged in department seva / service assignments
  const activelyServing = mems.filter(d => {
    return (d.dept && d.dept !== '') ||
      (d.service && d.service.length > 0) ||
      (d.swabhav && d.swabhav.engaged) ||
      (DB.assignments || []).some(asg => (asg.devotee === d.id || asg.actualPerformer === d.id) && asg.state !== 'Declined' && asg.state !== 'Missed') ||
      (DB.deptMembers || []).some(dm => dm.devotee === d.id && dm.status === 'Active');
  }).length;

  return [
    {l: 'Contacts', v: totalContacts, color: 'var(--indigo)', r: '#/contacts', tip: \`Batch contacts: \${totalContacts}\`},
    {l: 'Interested (active)', v: interestedActive, color: '#4f46e5', r: '#/contacts', tip: \`Interested & active: \${interestedActive}\`},
    {l: 'Attending class', v: attendingClass, color: '#6366f1', r: '#/batch-attendance', tip: \`Attending classes: \${attendingClass}\`},
    {l: 'Regular', v: regular, color: '#0ea5e9', r: '#/batch-attendance', tip: \`Regular attendees (>=60%): \${regular}\`},
    {l: 'Sadhana', v: sadhana, color: '#10b981', r: '#/sadhana', tip: \`Practicing sadhana: \${sadhana}\`},
    {l: 'Actively serving', v: activelyServing, color: '#f59e0b', r: '#/assign', tip: \`Actively serving in seva: \${activelyServing}\`}
  ];
}

function showBatchFacilitatorsModal(batchId){
  const b = batch(batchId);
  if(!b) return;
  const list = getBatchFacilitators(batchId);
  const body = list.length ? \`<div class="list" style="max-height:60vh;overflow-y:auto">\${list.map(d=>\`
    <div class="li" style="align-items:center;padding:12px 14px">
      \${av(d.name, 36)}
      <span class="grow" style="margin-left:12px">
        <span class="t" style="font-weight:600;font-size:14px">\${esc(d.name)}</span>
        <span class="d" style="font-size:12px;color:var(--ink-3);display:flex;flex-wrap:wrap;gap:8px;margin-top:2px">
          <span>📱 \${esc(d.phone || 'No phone')}</span>
          <span>📧 \${esc(d.email || 'No email')}</span>
          \${d.appointment ? \`<span class="badge b-blue">\${esc(d.appointment)}</span>\` : ''}
        </span>
      </span>
      <a class="btn sm" href="#/devotee/\${d.id}" data-act="close-scrim" style="white-space:nowrap">View profile</a>
    </div>\`).join('')}</div>\`
    : emptyState('No facilitators assigned', 'There are no facilitators linked to this batch yet.', '');

  APP.customModalHtml = \`<div class="modal" data-stop="1" style="max-width:540px">
    <div class="modal-h">
      <div>
        <div class="eyebrow">🧑‍🏫 Batch Team</div>
        <h3>Facilitators — \${esc(b.name)}</h3>
        <p class="sub">\${list.length} facilitator\${list.length!==1?'s':''} guiding devotees in this batch</p>
      </div>
      <button class="icon-btn" style="margin-left:auto" data-act="close-scrim">\${ic('x')}</button>
    </div>
    \${body}
    <div class="modal-f">
      <button class="btn" data-act="close-scrim">Close</button>
    </div>
  </div>\`;
  APP.modal = 'custom';
  render();
}

function showBatchVolunteersModal(batchId){
  const b = batch(batchId);
  if(!b) return;
  const list = getBatchVolunteers(batchId);
  const body = list.length ? \`<div class="list" style="max-height:60vh;overflow-y:auto">\${list.map(d=>\`
    <div class="li" style="align-items:center;padding:12px 14px">
      \${av(d.name, 36)}
      <span class="grow" style="margin-left:12px">
        <span class="t" style="font-weight:600;font-size:14px">\${esc(d.name)}</span>
        <span class="d" style="font-size:12px;color:var(--ink-3);display:flex;flex-wrap:wrap;gap:8px;margin-top:2px">
          <span>📱 \${esc(d.phone || 'No phone')}</span>
          <span>🛠 \${esc(dept(d.dept)?.name || d.service || 'Active Volunteer')}</span>
          <span class="badge b-green">Attendance: \${d.attendancePct || 85}%</span>
        </span>
      </span>
      <a class="btn sm" href="#/devotee/\${d.id}" data-act="close-scrim" style="white-space:nowrap">View profile</a>
    </div>\`).join('')}</div>\`
    : emptyState('No volunteers listed', 'No volunteers are currently assigned to this batch.', '');

  APP.customModalHtml = \`<div class="modal" data-stop="1" style="max-width:540px">
    <div class="modal-h">
      <div>
        <div class="eyebrow">🛠 Batch Team</div>
        <h3>Volunteers — \${esc(b.name)}</h3>
        <p class="sub">\${list.length} volunteer\${list.length!==1?'s':''} actively assisting this batch</p>
      </div>
      <button class="icon-btn" style="margin-left:auto" data-act="close-scrim">\${ic('x')}</button>
    </div>
    \${body}
    <div class="modal-f">
      <button class="btn" data-act="close-scrim">Close</button>
    </div>
  </div>\`;
  APP.modal = 'custom';
  render();
}

function exportBatchMonthlyReportPDF(bid){
  const b = batch(bid);
  if(!b) return;
  const m = batchMetrics(bid, APP.range.from, APP.range.to);
  const funnelStages = batchPreachingFunnel(bid);
  const facs = getBatchFacilitators(bid);
  const vols = getBatchVolunteers(bid);
  const bIncharge = b.incharge || 'd1';
  const bCoordinator = b.coordinator || b.facilitators?.[0] || 'd1';

  const maxVal = Math.max(...funnelStages.map(s => s.v), 1);
  const dateRangeStr = \`\${fmtD(APP.range.from)} — \${fmtD(APP.range.to)}\`;

  const printDoc = \`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>ISKCON_Jia_Sarai_\${b.name.replace(/\\s+/g,'_')}_Monthly_Report_\${iso(TODAY)}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; }
    html { background: #525659; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #111;
      width: 210mm;
      max-width: 210mm;
      min-height: 297mm;
      margin: 20px auto;
      padding: 14mm 14mm 16mm 14mm;
      background: #fff;
      font-size: 11.5px;
      line-height: 1.45;
      box-shadow: 0 4px 15px rgba(0,0,0,0.25);
    }
    .no-print-bar {
      background: #222;
      color: #fff;
      padding: 10px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: -14mm -14mm 16px -14mm;
      font-size: 13px;
    }
    .btn-print {
      background: #c2410c;
      color: #fff;
      border: none;
      padding: 6px 14px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      font-size: 12.5px;
    }
    .btn-close {
      background: transparent;
      color: #ccc;
      border: 1px solid #555;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      margin-left: 8px;
    }
    .header {
      border-bottom: 2px solid #ea580c;
      padding-bottom: 12px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand-title {
      font-size: 19px;
      font-weight: 800;
      color: #9a3412;
      letter-spacing: -0.02em;
    }
    .sub-brand {
      font-size: 12px;
      color: #666;
      margin-top: 2px;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      background: #ffedd5;
      color: #c2410c;
    }
    .meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 16px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      font-size: 12px;
    }
    .meta-item b { display: block; font-size: 13px; color: #0f172a; margin-top: 1px; }
    .meta-item span { color: #64748b; font-size: 11px; }
    .section-title {
      font-size: 13.5px;
      font-weight: 700;
      color: #1e293b;
      margin: 16px 0 8px 0;
      padding-bottom: 4px;
      border-bottom: 1px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 8px;
      margin-bottom: 16px;
    }
    .stat-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 10px;
      text-align: center;
    }
    .stat-card .val {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.1;
      margin-top: 4px;
    }
    .stat-card .lbl {
      font-size: 10.5px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .funnel-container {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 16px;
    }
    .funnel-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 7px;
      font-size: 11.5px;
    }
    .funnel-row:last-child { margin-bottom: 0; }
    .funnel-lbl { width: 140px; font-weight: 600; color: #334155; }
    .funnel-bar-box { flex: 1; background: #f1f5f9; border-radius: 6px; height: 24px; overflow: hidden; }
    .funnel-bar {
      height: 100%;
      background: #4f46e5;
      color: #fff;
      display: flex;
      align-items: center;
      padding-left: 10px;
      font-weight: 700;
      font-size: 11px;
    }
    .funnel-conv { width: 48px; text-align: right; color: #64748b; font-weight: 600; font-size: 11px; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 11px;
    }
    th {
      background: #f1f5f9;
      color: #475569;
      font-weight: 600;
      text-align: left;
      padding: 7px 9px;
      border-bottom: 1px solid #cbd5e1;
    }
    td {
      padding: 6px 9px;
      border-bottom: 1px solid #e2e8f0;
      color: #1e293b;
    }
    .signatures {
      margin-top: 36px;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
    }
    .sig-box {
      width: 44%;
      border-top: 1px dashed #64748b;
      padding-top: 6px;
      text-align: center;
      font-size: 11.5px;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
        box-shadow: none;
        width: 100%;
        max-width: none;
      }
      .no-print-bar { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div><strong>ISKCON Jia Sarai BACE</strong> — Automated Monthly Report Preview</div>
    <div>
      <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
      <button class="btn-close" onclick="window.close()">✕ Close Preview</button>
    </div>
  </div>

  <div class="header">
    <div>
      <div class="brand-title">ISKCON Jia Sarai · BACE Management</div>
      <div class="sub-brand">Preaching Ministry — Automated Live Monthly Batch Report</div>
    </div>
    <div style="text-align:right">
      <span class="badge">Level \${b.level} Batch</span>
      <div style="font-size:11px;color:#64748b;margin-top:4px">Generated: \${fmtLong(TODAY)}</div>
    </div>
  </div>

  <div class="meta-box">
    <div class="meta-item"><span>Batch Name</span><b>\${esc(b.name)}</b></div>
    <div class="meta-item"><span>Incharge</span><b>\${esc(nameOf(bIncharge))}</b></div>
    <div class="meta-item"><span>Coordinator</span><b>\${esc(nameOf(bCoordinator))}</b></div>
    <div class="meta-item"><span>Reporting Period</span><b>\${dateRangeStr}</b></div>
  </div>

  <div class="section-title">📊 Executive Key Metrics</div>
  <div class="stats-grid">
    <div class="stat-card"><div class="lbl">Total Members</div><div class="val">\${m.members.length}</div></div>
    <div class="stat-card"><div class="lbl">Active</div><div class="val" style="color:#16a34a">\${m.active}</div></div>
    <div class="stat-card"><div class="lbl">Facilitators</div><div class="val" style="color:#4f46e5">\${facs.length}</div></div>
    <div class="stat-card"><div class="lbl">Volunteers</div><div class="val" style="color:#d97706">\${vols.length}</div></div>
    <div class="stat-card"><div class="lbl">Avg Attendance</div><div class="val">\${m.attendance}%</div></div>
    <div class="stat-card"><div class="lbl">Follow-ups Done</div><div class="val">\${m.fus.done}/\${m.fus.total}</div></div>
  </div>

  <div class="section-title">🎯 Individual Batch Preaching Funnel</div>
  <div class="funnel-container">
    \${funnelStages.map((st, i) => {
      const w = Math.min(100, Math.max(12, Math.round((st.v / maxVal) * 100)));
      const prev = i > 0 ? funnelStages[i - 1].v : st.v;
      const conv = i > 0 && prev > 0 ? pct(st.v, prev) : 100;
      return \`<div class="funnel-row">
        <div class="funnel-lbl">\${esc(st.l)}</div>
        <div class="funnel-bar-box">
          <div class="funnel-bar" style="width:\${w}%;background:\${st.color}">\${st.v}</div>
        </div>
        <div class="funnel-conv">\${i ? conv + '%' : ''}</div>
      </div>\`;
    }).join('')}
  </div>

  <div class="section-title">📖 Classes & Attendance Breakdown (\${m.classes.length} classes)</div>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Class / Topic</th>
        <th>Preacher / Speaker</th>
        <th style="text-align:right">Present</th>
        <th style="text-align:right">Total</th>
        <th style="text-align:right">Attendance %</th>
      </tr>
    </thead>
    <tbody>
      \${m.perClass.length ? m.perClass.map(pc => \`
        <tr>
          <td><b>\${fmtD(pc.c.date)}</b></td>
          <td>\${esc(pc.c.name)}</td>
          <td>\${esc(nameOf(pc.c.responsible || bCoordinator))}</td>
          <td style="text-align:right">\${pc.present}</td>
          <td style="text-align:right">\${pc.total}</td>
          <td style="text-align:right;font-weight:700;color:\${pc.pctv >= 75 ? '#16a34a' : pc.pctv >= 50 ? '#d97706' : '#dc2626'}">\${pc.pctv}%</td>
        </tr>\`).join('') : '<tr><td colspan="6" style="text-align:center;color:#64748b;padding:12px">No completed classes in this period</td></tr>'}
    </tbody>
  </table>

  <div class="section-title">🧑‍🏫 Batch Leadership & Care Team</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px">
    <div style="border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px">
      <div style="font-weight:700;color:#4f46e5;margin-bottom:6px">Facilitators (\${facs.length})</div>
      <div style="font-size:11px;color:#334155">\${facs.map(f => \`• \${esc(f.name)} (\${esc(f.phone || 'Active')})\`).join('<br>') || 'None'}</div>
    </div>
    <div style="border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px">
      <div style="font-weight:700;color:#d97706;margin-bottom:6px">Volunteers (\${vols.length})</div>
      <div style="font-size:11px;color:#334155">\${vols.map(v => \`• \${esc(v.name)} (\${esc(dept(v.dept)?.name || v.service || 'Active')})\`).join('<br>') || 'None'}</div>
    </div>
  </div>

  \${(DB.reports.find(r => r.batch === bid) || {}).story || (DB.reports.find(r => r.batch === bid) || {}).challenges ? \`
  <div class="section-title">📝 Monthly Preaching Narrative</div>
  <div style="border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px;font-size:11px;margin-bottom:16px">
    \${(DB.reports.find(r => r.batch === bid) || {}).story ? \`<p style="margin:4px 0"><b>Successes:</b> \${esc((DB.reports.find(r => r.batch === bid) || {}).story)}</p>\` : ''}
    \${(DB.reports.find(r => r.batch === bid) || {}).challenges ? \`<p style="margin:4px 0"><b>Challenges:</b> \${esc((DB.reports.find(r => r.batch === bid) || {}).challenges)}</p>\` : ''}
    \${(DB.reports.find(r => r.batch === bid) || {}).next ? \`<p style="margin:4px 0"><b>Next Month Plan:</b> \${esc((DB.reports.find(r => r.batch === bid) || {}).next)}</p>\` : ''}
  </div>\` : ''}

  <div class="signatures">
    <div class="sig-box">
      <b>\${esc(nameOf(bCoordinator))}</b><br>
      Batch Coordinator
    </div>
    <div class="sig-box">
      <b>\${esc(nameOf(bIncharge))}</b><br>
      BACE Incharge / Area Leader
    </div>
  </div>
</body>
</html>\`;

  const win = window.open('', '_blank');
  if(win){
    win.document.open();
    win.document.write(printDoc);
    win.document.close();
  } else {
    toast('Popup blocker prevented opening the report preview','⚠️');
  }
}

function viewPreachingReports(){
  const bid=APP.filters.repBatch||DB.batches[0].id;
  const b=batch(bid),m=batchMetrics(bid, APP.range.from, APP.range.to);
  const bIncharge = b.incharge || 'd1';
  const bCoordinator = b.coordinator || b.facilitators?.[0] || 'd1';
  const facList = getBatchFacilitators(bid);
  const volList = getBatchVolunteers(bid);

  return head('📈 BACE Preaching','Reports & analytics','Batch-wise automated monthly reports with live attendance, funnel, classes, follow-ups and budget',
    \`<button class="btn" data-act="export-batch-report" data-id="\${bid}">\${ic('download')}Export CSV</button>
     <button class="btn pri" data-act="download-batch-monthly-report-pdf" data-id="\${bid}">\${ic('doc')}Generate Monthly Report (PDF)</button>\`)+
  \`<div class="card" style="margin-bottom:15px"><div class="toolbar" style="display:flex;flex-wrap:wrap;gap:10px;align-items:center">
     <select data-act="rep-batch">\${DB.batches.map(x=>\`<option value="\${x.id}" \${x.id===bid?'selected':''}>\${esc(x.name)} — Level \${x.level}</option>\`).join('')}</select>
     <input type="date" value="\${APP.range.from}" data-act="range" data-n="from"><input type="date" value="\${APP.range.to}" data-act="range" data-n="to">
     <span class="tiny" style="margin-left:auto">Showing \${fmtD(APP.range.from)} → \${fmtD(APP.range.to)}</span></div></div>

   <h2 style="margin-bottom:6px">\${esc(b.name)} — monthly report</h2>
   <div class="batch-lead-bar" style="display:flex;flex-wrap:wrap;gap:14px;align-items:center;margin-bottom:16px;padding:9px 15px;background:var(--surface);border:1px solid var(--line);border-radius:10px;font-size:13px">
     <div style="display:flex;align-items:center;gap:6px">
       <span class="muted" style="font-size:12px">Incharge:</span>
       <span style="font-weight:600;display:inline-flex;align-items:center;gap:6px">\${av(nameOf(bIncharge),22)} \${esc(nameOf(bIncharge))}</span>
     </div>
     <span class="muted" style="opacity:.4">|</span>
     <div style="display:flex;align-items:center;gap:6px">
       <span class="muted" style="font-size:12px">Coordinator:</span>
       <span style="font-weight:600;display:inline-flex;align-items:center;gap:6px">\${av(nameOf(bCoordinator),22)} \${esc(nameOf(bCoordinator))}</span>
     </div>
     <span class="muted" style="opacity:.4">|</span>
     <div style="display:flex;align-items:center;gap:6px">
       <span class="muted" style="font-size:12px">Level:</span>
       <span class="badge b-blue" style="font-size:11.5px">Level \${b.level}</span>
     </div>
     <div style="margin-left:auto;display:flex;align-items:center;gap:6px">
       <span class="badge b-green" style="font-size:11.5px">● Live Automated</span>
     </div>
   </div>

   <div class="grid g-2-1" style="margin-bottom:15px">
    <div style="display:flex;flex-direction:column;gap:15px">
      \${section('👥 Members & Team',\`<div class="grid g6" style="padding:16px 18px">
        \${stat('Total members',m.members.length,'in the batch',{r:'#/devotees'})}
        \${stat('Active',m.active,'attending',{r:'#/devotees'})}
        \${stat('New',m.neu,'joined this month',{r:'#/devotees'})}
        \${stat('Inactive',m.inactive,'not attending',{r:'#/devotees'})}
        \${stat('Facilitators',facList.length,'tap to view',{em:'🧑‍🏫',act:'open-batch-facilitators',id:bid,arg:bid})}
        \${stat('Volunteers',volList.length,'tap to view',{em:'🛠',act:'open-batch-volunteers',id:bid,arg:bid})}
      </div>\`)}

      \${section('🎯 Batch preaching funnel',\`<div class="card-b">
        <p class="tiny muted" style="margin-top:0;margin-bottom:12px">Conversion and progression of souls connected with \${esc(b.name)}</p>
        \${funnel(batchPreachingFunnel(bid))}
      </div>\`, \`<span class="badge b-purple" style="font-size:11px">6-Stage Funnel</span>\`)}

      \${section('📖 Classes & events',\`<div class="grid g4" style="padding:16px 18px">
        \${stat('Classes',m.classes.length,'held or scheduled',{r:'#/classes'})}\${stat('Events',m.events.length,'special programmes',{r:'#/classes'})}
        \${stat('Average attendance',m.attendance+'%','across classes',{r:'#/batch-attendance'})}\${stat('Total attendance',m.totalAtt,'present marks recorded',{r:'#/batch-attendance'})}</div>\`)}

      \${section('📊 Attendance per class',m.perClass.length?\`<div class="card-b">\${barChart(m.perClass.slice(-6).map(p=>({l:fmtD(p.c.date).slice(0,6),v:p.pctv,color:'var(--indigo)',
        tip:\`\${p.c.name}\\n\${fmtLong(p.c.date)}\\nAttendance: \${p.pctv}%\\nPresent: \${p.present}\\nAbsent: \${p.total-p.present}\\nTotal: \${p.total}\`})),{unit:'%'})}
        <div class="tiny" style="margin-top:8px">Best \${m.best}% · lowest \${m.low}%</div></div>\`:emptyState('No completed classes','','',''))}
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
    </div></div>\`;
}`;

lines.splice(vprStartIdx, careStartIdx - vprStartIdx, newPreachingCode);
console.log('Replaced viewPreachingReports section');

// 5. Add click event handlers
const clickOpenerIdx = lines.findIndex(l => l.includes('case \'open-devotee\':'));
console.log('clickOpenerIdx:', clickOpenerIdx);
const newClickHandlers = [
  '  case \'open-batch-facilitators\':stop();{',
  '    const bid = t.dataset.id || t.dataset.arg || APP.filters.repBatch || DB.batches[0]?.id;',
  '    showBatchFacilitatorsModal(bid);',
  '    break;',
  '  }',
  '  case \'open-batch-volunteers\':stop();{',
  '    const bid = t.dataset.id || t.dataset.arg || APP.filters.repBatch || DB.batches[0]?.id;',
  '    showBatchVolunteersModal(bid);',
  '    break;',
  '  }',
  '  case \'download-batch-monthly-report-pdf\':stop();{',
  '    const bid = t.dataset.id || t.dataset.arg || APP.filters.repBatch || DB.batches[0]?.id;',
  '    exportBatchMonthlyReportPDF(bid);',
  '    break;',
  '  }',
];
lines.splice(clickOpenerIdx, 0, ...newClickHandlers);
console.log('Added new click handlers');

// 6. Update export-batch-report CSV
const exportBatchIdx = lines.findIndex(l => l.includes('case \'export-batch-report\':{'));
console.log('exportBatchIdx:', exportBatchIdx);
if (exportBatchIdx !== -1) {
  const exportBatchEnd = lines.findIndex((l, i) => i >= exportBatchIdx && l.includes('toast(\'Batch report exported\',\'⬇️\');break}'));
  console.log('exportBatchEnd:', exportBatchEnd);
  const newExportBatchLines = [
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
    '      [\'Total members\', m.members.length], [\'Active members\', m.active], [\'New members\', m.neu], [\'Inactive members\', m.inactive],',
    '      [\'Facilitators\', facs.length], [\'Volunteers\', vols.length],',
    '      ...funnelStages.map(fs => [\'Funnel — \' + fs.l, fs.v]),',
    '      [\'Classes\', m.classes.length], [\'Events\', m.events.length], [\'Average attendance %\', m.attendance],',
    '      [\'Best class attendance %\', m.best], [\'Lowest class attendance %\', m.low], [\'Total attendance marks\', m.totalAtt],',
    '      [\'Follow-ups total\', m.fus.total], [\'Follow-ups completed\', m.fus.done], [\'Follow-ups pending\', m.fus.pending], [\'Follow-ups overdue\', m.fus.overdue],',
    '      [\'Budget allocated\', m.budget.allocated], [\'Budget spent\', m.budget.spent], [\'Budget remaining\', m.budget.allocated - m.budget.spent], [\'Utilisation %\', m.util]]);',
    '    toast(\'Batch report exported\',\'⬇️\');break}'
  ];
  lines.splice(exportBatchIdx, exportBatchEnd - exportBatchIdx + 1, ...newExportBatchLines);
  console.log('Updated export-batch-report CSV');
}

const finalHtml = lines.join(isCRLF ? '\r\n' : '\n');
fs.writeFileSync('public/index.html', finalHtml);
console.log('Successfully wrote updated public/index.html');
