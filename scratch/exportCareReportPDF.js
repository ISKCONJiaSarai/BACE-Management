function exportCareReportPDF(){
  const s = STATS();
  const g = DB.careGroups.filter(x => x.status === 'Active');
  const careUser = (DB.users||[]).find(x => x.role === 'care_manager');
  const careDev = careUser ? dv(careUser.devotee) : (DB.devotees||[]).find(x => x.appointment === ROLES.care_manager?.name || devoteeRole(x) === 'care_manager');
  const careMgrName = careDev ? careDev.name : 'Devotee Care Manager';
  const dateStr = fmtLong(iso(TODAY));

  const printDoc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Devotee Care &amp; Well-being Report — ISKCON BACE Jia Sarai</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Caveat:wght@600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 12mm 12mm;
    }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      color: #0f172a;
      background: #ffffff;
      margin: 0 auto;
      max-width: 800px;
      padding: 10px 14px;
    }
    h1, h2, h3, .report-title { font-family: 'Outfit', sans-serif; }
    .no-print-bar {
      background: #0f172a;
      color: #f8fafc;
      padding: 10px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: -10px -14px 16px -14px;
      font-size: 13px;
      font-weight: 500;
      border-radius: 0 0 8px 8px;
    }
    .btn-print {
      background: linear-gradient(145deg, #10b981, #059669);
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
      box-shadow: 0 3px 8px rgba(5,150,105,0.35);
    }
    .btn-print:hover { background: #047857; }
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
    .header-grid {
      display: grid;
      grid-template-columns: 80px 1fr 80px;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
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
      border: 1.5px solid rgba(16,185,129,0.4);
      box-shadow: 0 6px 14px rgba(15,23,42,0.25);
    }
    .logo-3d-plate img { width: 100%; height: 100%; object-fit: contain; }
    .header-center { text-align: center; }
    .org-kicker {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #059669;
      margin-bottom: 3px;
    }
    .report-title {
      font-size: 22px;
      font-weight: 900;
      color: #0f172a;
      margin: 0 0 4px 0;
      letter-spacing: -0.02em;
    }
    .report-subtitle {
      font-size: 11px;
      font-weight: 600;
      color: #475569;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .prabhupada-frame img {
      height: 80px;
      width: auto;
      object-fit: contain;
      filter: drop-shadow(0 4px 10px rgba(0,0,0,0.2));
    }
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 14px;
    }
    .kpi-card {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 12px;
      background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
      border-top: 3px solid #10b981;
      box-shadow: 0 2px 6px rgba(0,0,0,0.03);
    }
    .kpi-title { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 3px; }
    .kpi-val { font-size: 20px; font-weight: 800; color: #0f172a; font-family: 'Outfit', sans-serif; }
    .kpi-sub { font-size: 10px; color: #64748b; margin-top: 2px; }
    .sec-title {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
      margin: 14px 0 8px 0;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 4px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .tbl {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
      margin-bottom: 12px;
    }
    .tbl th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      text-align: left;
      padding: 6px 8px;
      border: 1px solid #cbd5e1;
    }
    .tbl td {
      padding: 6px 8px;
      border: 1px solid #e2e8f0;
      color: #1e293b;
    }
    .tbl tr:nth-child(even) { background: #f8fafc; }
    .badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 999px;
      font-size: 9.5px;
      font-weight: 700;
    }
    .badge-green { background: #dcfce7; color: #15803d; }
    .badge-teal { background: #ccfbf1; color: #0f766e; }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 14px;
    }
    .info-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
      background: #ffffff;
    }
    @media print {
      .no-print-bar { display: none !important; }
      body { padding: 0; margin: 0; max-width: none; }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div><strong>ISKCON BACE, Jia Sarai</strong> — Devotee Care &amp; Well-being Report Preview</div>
    <div>
      <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
      <button class="btn-close" onclick="window.close()">✕ Close Preview</button>
    </div>
  </div>

  <div class="header-grid">
    <div class="logo-3d-plate">
      <img src="${BACE_LOGO_SRC}" alt="ISKCON BACE Logo">
    </div>
    <div class="header-center">
      <div class="org-kicker">ISKCON BACE, Jia Sarai · Devotee Care Pillar</div>
      <h1 class="report-title">Care &amp; Well-being Comprehensive Report</h1>
      <div class="report-subtitle">
        <span>📅 Generated: <strong>${dateStr}</strong></span>
        <span>•</span>
        <span>Lead: <strong>${esc(careMgrName)}</strong></span>
        <span>•</span>
        <span>Total Community: <strong>${s.total} Devotees</strong></span>
      </div>
    </div>
    <div class="prabhupada-frame">
      <img src="${BACE_PRABHUPADA_SRC}" alt="Srila Prabhupada">
    </div>
  </div>

  <div class="grid-4">
    <div class="kpi-card" style="border-top-color:#10b981">
      <div class="kpi-title">Care Coverage</div>
      <div class="kpi-val">${pct(s.covered, s.total)}%</div>
      <div class="kpi-sub">${s.covered} of ${s.total} with Facilitator</div>
    </div>
    <div class="kpi-card" style="border-top-color:#06b6d4">
      <div class="kpi-title">Group Membership</div>
      <div class="kpi-val">${pct(DB.devotees.filter(d=>d.careGroup).length, s.total)}%</div>
      <div class="kpi-sub">${DB.devotees.filter(d=>d.careGroup).length} in Active Care Groups</div>
    </div>
    <div class="kpi-card" style="border-top-color:#8b5cf6">
      <div class="kpi-title">Friend Pairing</div>
      <div class="kpi-val">${pct(DB.devotees.filter(d=>d.friends.length).length, s.total)}%</div>
      <div class="kpi-sub">${DB.devotees.filter(d=>d.friends.length).length} devotees paired</div>
    </div>
    <div class="kpi-card" style="border-top-color:#f59e0b">
      <div class="kpi-title">Follow-up Completion</div>
      <div class="kpi-val">${pct(DB.followups.filter(f=>f.kind==='Care'&&f.status==='Completed').length, DB.followups.filter(f=>f.kind==='Care').length)}%</div>
      <div class="kpi-sub">${DB.followups.filter(f=>f.kind==='Care'&&f.status==='Completed').length} completed tasks</div>
    </div>
  </div>

  <div class="sec-title">
    <span>Active Care Groups Summary (${g.length})</span>
    <span style="font-size:10.5px;font-weight:500;color:#64748b">Weekly attendance &amp; meeting status</span>
  </div>
  <table class="tbl">
    <thead>
      <tr>
        <th>Care Group Name</th>
        <th>Leader</th>
        <th>Facilitator</th>
        <th>Members</th>
        <th>Avg Attendance</th>
        <th>Last Meeting</th>
        <th>Next Meeting</th>
      </tr>
    </thead>
    <tbody>
      ${g.map(x => `
        <tr>
          <td><b>${esc(x.name)}</b></td>
          <td>${esc(nameOf(x.leader))}</td>
          <td>${esc(nameOf(x.facilitator))}</td>
          <td>${x.members.length}</td>
          <td><span class="badge ${x.attendance >= 80 ? 'badge-green' : 'badge-teal'}">${x.attendance}%</span></td>
          <td>${fmtD(x.last)}</td>
          <td>${fmtD(x.next)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="grid-2">
    <div class="info-card">
      <div class="sec-title" style="margin-top:0">🌸 Emotional Care Overview</div>
      <div style="font-size:11px;line-height:1.6">
        <div>• <b>Care Circles:</b> ${g.length} active weekly care groups meeting regularly.</div>
        <div>• <b>Devotee Friendships:</b> ${DB.devotees.filter(d=>d.friends.length).length} devotees paired with close spiritual friends.</div>
        <div>• <b>Swabhav Alignment:</b> ${DB.devotees.filter(d=>d.swabhav?.engaged).length} devotees successfully engaged in seva matching their psychophysical nature.</div>
        <div>• <b>Unallocated Devotees:</b> ${DB.devotees.filter(d=>!d.dept&&d.status!=='Inactive').length} devotees waiting for seva assignment.</div>
      </div>
    </div>
    <div class="info-card">
      <div class="sec-title" style="margin-top:0">❤️ Spiritual Care Overview</div>
      <div style="font-size:11px;line-height:1.6">
        <div>• <b>Facilitators:</b> ${s.facilitators} appointed mentors providing personal spiritual guidance.</div>
        <div>• <b>Sadhana Reporting:</b> ${DB.sadhana.length} devotees submitting regular japa and rising reports.</div>
        <div>• <b>16 Rounds Chanting:</b> ${DB.sadhana.filter(r=>r.rounds>=16).length} devotees consistently chanting 16 rounds.</div>
        <div>• <b>Yatras &amp; Camps:</b> ${DB.camps.length} camp participations recorded across the community.</div>
        <div>• <b>Scheduled Meetings:</b> ${s.careWeek} care follow-ups scheduled for this week.</div>
      </div>
    </div>
  </div>

  <div style="font-size:10px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:6px;display:flex;justify-content:space-between;margin-top:10px">
    <span>ISKCON BACE Jia Sarai · Confidential Devotee Care Report</span>
    <span>Generated automatically from live BACE records</span>
  </div>
</body>
</html>`;

  const win = window.open('', '_blank');
  if(win){
    win.document.open();
    win.document.write(printDoc);
    win.document.close();
  } else {
    toast('Popup blocker prevented opening the report preview','⚠️');
  }
}