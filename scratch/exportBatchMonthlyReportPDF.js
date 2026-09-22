function exportBatchMonthlyReportPDF(bid){
  const b = batch(bid);
  if(!b) return;
  const m = batchMetrics(bid, APP.range.from, APP.range.to);
  const facs = getBatchFacilitators(bid);
  const vols = getBatchVolunteers(bid);
  const bIncharge = b.incharge || 'd1';
  let bCoordinator = b.coordinator || b.facilitators?.[0] || 'd1';
  let coordName = nameOf(bCoordinator);
  if ((!coordName || coordName === bCoordinator || coordName.startsWith('d_')) && facs.length) {
    const matchDv = dv(bCoordinator) || (DB.devotees||[]).find(x => x.id === bCoordinator || x.customId === bCoordinator);
    coordName = matchDv ? matchDv.name : (facs[0]?.name || 'Batch Coordinator');
  }

  const dateRangeStr = `${fmtD(APP.range.from)} — ${fmtD(APP.range.to)}`;
  const logoSrc = BACE_LOGO_SRC;
  const prabhupadaSrc = BACE_PRABHUPADA_SRC;

  const printDoc = `<\!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${esc(b.name).replace(/\s+/g,'_')}_Batch_Report</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 10mm 12mm;
    }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    html { background: #334155; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      width: 210mm;
      max-width: 210mm;
      min-height: 297mm;
      margin: 20px auto;
      padding: 12mm 15mm;
      background: #ffffff;
      font-size: 11px;
      line-height: 1.45;
      box-shadow: 0 16px 40px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.06);
    }
    .no-print-bar {
      background: #0f172a;
      color: #f8fafc;
      padding: 10px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: -12mm -15mm 16px -15mm;
      font-size: 13px;
      font-weight: 500;
      border-bottom: 1px solid #334155;
    }
    .btn-print {
      background: linear-gradient(145deg, #f97316, #ea580c);
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      border-radius: 7px;
      font-weight: 700;
      cursor: pointer;
      font-size: 12.5px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 3px 8px rgba(234,88,12,0.35), inset 0 1px 0 rgba(255,255,255,0.25);
    }
    .btn-print:hover { background: #c2410c; }
    .btn-close {
      background: transparent;
      color: #94a3b8;
      border: 1px solid #475569;
      padding: 7px 14px;
      border-radius: 7px;
      cursor: pointer;
      font-size: 12px;
      margin-left: 8px;
    }
    .btn-close:hover { color: #fff; border-color: #cbd5e1; }

    /* 3D Header Grid: Left Logo Plate | Centered Title & Badges | Right Prabhupada Image */
    .header-grid {
      display: grid;
      grid-template-columns: 80px 1fr 80px;
      align-items: center;
      gap: 12px;
      margin-bottom: 10px;
    }
    .header-left {
      display: flex;
      justify-content: flex-start;
      align-items: center;
    }
    .logo-3d-plate {
      width: 62px;
      height: 62px;
      border-radius: 14px;
      background: linear-gradient(145deg, #0f172a 0%, #1e293b 60%, #0f172a 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 5px;
      border: 1.5px solid rgba(234,88,12,0.35);
      box-shadow: 0 6px 14px rgba(15,23,42,0.28), 0 2px 4px rgba(0,0,0,0.12), inset 0 1px 1px rgba(255,255,255,0.2);
    }
    .logo-3d-plate img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6));
    }
    .header-center {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .org-kicker {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #ea580c;
      margin-bottom: 3px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .report-title {
      font-size: 24px;
      font-weight: 900;
      color: #0f172a;
      margin: 0 0 5px 0;
      letter-spacing: -0.025em;
      line-height: 1.2;
      text-align: center;
      text-shadow: 0 1px 2px rgba(0,0,0,0.06);
    }
    .report-subtitle {
      font-size: 11.5px;
      font-weight: 600;
      color: #475569;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .header-right {
      display: flex;
      justify-content: flex-end;
      align-items: center;
    }
    .prabhupada-frame {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .prabhupada-frame img {
      height: 82px;
      width: auto;
      object-fit: contain;
      filter: drop-shadow(0 6px 14px rgba(0,0,0,0.22));
    }

    /* 3D Badges */
    .level-badge {
      display: inline-block;
      padding: 3px 9px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 800;
      background: linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%);
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      box-shadow: 0 2px 4px rgba(29,78,216,0.12);
    }
    .active-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 9px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 700;
      background: linear-gradient(180deg, #ecfdf5 0%, #d1fae5 100%);
      color: #047857;
      border: 1px solid #a7f3d0;
      box-shadow: 0 2px 4px rgba(4,120,87,0.12);
    }

    /* 3D Gradient Divider */
    .header-divider {
      height: 4px;
      background: linear-gradient(90deg, #ea580c 0%, #f97316 35%, #fbbf24 75%, #6366f1 100%);
      border-radius: 4px;
      margin: 8px 0 14px 0;
      box-shadow: 0 2px 5px rgba(234,88,12,0.25);
    }

    /* 3D Metadata Ribbon */
    .meta-box {
      background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 9px 14px;
      margin-bottom: 14px;
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02);
    }
    .meta-item span {
      display: block;
      color: #64748b;
      font-size: 9.5px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 800;
    }
    .meta-item b {
      display: block;
      font-size: 12px;
      color: #0f172a;
      margin-top: 2px;
      font-weight: 800;
    }

    /* 3D Section Headings */
    .section-title {
      font-size: 12.5px;
      font-weight: 800;
      color: #1e293b;
      margin: 14px 0 7px 0;
      display: flex;
      align-items: center;
      gap: 6px;
      letter-spacing: -0.01em;
      text-shadow: 0 1px 1px rgba(0,0,0,0.04);
    }

    /* 3D Metrics Grid: 10 cards in 5 columns (2 balanced rows) */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 8px;
      margin-bottom: 14px;
    }
    .stat-card {
      background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 8px 6px;
      text-align: center;
      box-shadow: 0 4px 10px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.8);
    }
    .stat-card .val {
      font-size: 17.5px;
      font-weight: 900;
      color: #0f172a;
      line-height: 1.15;
      margin-top: 2px;
      text-shadow: 0 1px 1px rgba(0,0,0,0.05);
    }
    .stat-card .lbl {
      font-size: 9px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      font-weight: 800;
    }

    /* 3D Table Box */
    .table-box {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 14px;
      box-shadow: 0 6px 16px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
    }
    th {
      background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
      color: #475569;
      font-weight: 800;
      text-align: left;
      padding: 7px 10px;
      border-bottom: 1.5px solid #cbd5e1;
      font-size: 9.5px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    td {
      padding: 6px 10px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }
    tr:last-child td { border-bottom: none; }
    tr:nth-child(even) td { background: #fafafa; }
    .att-pill {
      display: inline-block;
      padding: 2.5px 8px;
      border-radius: 10px;
      font-weight: 800;
      font-size: 10px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .att-high { background: linear-gradient(180deg, #dcfce7, #bbf7d0); color: #15803d; border: 1px solid #86efac; }
    .att-mid { background: linear-gradient(180deg, #fef3c7, #fde68a); color: #b45309; border: 1px solid #fcd34d; }
    .att-low { background: linear-gradient(180deg, #fee2e2, #fecaca); color: #b91c1c; border: 1px solid #fca5a5; }

    /* 3D Team Grid */
    .team-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 14px;
    }
    .team-card {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 14px;
      background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
      box-shadow: 0 4px 12px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8);
    }
    .team-card-head {
      font-weight: 800;
      font-size: 11.5px;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .team-list {
      font-size: 10.5px;
      color: #334155;
      line-height: 1.65;
    }

    /* 3D Budget Box */
    .budget-box {
      background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 16px;
      margin-bottom: 14px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8);
    }

    /* 3D Narrative Box */
    .narrative-box {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 14px;
      font-size: 10.5px;
      margin-bottom: 14px;
      background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
      border-left: 4px solid #6366f1;
      box-shadow: 0 4px 12px rgba(0,0,0,0.04);
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
    <div><strong>ISKCON BACE, Jia Sarai</strong> — ${esc(b.name)} Batch Report Preview</div>
    <div>
      <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
      <button class="btn-close" onclick="window.close()">✕ Close Preview</button>
    </div>
  </div>

  <div class="header-grid">
    <div class="header-left">
      <div class="logo-3d-plate" title="ISKCON BACE Logo">
        <img src="${logoSrc}" alt="ISKCON Logo">
      </div>
    </div>
    <div class="header-center">
      <div class="org-kicker">ISKCON BACE, Jia Sarai</div>
      <h1 class="report-title">${esc(b.name)} Batch Report</h1>
      <div class="report-subtitle">
        <span>📅 Duration: <strong>${dateRangeStr}</strong></span>
        <span style="opacity:0.35">|</span>
        <span class="level-badge">Level ${b.level}</span>
        <span class="active-badge">● Active Preaching</span>
      </div>
    </div>
    <div class="header-right">
      <div class="prabhupada-frame" title="His Divine Grace A.C. Bhaktivedanta Swami Prabhupada">
        <img src="${prabhupadaSrc}" alt="His Divine Grace A.C. Bhaktivedanta Swami Prabhupada">
      </div>
    </div>
  </div>

  <div class="header-divider"></div>

  <div class="meta-box">
    <div class="meta-item"><span>Batch Name</span><b>${esc(b.name)}</b></div>
    <div class="meta-item"><span>Incharge</span><b>${esc(nameOf(bIncharge))}</b></div>
    <div class="meta-item"><span>Coordinator</span><b>${esc(coordName)}</b></div>
    <div class="meta-item"><span>Schedule</span><b>${esc(b.day)} ${esc(b.time)}</b></div>
    <div class="meta-item"><span>Duration</span><b>${dateRangeStr}</b></div>
  </div>

  <div class="section-title">📊 Executive Key Metrics</div>
  <div class="stats-grid">
    <div class="stat-card"><div class="lbl">Total Members</div><div class="val">${m.members.length}</div></div>
    <div class="stat-card"><div class="lbl">Active</div><div class="val" style="color:#16a34a">${m.active}</div></div>
    <div class="stat-card"><div class="lbl">New Joined</div><div class="val" style="color:#2563eb">${m.neu}</div></div>
    <div class="stat-card"><div class="lbl">Inactive</div><div class="val" style="color:#94a3b8">${m.inactive}</div></div>
    <div class="stat-card"><div class="lbl">Facilitators</div><div class="val" style="color:#4f46e5">${facs.length}</div></div>
    <div class="stat-card"><div class="lbl">Volunteers</div><div class="val" style="color:#d97706">${vols.length}</div></div>
    <div class="stat-card"><div class="lbl">Classes Held</div><div class="val">${m.classes.length}</div></div>
    <div class="stat-card"><div class="lbl">Events</div><div class="val">${m.events.length}</div></div>
    <div class="stat-card"><div class="lbl">Avg Attendance</div><div class="val" style="color:#0284c7">${m.attendance}%</div></div>
    <div class="stat-card"><div class="lbl">Follow-ups</div><div class="val" style="color:#16a34a">${m.fus.done}/${m.fus.total}</div></div>
  </div>

  <div class="section-title">📖 Classes &amp; Events Breakdown (${m.perClass.length} session${m.perClass.length!==1?'s':''})</div>
  <div class="table-box">
    <table>
      <thead>
        <tr>
          <th style="width:13%">Date</th>
          <th style="width:23%">Session / Topic</th>
          <th style="width:17%">Preacher / Speaker</th>
          <th style="width:25%">Prasadam Menu</th>
          <th style="text-align:right;width:7%">Present</th>
          <th style="text-align:right;width:7%">Total</th>
          <th style="text-align:right;width:8%">Att %</th>
        </tr>
      </thead>
      <tbody>
        ${m.perClass.length ? m.perClass.map(pc => `
          <tr>
            <td><b>${fmtD(pc.c.date)}</b></td>
            <td style="font-weight:600">${esc(pc.c.name)}</td>
            <td>${esc(nameOf(pc.c.responsible || bCoordinator))}</td>
            <td style="font-size:10px;color:${pc.c.prasadamMenu?'#b45309':'#94a3b8'}">
              ${pc.c.prasadamMenu ? `🍲 <b>${esc(pc.c.prasadamMenu)}</b>` : '<span style="color:#cbd5e1">—</span>'}
            </td>
            <td style="text-align:right;font-weight:600">${pc.present}</td>
            <td style="text-align:right;color:#64748b">${pc.total}</td>
            <td style="text-align:right">
              <span class="att-pill ${pc.pctv >= 75 ? 'att-high' : pc.pctv >= 50 ? 'att-mid' : 'att-low'}">${pc.pctv}%</span>
            </td>
          </tr>`).join('') : '<tr><td colspan="7" style="text-align:center;color:#64748b;padding:12px">No completed sessions in this period</td></tr>'}
      </tbody>
    </table>
  </div>

  ${(() => {
    const prSessions = m.acts ? m.acts.filter(a => a.prasadamMenu && a.prasadamMenu.trim()) : [];
    if(!prSessions.length) return '';
    return `
  <div class="section-title">🍲 Prasadam Seva &amp; Feast Menus (${prSessions.length} session${prSessions.length !== 1 ? 's' : ''})</div>
  <div class="table-box">
    <table>
      <thead>
        <tr>
          <th style="width:15%">Date</th>
          <th style="width:28%">Programme / Session</th>
          <th style="width:14%">Type</th>
          <th style="width:43%">Prasadam Menu Served</th>
        </tr>
      </thead>
      <tbody>
        ${prSessions.sort((x,y)=>x.date<y.date?-1:1).map(a => `
          <tr>
            <td><b>${fmtD(a.date)}</b></td>
            <td style="font-weight:600">${esc(a.name)}</td>
            <td><span class="att-pill" style="background:#fff7ed;color:#c2410c;font-weight:700">${esc(a.type)}</span></td>
            <td style="color:#b45309;font-weight:600">🍲 ${esc(a.prasadamMenu)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>`;
  })()}

  <div class="section-title">🧑‍🏫 Batch Leadership &amp; Care Team</div>
  <div class="team-grid">
    <div class="team-card" style="border-left:4px solid #4f46e5">
      <div class="team-card-head" style="color:#4f46e5">
        <span>Facilitators List (${facs.length})</span>
      </div>
      <div class="team-list">
        ${facs.map(f => `<div>• <b>${esc(f.name)}</b> <span style="color:#64748b;font-size:10px">(${esc(f.phone || 'Active Facilitator')})</span></div>`).join('') || '<span style="color:#94a3b8">None assigned</span>'}
      </div>
    </div>
    <div class="team-card" style="border-left:4px solid #d97706">
      <div class="team-card-head" style="color:#d97706">
        <span>Volunteers List (${vols.length})</span>
      </div>
      <div class="team-list">
        ${vols.map(v => `<div>• <b>${esc(v.name)}</b> <span style="color:#64748b;font-size:10px">(${esc(dept(v.dept)?.name || v.service || 'Active Volunteer')})</span></div>`).join('') || '<span style="color:#94a3b8">None assigned</span>'}
      </div>
    </div>
  </div>

  ${(DB.reports && (DB.reports.find(r => r.batch === bid) || {}).story || (DB.reports.find(r => r.batch === bid) || {}).challenges) ? `
  <div class="section-title">📝 Monthly Preaching Narrative</div>
  <div class="narrative-box">
    ${(DB.reports.find(r => r.batch === bid) || {}).story ? `<p style="margin:3px 0"><b>Successes:</b> ${esc((DB.reports.find(r => r.batch === bid) || {}).story)}</p>` : ''}
    ${(DB.reports.find(r => r.batch === bid) || {}).challenges ? `<p style="margin:3px 0"><b>Challenges:</b> ${esc((DB.reports.find(r => r.batch === bid) || {}).challenges)}</p>` : ''}
    ${(DB.reports.find(r => r.batch === bid) || {}).next ? `<p style="margin:3px 0"><b>Next Month Plan:</b> ${esc((DB.reports.find(r => r.batch === bid) || {}).next)}</p>` : ''}
  </div>` : ''}

  <div class="section-title">🧾 Budget &amp; Accounts (Collection &amp; Expenses)</div>
  <div class="budget-box">
    <div class="meta-item"><span>Collected Budget</span><b style="color:#16a34a;font-size:13px">₹${Number(b.budget.allocated).toLocaleString()}</b></div>
    <div class="meta-item"><span>Total Expenses (Spent)</span><b style="color:#dc2626;font-size:13px">₹${Number(b.budget.spent).toLocaleString()}</b></div>
    <div class="meta-item"><span>Remaining Balance</span><b style="color:#0f172a;font-size:13px">₹${Number(b.budget.allocated - b.budget.spent).toLocaleString()}</b></div>
    <div class="meta-item"><span>Budget Utilisation</span><b style="color:${m.util>90?'#dc2626':'#2563eb'};font-size:13px">${m.util}% spent</b></div>
  </div>
<\/body>
<\/html>`;

  const win = window.open('', '_blank');
  if(win){
    win.document.open();
    win.document.write(printDoc);
    win.document.close();
  } else {
    toast('Popup blocker prevented opening the report preview','⚠️');
  }
}