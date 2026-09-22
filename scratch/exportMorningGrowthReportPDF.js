function exportMorningGrowthReportPDF() {
  if (!APP.morningData) {
    toast('No morning program data loaded', '⚠️');
    return;
  }
  const isWeekly = (APP.morningProgressPeriod || 'weekly') === 'weekly';
  const pData = isWeekly ? APP.morningData.weekly : APP.morningData.monthly;
  if (!pData || !pData.devStats || !pData.devStats.length) {
    toast('No progress data available', '⚠️');
    return;
  }

  const curPeriodName = isWeekly ? 'This Week' : 'This Month';
  const prevPeriodName = isWeekly ? 'Previous Week' : 'Previous Month';
  const list = filterAndSortMorningProgressDevs(
    pData.devStats,
    APP.morningProgressSearch || '',
    APP.morningProgressGrowthFilter || '',
    APP.morningProgressPunctFilter || '',
    APP.morningProgressSort || 'growth_desc'
  );

  const improvedCount = list.filter(d => d.punctualityGrowthDelta > 0).length;
  const dippedCount = list.filter(d => d.punctualityGrowthDelta < 0).length;
  const steadyCount = list.filter(d => d.punctualityGrowthDelta === 0).length;

  const printDoc = `<\!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Devotees_Progress_Growth_Report_${isWeekly ? 'WoW' : 'MoM'}_${iso(TODAY)}</title>
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
      padding: 8px;
      border-top: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
      text-align: left;
    }
    td {
      padding: 7px 8px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 10.5px;
      color: #1e293b;
    }
    tr:nth-child(even) td {
      background: #fafafa;
    }
    .pill {
      display: inline-block;
      padding: 3px 8px;
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
    <div><strong>ISKCON Jia Sarai BACE</strong> — Devotees Progress & Percentage Growth Preview</div>
    <div>
      <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
      <button class="btn-close" onclick="window.close()">✕ Close</button>
    </div>
  </div>

  <div class="header">
    <div>
      <div class="org-title">ISKCON Jia Sarai · BACE Sadhana & Personal Growth Tracking</div>
      <h1 class="report-title">🏆 Devotees Progress & Growth Report (${isWeekly ? 'Week-over-Week' : 'Month-over-Month'})</h1>
      <div class="report-sub">Tracking attendance growth delta & punctuality improvements · Generated on ${fmtExactDate(iso(TODAY))}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:10px;color:#64748b">Comparison Period:</div>
      <div style="font-weight:700;color:#0f172a">${curPeriodName} vs ${prevPeriodName}</div>
    </div>
  </div>

  <!-- Executive KPIs -->
  <div class="kpi-grid">
    <div class="kpi-card" style="border-left:3px solid #ea580c">
      <div class="kpi-title">Devotees Tracked</div>
      <div class="kpi-val">${list.length}</div>
      <div class="kpi-sub">active sadhakas evaluated</div>
    </div>
    <div class="kpi-card" style="border-left:3px solid #10b981">
      <div class="kpi-title">Improving Devotees</div>
      <div class="kpi-val">${improvedCount}</div>
      <div class="kpi-sub">positive punctuality growth</div>
    </div>
    <div class="kpi-card" style="border-left:3px solid #f59e0b">
      <div class="kpi-title">Steady Performance</div>
      <div class="kpi-val">${steadyCount}</div>
      <div class="kpi-sub">maintained high attendance</div>
    </div>
    <div class="kpi-card" style="border-left:3px solid #ef4444">
      <div class="kpi-title">Needs Attention</div>
      <div class="kpi-val">${dippedCount}</div>
      <div class="kpi-sub">requires pastoral follow-up</div>
    </div>
  </div>

  <!-- Growth Table -->
  <div style="font-size:12px;font-weight:700;color:#0f172a;margin-bottom:4px">
    📊 Sadhana Performance & Growth Matrix (${list.length} Devotees)
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:24%">Devotee Name</th>
        <th style="width:10%;text-align:center">Standard</th>
        <th style="width:12%;text-align:center">Days Present</th>
        <th style="width:13%;text-align:center">${curPeriodName} Punctuality</th>
        <th style="width:13%;text-align:center">${prevPeriodName} Punctuality</th>
        <th style="width:14%;text-align:center">${isWeekly ? 'WoW Growth %' : 'MoM Growth %'}</th>
        <th style="width:14%;text-align:center">Status Badge</th>
      </tr>
    </thead>
    <tbody>
      ${list.map(p => {
        const delta = p.punctualityGrowthDelta;
        const deltaSign = delta > 0 ? '+' : '';
        const deltaPill = delta > 0 ? 'pill-green' : (delta < 0 ? 'pill-red' : 'pill-grey');
        const isFollowUp = (p.statusBadge || '').includes('Follow-up');
        const isExemplary = (p.statusBadge || '').includes('Exemplary');
        const badgePill = isFollowUp ? 'pill-amber' : (isExemplary ? 'pill-green' : 'pill-grey');

        return `
          <tr>
            <td>
              <b>${esc(p.name)}</b>
              <div style="font-size:9.5px;color:#64748b">${esc(p.appointment)}</div>
            </td>
            <td style="text-align:center;font-family:monospace;font-weight:600">${p.standardTime}</td>
            <td style="text-align:center"><b>${p.presentCount}</b> / ${pData.totalSessions}</td>
            <td style="text-align:center">
              <b style="color:${p.punctualityRate >= 80 ? '#15803d' : (p.punctualityRate >= 60 ? '#b45309' : '#b91c1c')}">${p.punctualityRate}%</b>
            </td>
            <td style="text-align:center;color:#64748b">${p.prevPunctualityRate}%</td>
            <td style="text-align:center">
              <span class="pill ${deltaPill}">${delta > 0 ? `+${delta}% ↗` : (delta < 0 ? `${delta}% ↘` : '0% —')}</span>
            </td>
            <td style="text-align:center">
              <span class="pill ${badgePill}">${p.statusBadge}</span>
            </td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <div class="footer">
    <div>ISKCON Jia Sarai · BACE Management System</div>
    <div>Sadhana & Punctuality Growth Document · For Facilitator & Mentor Review</div>
  </div>
<\/body>
<\/html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.open();
    win.document.write(printDoc);
    win.document.close();
  } else {
    toast('Popup blocker prevented opening the growth report preview', '⚠️');
  }
}