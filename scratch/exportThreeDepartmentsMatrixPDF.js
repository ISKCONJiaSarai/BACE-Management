function exportThreeDepartmentsMatrixPDF(period = 'weekly') {
  initDepartmentRosters();
  const data = getAshramThreeDepartmentsSummary(period);
  const list = data.summaryList;
  const kpis = data.stats;
  const periodTitle = period === 'weekly' ? 'Weekly View (Last 7 Days)' : 'Monthly View (Last 30 Days)';
  const days = Array.from({length: 7}, (_, i) => dayOff(-6 + i));

  const printDoc = `<\!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>3-Department Seva Summary Matrix - ${periodTitle} - ISKCON Jia Sarai BACE</title>
  <style>
    @page { size: landscape; margin: 10mm 12mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 16px; background: #fff; }
    .no-print-bar { display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #cbd5e1; padding: 10px 16px; border-radius: 8px; margin-bottom: 16px; }
    .btn-print { background: #ea580c; color: white; border: none; padding: 8px 18px; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 13px; }
    .btn-close { background: #e2e8f0; color: #334155; border: none; padding: 8px 14px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px; margin-left: 8px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #ea580c; padding-bottom: 12px; margin-bottom: 16px; }
    .org-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #ea580c; letter-spacing: 0.5px; }
    .report-title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 3px 0 2px; }
    .report-sub { font-size: 12px; color: #475569; }
    .period-badge { display: inline-block; background: #ffedd5; color: #c2410c; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
    .kpi-card { background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 8px; padding: 10px 14px; }
    .kpi-title { font-size: 10.5px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 2px; }
    .kpi-val { font-size: 24px; font-weight: 800; color: #0f172a; line-height: 1.1; }
    .kpi-sub { font-size: 10.5px; color: #64748b; margin-top: 2px; }
    .tbl { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11px; }
    .tbl th { background: #f1f5f9; color: #334155; text-align: left; padding: 8px 10px; font-size: 10.5px; border-bottom: 1px solid #cbd5e1; text-transform: uppercase; letter-spacing: 0.3px; }
    .tbl td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
    .tbl tr:nth-child(even) { background: #fafafa; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; }
    .b-green { background: #dcfce7; color: #15803d; }
    .b-blue { background: #dbeafe; color: #1d4ed8; }
    .b-indigo { background: #e0e7ff; color: #4338ca; }
    .b-teal { background: #ccfbf1; color: #0f766e; }
    .b-amber { background: #fef3c7; color: #b45309; }
    .b-gray { background: #f1f5f9; color: #475569; }
    .bar-wrap { width: 90px; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; display: inline-block; vertical-align: middle; margin-right: 6px; }
    .bar-fill { height: 100%; }
    .footer { display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 10px; color: #64748b; margin-top: 20px; }
    @media print {
      .no-print-bar { display: none !important; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div><strong>ISKCON Jia Sarai BACE</strong> — 3-Department Seva Summary Matrix PDF Preview</div>
    <div>
      <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
      <button class="btn-close" onclick="window.close()">✕ Close</button>
    </div>
  </div>

  <div class="header">
    <div>
      <div class="org-title">ISKCON Jia Sarai · BACE Preaching & Sadhana Ministry</div>
      <h1 class="report-title">🏛️ 3-Department Seva Summary Matrix</h1>
      <div class="report-sub">Unified matrix across <b>Morning Programme</b>, <b>Deity Department</b>, and <b>Cleaning</b> · <span class="period-badge">${periodTitle}</span></div>
    </div>
    <div style="text-align:right">
      <div style="font-size:10px;color:#64748b">Report Generated:</div>
      <div style="font-weight:700;color:#0f172a">${fmtExactDate(iso(TODAY))}</div>
      <div style="font-size:10.5px;color:#ea580c;font-weight:600">Jia Sarai BACE Ashram</div>
    </div>
  </div>

  <!-- Executive KPIs -->
  <div class="kpi-grid">
    <div class="kpi-card" style="border-left:4px solid #ea580c">
      <div class="kpi-title">🌅 Morning Sadhana</div>
      <div class="kpi-val">${kpis.avgMorning}%</div>
      <div class="kpi-sub">average attendance rate</div>
    </div>
    <div class="kpi-card" style="border-left:4px solid #f59e0b">
      <div class="kpi-title">🛕 Deity Seva Health</div>
      <div class="kpi-val">${kpis.avgDeity}%</div>
      <div class="kpi-sub">${kpis.totalDeityDone} / ${kpis.totalDeityAssigned} sevas completed</div>
    </div>
    <div class="kpi-card" style="border-left:4px solid #0d9488">
      <div class="kpi-title">🧹 Cleaning Seva Health</div>
      <div class="kpi-val">${kpis.avgCleaning}%</div>
      <div class="kpi-sub">${kpis.totalCleanDone} / ${kpis.totalCleanAssigned} sevas completed</div>
    </div>
    <div class="kpi-card" style="border-left:4px solid #10b981">
      <div class="kpi-title">✨ All-Rounder Servants</div>
      <div class="kpi-val">${kpis.allRounders} Devotees</div>
      <div class="kpi-sub">active across all 3 depts</div>
    </div>
  </div>

  <!-- Regularity Matrix Table -->
  <div style="margin-bottom:8px;font-size:13px;font-weight:800;color:#0f172a;display:flex;align-items:center;justify-content:space-between">
    <div>📊 Devotee Regularity Matrix (${list.length} Devotees Engaged)</div>
    <div style="font-size:11px;font-weight:normal;color:#64748b">Morning Program · Deity Department · Cleaning</div>
  </div>

  <table class="tbl">
    <thead>
      <tr>
        <th style="width:24%">Devotee Name</th>
        <th style="width:16%;text-align:center">🌅 Morning Program</th>
        <th style="width:17%;text-align:center">🛕 Deity Department</th>
        <th style="width:17%;text-align:center">🧹 Cleaning Department</th>
        <th style="width:14%">✨ Combined Seva Score</th>
        <th style="width:12%;text-align:center">BACE Status</th>
      </tr>
    </thead>
    <tbody>
      ${list.map((d, i) => `
        <tr>
          <td>
            <b>${esc(d.name)}</b>
            <div style="font-size:9.5px;color:#64748b">${esc(d.phone || d.bace)}</div>
          </td>
          <td style="text-align:center">
            ${d.morning && d.morning.present > 0 ? `
              <div style="font-weight:700;color:#0f172a">${d.morning.pct || 0}%</div>
              <div style="font-size:9.5px;color:#64748b">${d.morning.present}/${d.morning.total} days attended</div>
            ` : `
              <div style="font-weight:600;color:#94a3b8">0%</div>
              <div style="font-size:9.5px;color:#94a3b8;font-style:italic">0/${d.morning ? d.morning.total : 0} days</div>
            `}
          </td>
          <td style="text-align:center">
            ${d.deity && d.deity.isAssigned ? `
              <div style="font-weight:700;color:${d.deity.completed>0?'#15803d':'#0f172a'}">${d.deity.completed}/${d.deity.assigned || d.deity.completed} sevas</div>
              <div style="font-size:9.5px;color:#64748b">${d.deity.rate}% reliability${d.deity.missed>0?` · <b style="color:#b91c1c">${d.deity.missed} missed</b>`:''}${d.deity.subs>0?` · <b style="color:#2563eb">+${d.deity.subs} sub</b>`:''}</div>
            ` : `
              <div style="font-weight:600;color:#94a3b8">0/0 sevas</div>
              <div style="font-size:9.5px;color:#94a3b8;font-style:italic">Not assigned</div>
            `}
          </td>
          <td style="text-align:center">
            ${d.cleaning && d.cleaning.isAssigned ? `
              <div style="font-weight:700;color:${d.cleaning.completed>0?'#0f766e':'#0f172a'}">${d.cleaning.completed}/${d.cleaning.assigned || d.cleaning.completed} sevas</div>
              <div style="font-size:9.5px;color:#64748b">${d.cleaning.rate}% reliability${d.cleaning.missed>0?` · <b style="color:#b91c1c">${d.cleaning.missed} missed</b>`:''}${d.cleaning.subs>0?` · <b style="color:#2563eb">+${d.cleaning.subs} sub</b>`:''}</div>
            ` : `
              <div style="font-weight:600;color:#94a3b8">0/0 sevas</div>
              <div style="font-size:9.5px;color:#94a3b8;font-style:italic">Not assigned</div>
            `}
          </td>
          <td>
            <div style="display:flex;align-items:center">
              <div class="bar-wrap">
                <div class="bar-fill" style="width:${d.overallScore}%;background:${d.overallScore>=90?'#15803d':(d.overallScore>=75?'#2563eb':'#d97706')}"></div>
              </div>
              <b style="font-size:11px">${d.overallScore}%</b>
            </div>
          </td>
          <td style="text-align:center">
            <span class="badge ${d.statusClass}">${d.statusText}</span>
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  ${period === 'weekly' ? `
  <div style="margin:16px 0 6px;font-size:12.5px;font-weight:800;color:#0f172a">
    📅 7-Day Cross-Department Operational Timeline
  </div>
  <table class="tbl" style="font-size:10px">
    <thead>
      <tr>
        <th style="width:20%">Department</th>
        ${days.map(d => `<th style="text-align:center">${fmtD(d)}</th>`).join('')}
        <th style="text-align:center">Weekly Average</th>
      </tr>
    </thead>
    <tbody>
      ${(() => {
        let mTotPres = 0, mTotSlots = 0;
        const mCells = days.map(d => {
          const dStr = iso(d);
          const dRows = (APP.morningData && APP.morningData.byDateRows && APP.morningData.byDateRows[dStr]) || [];
          const pres = dRows.filter(r => r.status !== 'Absent').length;
          const tot = dRows.length;
          const p = tot > 0 ? Math.round((pres / tot) * 100) : 0;
          mTotPres += pres;
          mTotSlots += tot;
          return `<td style="text-align:center;font-weight:700;color:#15803d">${p}%</td>`;
        }).join('');
        const mAvg = mTotSlots > 0 ? Math.round((mTotPres / mTotSlots) * 100) : 0;

        let dTotComp = 0, dTotSlots = 0;
        const dCells = days.map(d => {
          const dStr = iso(d);
          let comp = 0, tot = APP.deityRoster.services.length;
          APP.deityRoster.services.forEach(s => {
            const sl = getRosterSlot(APP.deityRoster, dStr, s.id);
            if (sl.status === 'done' || (sl.devotees && sl.devotees.includes('❌'))) comp++;
            else if (dStr > iso(TODAY) && sl.devotees && sl.devotees !== '—') comp++;
          });
          const p = tot > 0 ? Math.round((comp / tot) * 100) : 0;
          dTotComp += comp;
          dTotSlots += tot;
          return `<td style="text-align:center;font-weight:700;color:#ea580c">${p}%</td>`;
        }).join('');
        const dAvg = dTotSlots > 0 ? Math.round((dTotComp / dTotSlots) * 100) : 0;

        let cTotComp = 0, cTotSlots = 0;
        const cCells = days.map(d => {
          const dStr = iso(d);
          let comp = 0, tot = APP.cleaningRoster.services.length;
          APP.cleaningRoster.services.forEach(s => {
            const sl = getRosterSlot(APP.cleaningRoster, dStr, s.id);
            if (sl.status === 'done' || (sl.devotees && sl.devotees.includes('❌'))) comp++;
            else if (dStr > iso(TODAY) && sl.devotees && sl.devotees !== '—') comp++;
          });
          const p = tot > 0 ? Math.round((comp / tot) * 100) : 0;
          cTotComp += comp;
          cTotSlots += tot;
          return `<td style="text-align:center;font-weight:700;color:#0d9488">${p}%</td>`;
        }).join('');
        const cAvg = cTotSlots > 0 ? Math.round((cTotComp / cTotSlots) * 100) : 0;

        return `<tr>
          <td><b>🌅 Morning Program</b></td>
          ${mCells}
          <td style="text-align:center;font-weight:700;color:#15803d">${mAvg}%</td>
        </tr>
        <tr>
          <td><b>🛕 Deity Department</b></td>
          ${dCells}
          <td style="text-align:center;font-weight:700;color:#ea580c">${dAvg}%</td>
        </tr>
        <tr>
          <td><b>🧹 Cleaning Department</b></td>
          ${cCells}
          <td style="text-align:center;font-weight:700;color:#0d9488">${cAvg}%</td>
        </tr>`;
      })()}
    </tbody>
  </table>
  ` : ''}

  <div class="footer">
    <div>ISKCON Jia Sarai · BACE Management System</div>
    <div>Official 3-Department Seva Summary Matrix Documentation · Verified by BACE Preaching Ministry</div>
  </div>
<\/body>
<\/html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.open();
    win.document.write(printDoc);
    win.document.close();
  } else {
    toast('Popup blocker prevented opening the PDF preview', '⚠️');
  }
}