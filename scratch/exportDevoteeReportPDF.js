function exportDevoteeReportPDF(deptKey, period) {
  initDepartmentRosters();
  const repPeriod = period || APP.rosterReportPeriod || 'weekly';
  const isDeity = deptKey === 'deity';
  const deptTitle = isDeity ? 'Deity Department' : 'Cleaning Department';
  const stats = getDepartmentDevoteeStats(deptKey, repPeriod);
  const periodTitle = repPeriod === 'weekly' ? 'Weekly Seva Report (Last 7 Days)' : 'Monthly Seva Report (Last 30 Days)';
  const daysCount = repPeriod === 'weekly' ? 7 : 30;
  const startDate = fmtD(iso(dayOff(-daysCount + 1)));
  const endDate = fmtD(iso(TODAY));

  const totalAssigned = stats.reduce((acc, d) => acc + d.assigned, 0);
  const totalCompleted = stats.reduce((acc, d) => acc + d.completed, 0);
  const totalMissed = stats.reduce((acc, d) => acc + d.missed, 0);
  const totalSubs = stats.reduce((acc, d) => acc + d.substitutions, 0);
  const activeCount = stats.filter(d => d.assigned > 0 || d.completed > 0 || d.substitutions > 0).length;
  const overallRate = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;

  const printDoc = `<\!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>ISKCON_Jia_Sarai_${deptKey}_Devotee_Seva_Report_${repPeriod}_${iso(TODAY)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm;
    }
    * { box-sizing: border-box; }
    html {
      background: #525659;
    }
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
      line-height: 1.4;
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
    .no-print-bar button {
      background: #E06012;
      color: #fff;
      border: none;
      padding: 7px 15px;
      border-radius: 6px;
      font-weight: 700;
      cursor: pointer;
      font-size: 13px;
      margin-left: 8px;
    }
    .no-print-bar button.sec {
      background: #555;
    }
    .header {
      border-bottom: 2.5px solid #E06012;
      padding-bottom: 10px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .title-area h1 {
      margin: 0;
      font-size: 19px;
      color: #E06012;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .title-area h2 {
      margin: 3px 0 0 0;
      font-size: 13.5px;
      color: #222;
      font-weight: 600;
    }
    .title-area .sub {
      font-size: 11px;
      color: #555;
      margin-top: 3px;
    }
    .meta-area {
      text-align: right;
      font-size: 11px;
      color: #555;
    }
    .meta-area b { color: #111; }
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 14px;
    }
    .kpi-box {
      border: 1px solid #E6DAC6;
      border-radius: 6px;
      padding: 8px 10px;
      background: #FAF6F0;
      text-align: center;
    }
    .kpi-box .val {
      font-size: 16px;
      font-weight: 800;
      color: #E06012;
    }
    .kpi-box .lbl {
      font-size: 10px;
      color: #666;
      text-transform: uppercase;
      font-weight: 600;
      margin-top: 2px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 11px;
    }
    th {
      background: #F5A869;
      color: #111;
      font-weight: 700;
      text-align: left;
      padding: 7px 8px;
      border: 1px solid #000;
    }
    th.center, td.center {
      text-align: center;
    }
    td {
      padding: 6px 8px;
      border: 1px solid #222;
      vertical-align: middle;
    }
    tr:nth-child(even) td {
      background: #FAF8F5;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
    }
    .badge-perfect { background: #ECFDF5; color: #059669; border: 1px solid #A7F3D0; }
    .badge-reliable { background: #EFF6FF; color: #2563EB; border: 1px solid #BFDBFE; }
    .badge-followup { background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; }
    .badge-active { background: #F3F4F6; color: #4B5563; border: 1px solid #E5E7EB; }
    .footer {
      margin-top: 20px;
      border-top: 1px solid #DDD;
      padding-top: 10px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #777;
    }
    @media print {
      html, body {
        width: 100% !important;
        max-width: 100% !important;
        min-height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
        box-shadow: none !important;
      }
      .no-print-bar { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <span><b>ISKCON Jia Sarai</b> · ${deptTitle} Individual Devotee Seva Report (${repPeriod === 'weekly' ? 'Weekly' : 'Monthly'})</span>
    <div>
      <button onclick="window.print()">🖨️ Print / Save as PDF</button>
      <button class="sec" onclick="window.close()">✕ Close</button>
    </div>
  </div>

  <div class="header">
    <div class="title-area">
      <h1>ISKCON BACE · JIA SARAI</h1>
      <h2>${deptTitle} — Individual Devotee Seva Report</h2>
      <div class="sub"><b>Period:</b> ${periodTitle} (${startDate} – ${endDate})</div>
    </div>
    <div class="meta-area">
      <div><b>Generated:</b> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}</div>
      <div><b>Period View:</b> ${repPeriod === 'weekly' ? 'Weekly (7 Days)' : 'Monthly (30 Days)'}</div>
      <div><b>Status:</b> Official Temple Record</div>
    </div>
  </div>

  <div class="kpi-row">
    <div class="kpi-box">
      <div class="val">${activeCount} / ${stats.length}</div>
      <div class="lbl">Active Servants</div>
    </div>
    <div class="kpi-box">
      <div class="val">${totalAssigned}</div>
      <div class="lbl">Services Assigned</div>
    </div>
    <div class="kpi-box">
      <div class="val" style="color:#059669">${totalCompleted}</div>
      <div class="lbl">Services Completed</div>
    </div>
    <div class="kpi-box">
      <div class="val" style="color:${overallRate>=85?'#059669':'#D97706'}">${overallRate}%</div>
      <div class="lbl">Overall Reliability</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:5%;text-align:center">#</th>
        <th style="width:35%">Devotee Name</th>
        <th style="width:12%;text-align:center">Services Taken</th>
        <th style="width:12%;text-align:center">Completed</th>
        <th style="width:10%;text-align:center">Missed</th>
        <th style="width:11%;text-align:center">Substitutions</th>
        <th style="width:15%;text-align:center">Reliability</th>
      </tr>
    </thead>
    <tbody>
      ${stats.map((d, i) => {
        const statusBadge = d.rate === 100 && d.completed >= 3
          ? '<span class="badge badge-perfect">🌟 100% Perfect</span>'
          : (d.rate >= 85
            ? '<span class="badge badge-reliable">✅ ' + d.rate + '% Reliable</span>'
            : (d.missed > 0
              ? '<span class="badge badge-followup">⚠️ ' + d.rate + '% Needs Follow-up</span>'
              : '<span class="badge badge-active">' + d.rate + '% Active</span>'));

        return `<tr>
          <td class="center" style="font-weight:600;color:#666">${i + 1}</td>
          <td><b>${esc(d.name)}</b></td>
          <td class="center" style="font-weight:600">${d.assigned}</td>
          <td class="center" style="font-weight:700;color:#059669">${d.completed}</td>
          <td class="center" style="color:${d.missed > 0 ? '#DC2626' : '#888'};font-weight:${d.missed > 0 ? '700' : 'normal'}">${d.missed}</td>
          <td class="center">${d.substitutions > 0 ? d.substitutions : '—'}</td>
          <td class="center">${statusBadge}</td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>

  <div class="footer">
    <div>ISKCON BACE Jia Sarai · Community Operating System</div>
    <div>Official Temple Seva Record</div>
  </div>
<\/body>
<\/html>`;

  let printWin = null;
  try {
    printWin = window.open('', '_blank');
  } catch (e) {}

  if (printWin) {
    printWin.document.open();
    printWin.document.write(printDoc);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      try { printWin.print(); } catch(err) {}
    }, 400);
    toast('Opening PDF Print Preview for ' + (repPeriod === 'weekly' ? 'Weekly' : 'Monthly') + ' report...', '📄');
  } else {
    // Fallback: iframe print
    let iframe = document.getElementById('report-print-iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'report-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }
    const doc = iframe.contentWindow ? iframe.contentWindow.document : (iframe.contentDocument || null);
    if (doc) {
      doc.open();
      doc.write(printDoc);
      doc.close();
      setTimeout(() => {
        if (iframe.contentWindow && iframe.contentWindow.print) {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        }
      }, 500);
    }
    toast('Generating PDF for ' + (repPeriod === 'weekly' ? 'Weekly' : 'Monthly') + ' report...', '📄');
  }
}