function exportMorningPeriodReportPDF(periodType) {
  if (!APP.morningData) {
    toast('No morning program data loaded', '⚠️');
    return;
  }
  const isWeekly = periodType === 'weekly';
  const pData = isWeekly ? APP.morningData.weekly : APP.morningData.monthly;
  if (!pData || !pData.devStats || !pData.devStats.length) {
    toast('No period statistics available', '⚠️');
    return;
  }

  const periodTitle = isWeekly ? 'Weekly' : 'Monthly';
  const activeDevs = pData.devStats.filter(d => d.presentCount > 0);
  const starDevs = pData.devStats.filter(d => d.attendanceRate >= 80);

  // Apply current active filters and sorting so PDF matches what's visible on screen
  const visibleDevs = filterAndSortMorningPeriodDevs(
    pData.devStats,
    APP.morningSearch || '',
    APP.morningAttFilter || '',
    APP.morningPuncFilter || '',
    APP.morningSort || 'att_desc'
  );

  const printDoc = `<\!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Morning_Programme_${periodTitle}_Report_${pData.startDate}_${pData.endDate}</title>
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
      line-height: 1.4;
      box-shadow: 0 10px 30px rgba(0,0,0,0.25);
    }
    .no-print-bar {
      background: #0f172a;
      color: #f8fafc;
      padding: 10px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: -12mm -15mm 14px -15mm;
      font-size: 13px;
      font-weight: 600;
    }
    .btn-print {
      background: #ea580c;
      color: #ffffff;
      border: none;
      padding: 6px 14px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      font-size: 12px;
    }
    .btn-close {
      background: #334155;
      color: #cbd5e1;
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      margin-left: 8px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #ea580c;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .org-title {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      font-weight: 700;
      color: #ea580c;
      margin-bottom: 2px;
    }
    .report-title {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 3px;
    }
    .report-sub {
      font-size: 11px;
      color: #64748b;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 14px;
    }
    .kpi-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
    }
    .kpi-title {
      font-size: 10px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
    }
    .kpi-val {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      margin: 3px 0;
    }
    .kpi-sub {
      font-size: 9.5px;
      color: #64748b;
    }
    .analytics-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 14px;
    }
    .analytics-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
    }
    .analytics-head {
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    .breakdown-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
      font-size: 10.5px;
      border-bottom: 1px dashed #f1f5f9;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }
    th {
      background: #f1f5f9;
      color: #475569;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 7px 8px;
      border-top: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
      text-align: left;
    }
    td {
      padding: 6px 8px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 10.5px;
      color: #1e293b;
    }
    tr:nth-child(even) td {
      background: #fafafa;
    }
    .pill {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 12px;
      font-size: 9.5px;
      font-weight: 700;
    }
    .pill-green { background: #dcfce7; color: #15803d; }
    .pill-amber { background: #fef3c7; color: #b45309; }
    .pill-red { background: #fee2e2; color: #b91c1c; }
    .pill-grey { background: #f1f5f9; color: #64748b; }
    .footer {
      margin-top: 16px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #94a3b8;
      font-size: 9.5px;
    }
    @media print {
      body { margin: 0; padding: 0; box-shadow: none; width: 100%; max-width: none; }
      .no-print-bar { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div><strong>ISKCON Jia Sarai BACE</strong> — ${periodTitle} Morning Attendance Report Preview</div>
    <div>
      <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
      <button class="btn-close" onclick="window.close()">✕ Close</button>
    </div>
  </div>

  <div class="header">
    <div>
      <div class="org-title">ISKCON Jia Sarai · BACE Preaching & Sadhana Ministry</div>
      <h1 class="report-title">🌅 Morning Programme ${periodTitle} Attendance Report</h1>
      <div class="report-sub">Sessions Range: <b>${fmtExactDate(pData.startDate)} → ${fmtExactDate(pData.endDate)}</b> (${pData.totalSessions} Sessions Logged)</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:10px;color:#64748b">Report Generated:</div>
      <div style="font-weight:700;color:#0f172a">${fmtExactDate(iso(TODAY))}</div>
    </div>
  </div>

  <!-- Executive KPIs -->
  <div class="kpi-grid">
    <div class="kpi-card" style="border-left:3px solid #ea580c">
      <div class="kpi-title">Devotees Logged</div>
      <div class="kpi-val">${pData.devStats.length}</div>
      <div class="kpi-sub">${activeDevs.length} active attendees</div>
    </div>
    <div class="kpi-card" style="border-left:3px solid #10b981">
      <div class="kpi-title">${periodTitle} Attendance</div>
      <div class="kpi-val">${pData.avgAttendancePct}%</div>
      <div class="kpi-sub">${pData.totalAttended} / ${pData.totalPossible} check-ins</div>
    </div>
    <div class="kpi-card" style="border-left:3px solid #3b82f6">
      <div class="kpi-title">${periodTitle} Punctuality</div>
      <div class="kpi-val">${pData.avgPunctualityPct}%</div>
      <div class="kpi-sub">${pData.totalOnTime + pData.totalGrace} on-time sessions</div>
    </div>
    <div class="kpi-card" style="border-left:3px solid #f59e0b">
      <div class="kpi-title">Star Sadhakas (≥80%)</div>
      <div class="kpi-val">${starDevs.length}</div>
      <div class="kpi-sub">consistent regular attendees</div>
    </div>
  </div>

  <!-- Visual Breakdown Summaries -->
  <div class="analytics-grid">
    <div class="analytics-card">
      <div class="analytics-head">🎯 Punctuality Breakdown</div>
      <div class="breakdown-row">
        <span>🟢 On Time (≤ 04:30 AM)</span>
        <b>${pData.totalOnTime} (${pData.totalAttended > 0 ? Math.round((pData.totalOnTime/pData.totalAttended)*100) : 0}%)</b>
      </div>
      <div class="breakdown-row">
        <span>🟡 Grace (04:30–05:30 AM)</span>
        <b>${pData.totalGrace} (${pData.totalAttended > 0 ? Math.round((pData.totalGrace/pData.totalAttended)*100) : 0}%)</b>
      </div>
      <div class="breakdown-row">
        <span>🔴 Late (05:30–07:00 AM)</span>
        <b>${pData.totalLate} (${pData.totalAttended > 0 ? Math.round((pData.totalLate/pData.totalAttended)*100) : 0}%)</b>
      </div>
      <div class="breakdown-row">
        <span>🟣 Very late (> 07:00 AM)</span>
        <b>${pData.totalVeryLate || 0} (${pData.totalAttended > 0 ? Math.round(((pData.totalVeryLate||0)/pData.totalAttended)*100) : 0}%)</b>
      </div>
      <div class="breakdown-row" style="border-bottom:none;font-weight:700">
        <span>⚪ Absent (Missed Sessions)</span>
        <b>${pData.totalAbsent} (${pData.totalPossible > 0 ? Math.round((pData.totalAbsent/pData.totalPossible)*100) : 0}%)</b>
      </div>
    </div>

    <div class="analytics-card">
      <div class="analytics-head">📈 Arrival Distribution Timeline</div>
      ${(pData.buckets || []).map(b => `
        <div class="breakdown-row">
          <span style="font-weight:600">${b.label} <small style="color:#64748b">(${b.sub || 'Arrival'})</small></span>
          <span class="pill" style="background:#f1f5f9;color:#0f172a">${b.count} check-ins</span>
        </div>
      `).join('')}
    </div>
  </div>

  <!-- Detailed Devotee Table -->
  <div style="font-size:12px;font-weight:700;color:#0f172a;margin-bottom:4px;display:flex;justify-content:space-between">
    <span>📋 Devotee Attendance & Punctuality Register (${visibleDevs.length} Devotees Listed)</span>
    <span style="font-size:10px;color:#64748b">Denominator: ${pData.totalSessions} Sessions</span>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:4%;text-align:center">#</th>
        <th style="width:26%">Devotee Name</th>
        <th style="width:10%;text-align:center">Standard</th>
        <th style="width:12%;text-align:center">Days Present</th>
        <th style="width:8%;text-align:center">On Time</th>
        <th style="width:8%;text-align:center">Grace</th>
        <th style="width:8%;text-align:center">Late</th>
        <th style="width:8%;text-align:center">Absent</th>
        <th style="width:12%;text-align:center">Attendance %</th>
        <th style="width:12%;text-align:center">Punctuality %</th>
      </tr>
    </thead>
    <tbody>
      ${visibleDevs.map((d, i) => `
        <tr>
          <td style="text-align:center;color:#64748b;font-weight:600">${i + 1}</td>
          <td>
            <b>${esc(d.name)}</b>
            <div style="font-size:9.5px;color:#64748b">${esc(d.appointment)}</div>
          </td>
          <td style="text-align:center;font-family:monospace;font-weight:600">${d.standardTime}</td>
          <td style="text-align:center"><b>${d.presentCount}</b> / ${pData.totalSessions}</td>
          <td style="text-align:center;color:#15803d;font-weight:700">${d.onTimeCount}</td>
          <td style="text-align:center;color:#b45309;font-weight:600">${d.graceCount}</td>
          <td style="text-align:center;color:${d.lateCount > 0 ? '#b91c1c' : '#64748b'};${d.lateCount > 0 ? 'font-weight:700' : ''}">${d.lateCount}</td>
          <td style="text-align:center;color:${d.absentCount > 0 ? '#b91c1c' : '#64748b'};${d.absentCount > 0 ? 'font-weight:700' : ''}">${d.absentCount}</td>
          <td style="text-align:center">
            <span class="pill ${d.attendanceRate >= 80 ? 'pill-green' : (d.attendanceRate >= 50 ? 'pill-amber' : 'pill-red')}">${d.attendanceRate}%</span>
          </td>
          <td style="text-align:center">
            <span class="pill ${d.punctualityRate >= 80 ? 'pill-green' : (d.punctualityRate >= 50 ? 'pill-amber' : 'pill-red')}">${d.punctualityRate}%</span>
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <div>ISKCON Jia Sarai · BACE Management System</div>
    <div>Official ${periodTitle} Sadhana & Attendance Documentation · Confidential</div>
  </div>
<\/body>
<\/html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.open();
    win.document.write(printDoc);
    win.document.close();
  } else {
    toast('Popup blocker prevented opening the report preview', '⚠️');
  }
}