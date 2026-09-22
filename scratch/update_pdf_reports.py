# -*- coding: utf-8 -*-
import io, sys, re, shutil

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

src_path = 'public/index.html'
backup_path = 'public/index.html.bak'

print('Backing up public/index.html to public/index.html.bak...')
shutil.copyfile(src_path, backup_path)

with open(src_path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Extract logo and prabhupada declarations
logo_m = re.search(r'(const BACE_LOGO_SRC\s*=\s*[\'"][^\'"]+[\'"];)', text)
prabh_m = re.search(r'(const BACE_PRABHUPADA_SRC\s*=\s*[\'"][^\'"]+[\'"];)', text)

assert logo_m, 'BACE_LOGO_SRC not found'
assert prabh_m, 'BACE_PRABHUPADA_SRC not found'

logo_decl = logo_m.group(1)
prabh_decl = prabh_m.group(1)

# Remove old definitions
text = text[:logo_m.start()] + text[prabh_m.end():]
assert 'const BACE_LOGO_SRC' not in text
assert 'const BACE_PRABHUPADA_SRC' not in text
print('Removed old BACE_LOGO_SRC and BACE_PRABHUPADA_SRC declarations.')

# 2. Build standard header helper string
header_helper = f"""
{logo_decl}
{prabh_decl}
if (typeof window !== 'undefined') {{
  window.BACE_LOGO_SRC = BACE_LOGO_SRC;
  window.BACE_PRABHUPADA_SRC = BACE_PRABHUPADA_SRC;
}}

function getStandardReportHTMLHeader({{
  reportDocTitle,
  kicker = 'ISKCON BACE, JIA SARAI',
  title,
  subtitle,
  badges = [],
  metaItems = [],
  isLandscape = false,
  extraCSS = ''
}}) {{
  const logoSrc = (typeof BACE_LOGO_SRC !== 'undefined' && BACE_LOGO_SRC) || (typeof window !== 'undefined' && window.BACE_LOGO_SRC) || 'logo.png';
  const prabhupadaSrc = (typeof BACE_PRABHUPADA_SRC !== 'undefined' && BACE_PRABHUPADA_SRC) || (typeof window !== 'undefined' && window.BACE_PRABHUPADA_SRC) || 'prabhupada.png';
  const orientation = isLandscape ? 'landscape' : 'portrait';
  const pageWidth = isLandscape ? '297mm' : '210mm';
  const pageMinHeight = isLandscape ? '210mm' : '297mm';
  const rawTitle = title ? title.replace(/<[^>]*>/g, '') : 'Report';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${{reportDocTitle || rawTitle}}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {{
      size: A4 ${{orientation}};
      margin: 10mm 12mm 12mm 12mm;
    }}
    * {{ box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }}
    html {{ background: #334155; }}
    body {{
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      color: #0f172a;
      width: ${{pageWidth}};
      max-width: ${{pageWidth}};
      min-height: ${{pageMinHeight}};
      margin: 20px auto;
      padding: 12mm 15mm;
      background: #ffffff;
      font-size: 11px;
      line-height: 1.45;
      box-shadow: 0 16px 40px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.06);
    }}
    h1, h2, h3, .report-title, .section-title, .stat-card .val, .kpi-val {{ font-family: 'Outfit', sans-serif; }}
    .no-print-bar {{
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
    }}
    .btn-print {{
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
    }}
    .btn-print:hover {{ background: #c2410c; }}
    .btn-close {{
      background: transparent;
      color: #94a3b8;
      border: 1px solid #475569;
      padding: 7px 14px;
      border-radius: 7px;
      cursor: pointer;
      font-size: 12px;
      margin-left: 8px;
    }}
    .btn-close:hover {{ color: #fff; border-color: #cbd5e1; }}

    /* 3D Header Grid: Left Logo Plate | Centered Title & Badges | Right Prabhupada Image */
    .header-grid {{
      display: grid;
      grid-template-columns: 80px 1fr 80px;
      align-items: center;
      gap: 12px;
      margin-bottom: 10px;
    }}
    .header-left {{
      display: flex;
      justify-content: flex-start;
      align-items: center;
    }}
    .logo-3d-plate {{
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
    }}
    .logo-3d-plate img {{
      width: 100%;
      height: 100%;
      object-fit: contain;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6));
    }}
    .header-center {{
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }}
    .org-kicker {{
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #ea580c;
      margin-bottom: 3px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }}
    .report-title {{
      font-size: 24px;
      font-weight: 900;
      color: #0f172a;
      margin: 0 0 5px 0;
      letter-spacing: -0.025em;
      line-height: 1.2;
      text-align: center;
      text-shadow: 0 1px 2px rgba(0,0,0,0.06);
    }}
    .report-subtitle {{
      font-size: 11.5px;
      font-weight: 600;
      color: #475569;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      flex-wrap: wrap;
    }}
    .header-right {{
      display: flex;
      justify-content: flex-end;
      align-items: center;
    }}
    .prabhupada-frame {{
      display: flex;
      align-items: center;
      justify-content: center;
    }}
    .prabhupada-frame img {{
      height: 82px;
      width: auto;
      object-fit: contain;
      filter: drop-shadow(0 6px 14px rgba(0,0,0,0.22));
    }}

    /* 3D Badges */
    .level-badge {{
      display: inline-block;
      padding: 3px 9px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 800;
      background: linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%);
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      box-shadow: 0 2px 4px rgba(29,78,216,0.12);
    }}
    .active-badge {{
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
    }}

    /* 3D Gradient Divider */
    .header-divider {{
      height: 4px;
      background: linear-gradient(90deg, #ea580c 0%, #f97316 35%, #fbbf24 75%, #6366f1 100%);
      border-radius: 4px;
      margin: 8px 0 14px 0;
      box-shadow: 0 2px 5px rgba(234,88,12,0.25);
    }}

    /* 3D Metadata Ribbon */
    .meta-box {{
      background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 9px 14px;
      margin-bottom: 14px;
      display: grid;
      grid-template-columns: repeat(${{metaItems && metaItems.length ? metaItems.length : 5}}, 1fr);
      gap: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02);
    }}
    .meta-item span {{
      display: block;
      color: #64748b;
      font-size: 9.5px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 800;
    }}
    .meta-item b {{
      display: block;
      font-size: 12px;
      color: #0f172a;
      margin-top: 2px;
      font-weight: 800;
    }}

    /* 3D Section Headings */
    .section-title, .sec-title {{
      font-size: 12.5px;
      font-weight: 800;
      color: #1e293b;
      margin: 14px 0 7px 0;
      display: flex;
      align-items: center;
      gap: 6px;
      letter-spacing: -0.01em;
      text-shadow: 0 1px 1px rgba(0,0,0,0.04);
    }}

    /* 3D Metrics Grid */
    .stats-grid, .kpi-grid, .kpi-row, .grid-4 {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 8px;
      margin-bottom: 14px;
    }}
    .stat-card, .kpi-card, .kpi-box {{
      background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 9px 8px;
      text-align: center;
      box-shadow: 0 4px 10px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.8);
    }}
    .stat-card .val, .kpi-card .kpi-val, .kpi-box .val, .kpi-val {{
      font-size: 17.5px;
      font-weight: 900;
      color: #0f172a;
      line-height: 1.15;
      margin-top: 2px;
      text-shadow: 0 1px 1px rgba(0,0,0,0.05);
    }}
    .stat-card .lbl, .kpi-card .kpi-title, .kpi-box .lbl, .kpi-title {{
      font-size: 9px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      font-weight: 800;
    }}
    .kpi-sub {{
      font-size: 9.5px;
      color: #64748b;
      margin-top: 2px;
    }}

    /* 3D Table Box */
    .table-box, .tbl-box {{
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 14px;
      box-shadow: 0 6px 16px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02);
    }}
    table, .tbl {{
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
    }}
    th {{
      background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
      color: #475569;
      font-weight: 800;
      text-align: left;
      padding: 7px 10px;
      border-bottom: 1.5px solid #cbd5e1;
      font-size: 9.5px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }}
    td {{
      padding: 6px 10px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }}
    tr:last-child td {{ border-bottom: none; }}
    tr:nth-child(even) td {{ background: #fafafa; }}
    .att-pill, .pill, .badge {{
      display: inline-block;
      padding: 2.5px 8px;
      border-radius: 10px;
      font-weight: 800;
      font-size: 10px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }}
    .att-high, .pill-green, .badge-green, .badge-perfect {{ background: linear-gradient(180deg, #dcfce7, #bbf7d0); color: #15803d; border: 1px solid #86efac; }}
    .att-mid, .pill-amber, .badge-teal, .badge-reliable {{ background: linear-gradient(180deg, #fef3c7, #fde68a); color: #b45309; border: 1px solid #fcd34d; }}
    .att-low, .pill-red, .badge-followup {{ background: linear-gradient(180deg, #fee2e2, #fecaca); color: #b91c1c; border: 1px solid #fca5a5; }}
    .pill-grey, .badge-active, .badge-gray {{ background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; }}

    .footer {{
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      font-size: 9.5px;
      color: #64748b;
      margin-top: 14px;
    }}

    @media print {{
      body {{
        margin: 0;
        padding: 0;
        box-shadow: none;
        width: 100%;
        max-width: none;
      }}
      .no-print-bar {{ display: none !important; }}
    }}
    ${{extraCSS}}
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div><strong>ISKCON BACE, Jia Sarai</strong> — ${{rawTitle}} Preview</div>
    <div>
      <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
      <button class="btn-close" onclick="window.close()">✕ Close Preview</button>
    </div>
  </div>

  <div class="header-grid">
    <div class="header-left">
      <div class="logo-3d-plate" title="ISKCON BACE Logo">
        <img src="${{logoSrc}}" alt="ISKCON Logo">
      </div>
    </div>
    <div class="header-center">
      <div class="org-kicker">${{kicker}}</div>
      <h1 class="report-title">${{title}}</h1>
      <div class="report-subtitle">
        ${{subtitle ? `<span>${{subtitle}}</span>` : ''}}
        ${{badges && badges.length ? `<span style="opacity:0.35">|</span>` + badges.map(b => `<span class="${{b.cls || 'level-badge'}}">${{b.text}}</span>`).join(' ') : ''}}
      </div>
    </div>
    <div class="header-right">
      <div class="prabhupada-frame" title="His Divine Grace A.C. Bhaktivedanta Swami Prabhupada">
        <img src="${{prabhupadaSrc}}" alt="His Divine Grace A.C. Bhaktivedanta Swami Prabhupada">
      </div>
    </div>
  </div>

  <div class="header-divider"></div>

  ${{metaItems && metaItems.length ? `
  <div class="meta-box">
    ${{metaItems.map(m => `<div class="meta-item"><span>${{m.label}}</span><b>${{m.val}}</b></div>`).join('')}}
  </div>` : ''}}
`;
}}
"""

# Insert header helper right before exportMorningPeriodReportPDF
m_start = text.find('function exportMorningPeriodReportPDF')
assert m_start != -1, 'exportMorningPeriodReportPDF not found'
text = text[:m_start] + header_helper + '\n\n' + text[m_start:]
print('Inserted header helper before exportMorningPeriodReportPDF.')

def replace_function(content, func_name, new_code):
    m = re.search(r'function\s+' + func_name + r'\s*\([^)]*\)\s*\{', content)
    assert m, f'Function {func_name} not found'
    start = m.start()
    idx = m.end() - 1
    depth = 0
    end = -1
    for i in range(idx, len(content)):
        if content[i] == '{':
            depth += 1
        elif content[i] == '}':
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    assert end != -1, f'Could not find closing brace for {func_name}'
    return content[:start] + new_code.strip() + content[end:]

# 3. New implementations for each of the 6 functions

fn_morning_period = """
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

  const visibleDevs = filterAndSortMorningPeriodDevs(
    pData.devStats,
    APP.morningSearch || '',
    APP.morningAttFilter || '',
    APP.morningPuncFilter || '',
    APP.morningSort || 'att_desc'
  );

  const startDateFormatted = fmtExactDate(pData.startDate);
  const endDateFormatted = fmtExactDate(pData.endDate);

  const headerHTML = getStandardReportHTMLHeader({
    reportDocTitle: `Morning_Programme_${periodTitle}_Report_${pData.startDate}_${pData.endDate}`,
    kicker: 'ISKCON BACE, JIA SARAI',
    title: `🌅 Morning Programme ${periodTitle} Report`,
    subtitle: `🗓️ Duration: ${startDateFormatted} — ${endDateFormatted}`,
    badges: [
      { text: periodTitle, cls: 'level-badge' },
      { text: '• Active Attendance', cls: 'active-badge' }
    ],
    metaItems: [
      { label: 'Reporting Cycle', val: periodTitle },
      { label: 'Date Range', val: `${pData.startDate} — ${pData.endDate}` },
      { label: 'Total Sessions', val: `${pData.totalSessions} Sessions` },
      { label: 'Active Devotees', val: `${activeDevs.length} / ${pData.devStats.length}` },
      { label: 'Avg Attendance', val: `${pData.avgAttendancePct}%` }
    ]
  });

  const bodyContent = `
  <!-- Executive KPIs -->
  <div class="stats-grid">
    <div class="stat-card" style="border-top:3px solid #ea580c">
      <div class="lbl">Devotees Logged</div>
      <div class="val">${pData.devStats.length}</div>
      <div class="kpi-sub">${activeDevs.length} active attendees</div>
    </div>
    <div class="stat-card" style="border-top:3px solid #10b981">
      <div class="lbl">${periodTitle} Attendance</div>
      <div class="val" style="color:#15803d">${pData.avgAttendancePct}%</div>
      <div class="kpi-sub">${pData.totalAttended} / ${pData.totalPossible} check-ins</div>
    </div>
    <div class="stat-card" style="border-top:3px solid #3b82f6">
      <div class="lbl">${periodTitle} Punctuality</div>
      <div class="val" style="color:#2563eb">${pData.avgPunctualityPct}%</div>
      <div class="kpi-sub">${pData.totalOnTime + pData.totalGrace} on-time sessions</div>
    </div>
    <div class="stat-card" style="border-top:3px solid #f59e0b">
      <div class="lbl">Star Sadhakas (≥80%)</div>
      <div class="val" style="color:#b45309">${starDevs.length}</div>
      <div class="kpi-sub">consistent regular attendees</div>
    </div>
  </div>

  <!-- Visual Breakdown Summaries -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
    <div class="stat-card" style="text-align:left;padding:12px 14px">
      <div style="font-size:11px;font-weight:800;color:#0f172a;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-bottom:8px">🎯 Punctuality Breakdown</div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:10.5px;border-bottom:1px dashed #f1f5f9">
        <span>🟢 On Time (≤ 04:30 AM)</span>
        <b>${pData.totalOnTime} (${pData.totalAttended > 0 ? Math.round((pData.totalOnTime/pData.totalAttended)*100) : 0}%)</b>
      </div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:10.5px;border-bottom:1px dashed #f1f5f9">
        <span>🟡 Grace (04:30–05:30 AM)</span>
        <b>${pData.totalGrace} (${pData.totalAttended > 0 ? Math.round((pData.totalGrace/pData.totalAttended)*100) : 0}%)</b>
      </div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:10.5px;border-bottom:1px dashed #f1f5f9">
        <span>🔴 Late (05:30–07:00 AM)</span>
        <b>${pData.totalLate} (${pData.totalAttended > 0 ? Math.round((pData.totalLate/pData.totalAttended)*100) : 0}%)</b>
      </div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:10.5px;border-bottom:1px dashed #f1f5f9">
        <span>🟣 Very late (> 07:00 AM)</span>
        <b>${pData.totalVeryLate || 0} (${pData.totalAttended > 0 ? Math.round(((pData.totalVeryLate||0)/pData.totalAttended)*100) : 0}%)</b>
      </div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:10.5px;font-weight:700">
        <span>⚪ Absent (Missed Sessions)</span>
        <b>${pData.totalAbsent} (${pData.totalPossible > 0 ? Math.round((pData.totalAbsent/pData.totalPossible)*100) : 0}%)</b>
      </div>
    </div>

    <div class="stat-card" style="text-align:left;padding:12px 14px">
      <div style="font-size:11px;font-weight:800;color:#0f172a;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-bottom:8px">📈 Arrival Distribution Timeline</div>
      ${(pData.buckets || []).map(b => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;font-size:10.5px;border-bottom:1px dashed #f1f5f9">
          <span style="font-weight:600">${b.label} <small style="color:#64748b">(${b.sub || 'Arrival'})</small></span>
          <span class="pill pill-grey">${b.count} check-ins</span>
        </div>
      `).join('')}
    </div>
  </div>

  <!-- Detailed Devotee Table -->
  <div class="section-title" style="display:flex;justify-content:space-between;align-items:center">
    <span>📋 Devotee Attendance & Punctuality Register (${visibleDevs.length} Devotees Listed)</span>
    <span style="font-size:10px;font-weight:600;color:#64748b">Denominator: ${pData.totalSessions} Sessions</span>
  </div>
  <div class="table-box">
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
  </div>

  <div class="footer">
    <div>ISKCON Jia Sarai · BACE Management System</div>
    <div>Official ${periodTitle} Sadhana & Attendance Documentation · Confidential</div>
  </div>
</body>
</html>`;

  const printDoc = headerHTML + bodyContent;
  const win = window.open('', '_blank');
  if (win) {
    win.document.open();
    win.document.write(printDoc);
    win.document.close();
  } else {
    toast('Popup blocker prevented opening the report preview', '⚠️');
  }
}
"""

fn_morning_growth = """
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

  const headerHTML = getStandardReportHTMLHeader({
    reportDocTitle: `Devotees_Progress_Growth_Report_${isWeekly ? 'WoW' : 'MoM'}_${iso(TODAY)}`,
    kicker: 'ISKCON BACE, JIA SARAI',
    title: `🏆 Devotees Progress & Growth Report`,
    subtitle: `🗓️ Comparison: ${curPeriodName} vs ${prevPeriodName}`,
    badges: [
      { text: isWeekly ? 'Weekly WoW' : 'Monthly MoM', cls: 'level-badge' },
      { text: '• Growth Analytics', cls: 'active-badge' }
    ],
    metaItems: [
      { label: 'Evaluation Cycle', val: isWeekly ? 'Week-over-Week' : 'Month-over-Month' },
      { label: 'Current Timeline', val: `${pData.startDate} — ${pData.endDate}` },
      { label: 'Devotees Tracked', val: `${list.length} Sadhakas` },
      { label: 'Improving Devotees', val: `${improvedCount} Devotees` },
      { label: 'Needs Attention', val: `${dippedCount} Devotees` }
    ]
  });

  const bodyContent = `
  <!-- Executive KPIs -->
  <div class="stats-grid">
    <div class="stat-card" style="border-top:3px solid #ea580c">
      <div class="lbl">Devotees Tracked</div>
      <div class="val">${list.length}</div>
      <div class="kpi-sub">active sadhakas evaluated</div>
    </div>
    <div class="stat-card" style="border-top:3px solid #10b981">
      <div class="lbl">Improving Devotees</div>
      <div class="val" style="color:#15803d">${improvedCount}</div>
      <div class="kpi-sub">positive punctuality growth</div>
    </div>
    <div class="stat-card" style="border-top:3px solid #f59e0b">
      <div class="lbl">Steady Performance</div>
      <div class="val" style="color:#b45309">${steadyCount}</div>
      <div class="kpi-sub">maintained high attendance</div>
    </div>
    <div class="stat-card" style="border-top:3px solid #ef4444">
      <div class="lbl">Needs Attention</div>
      <div class="val" style="color:#b91c1c">${dippedCount}</div>
      <div class="kpi-sub">requires pastoral follow-up</div>
    </div>
  </div>

  <!-- Growth Table -->
  <div class="section-title">📊 Sadhana Performance & Growth Matrix (${list.length} Devotees)</div>
  <div class="table-box">
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
  </div>

  <div class="footer">
    <div>ISKCON Jia Sarai · BACE Management System</div>
    <div>Sadhana & Punctuality Growth Document · For Facilitator & Mentor Review</div>
  </div>
</body>
</html>`;

  const printDoc = headerHTML + bodyContent;
  const win = window.open('', '_blank');
  if (win) {
    win.document.open();
    win.document.write(printDoc);
    win.document.close();
  } else {
    toast('Popup blocker prevented opening the growth report preview', '⚠️');
  }
}
"""

fn_devotee_report = """
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

  const headerHTML = getStandardReportHTMLHeader({
    reportDocTitle: `ISKCON_Jia_Sarai_${deptKey}_Devotee_Seva_Report_${repPeriod}_${iso(TODAY)}`,
    kicker: 'ISKCON BACE, JIA SARAI',
    title: `${isDeity ? '🛕' : '🧹'} ${deptTitle} — Seva Report`,
    subtitle: `🗓️ Duration: ${startDate} — ${endDate}`,
    badges: [
      { text: repPeriod === 'weekly' ? 'Weekly Seva' : 'Monthly Seva', cls: 'level-badge' },
      { text: '• Verified Roster', cls: 'active-badge' }
    ],
    metaItems: [
      { label: 'Department', val: deptTitle },
      { label: 'Time Window', val: `${startDate} — ${endDate}` },
      { label: 'Active Devotees', val: `${activeCount} / ${stats.length}` },
      { label: 'Sevas Assigned', val: `${totalAssigned} Sevas` },
      { label: 'Reliability Rate', val: `${overallRate}% Done` }
    ]
  });

  const bodyContent = `
  <!-- Executive KPIs -->
  <div class="stats-grid">
    <div class="stat-card" style="border-top:3px solid #ea580c">
      <div class="lbl">Active Servants</div>
      <div class="val">${activeCount} / ${stats.length}</div>
      <div class="kpi-sub">engaged devotees</div>
    </div>
    <div class="stat-card" style="border-top:3px solid #3b82f6">
      <div class="lbl">Services Assigned</div>
      <div class="val" style="color:#2563eb">${totalAssigned}</div>
      <div class="kpi-sub">total scheduled slots</div>
    </div>
    <div class="stat-card" style="border-top:3px solid #10b981">
      <div class="lbl">Services Completed</div>
      <div class="val" style="color:#15803d">${totalCompleted}</div>
      <div class="kpi-sub">successfully executed</div>
    </div>
    <div class="stat-card" style="border-top:3px solid #f59e0b">
      <div class="lbl">Overall Reliability</div>
      <div class="val" style="color:${overallRate>=85?'#15803d':'#b45309'}">${overallRate}%</div>
      <div class="kpi-sub">completion accuracy</div>
    </div>
  </div>

  <div class="section-title">📋 Individual Devotee Performance & Attendance Register</div>
  <div class="table-box">
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
            ? '<span class="pill pill-green">🌟 100% Perfect</span>'
            : (d.rate >= 85
              ? '<span class="pill pill-green">✅ ' + d.rate + '% Reliable</span>'
              : (d.missed > 0
                ? '<span class="pill pill-red">⚠️ ' + d.rate + '% Needs Follow-up</span>'
                : '<span class="pill pill-grey">' + d.rate + '% Active</span>'));

          return `<tr>
            <td style="text-align:center;font-weight:600;color:#64748b">${i + 1}</td>
            <td><b>${esc(d.name)}</b></td>
            <td style="text-align:center;font-weight:600">${d.assigned}</td>
            <td style="text-align:center;font-weight:700;color:#15803d">${d.completed}</td>
            <td style="text-align:center;color:${d.missed > 0 ? '#b91c1c' : '#64748b'};font-weight:${d.missed > 0 ? '700' : 'normal'}">${d.missed}</td>
            <td style="text-align:center">${d.substitutions > 0 ? d.substitutions : '—'}</td>
            <td style="text-align:center">${statusBadge}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>

  <div class="footer">
    <div>ISKCON BACE Jia Sarai · Community Operating System</div>
    <div>Official Temple Seva Record · Verified by Department Incharge</div>
  </div>
</body>
</html>`;

  const printDoc = headerHTML + bodyContent;
  let printWin = null;
  try {
    printWin = window.open('', '_blank');
  } catch (e) {}

  if (printWin) {
    printWin.document.open();
    printWin.document.write(printDoc);
    printWin.document.close();
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
"""

fn_matrix_report = """
function exportThreeDepartmentsMatrixPDF(period = 'weekly') {
  initDepartmentRosters();
  const data = getAshramThreeDepartmentsSummary(period);
  const list = data.summaryList;
  const kpis = data.stats;
  const periodTitle = period === 'weekly' ? 'Weekly View (Last 7 Days)' : 'Monthly View (Last 30 Days)';
  const days = Array.from({length: 7}, (_, i) => dayOff(-6 + i));
  const startDateFormatted = days[0] ? fmtD(days[0]) : '';
  const endDateFormatted = days[6] ? fmtD(days[6]) : '';

  const headerHTML = getStandardReportHTMLHeader({
    reportDocTitle: `3-Department_Seva_Summary_Matrix_${period}_${iso(TODAY)}`,
    kicker: 'ISKCON BACE, JIA SARAI',
    title: '🏛️ 3-Department Seva Summary Matrix',
    subtitle: `🗓️ Duration: ${startDateFormatted} — ${endDateFormatted}`,
    badges: [
      { text: periodTitle, cls: 'level-badge' },
      { text: '• Cross-Department Roster', cls: 'active-badge' }
    ],
    metaItems: [
      { label: 'Scope', val: 'Morning, Deity & Cleaning' },
      { label: 'Timeline Window', val: `${startDateFormatted} — ${endDateFormatted}` },
      { label: 'Engaged Devotees', val: `${list.length} Servants` },
      { label: 'All-Rounders', val: `${kpis.allRounders} Active` },
      { label: 'Health (M / D / C)', val: `${kpis.avgMorning}% / ${kpis.avgDeity}% / ${kpis.avgCleaning}%` }
    ],
    isLandscape: true
  });

  const bodyContent = `
  <!-- Executive KPIs -->
  <div class="stats-grid" style="grid-template-columns: repeat(4, 1fr)">
    <div class="stat-card" style="border-top:3px solid #ea580c">
      <div class="lbl">🌅 Morning Sadhana</div>
      <div class="val" style="color:#ea580c">${kpis.avgMorning}%</div>
      <div class="kpi-sub">average attendance rate</div>
    </div>
    <div class="stat-card" style="border-top:3px solid #f59e0b">
      <div class="lbl">🛕 Deity Seva Health</div>
      <div class="val" style="color:#b45309">${kpis.avgDeity}%</div>
      <div class="kpi-sub">${kpis.totalDeityDone} / ${kpis.totalDeityAssigned} sevas completed</div>
    </div>
    <div class="stat-card" style="border-top:3px solid #0d9488">
      <div class="lbl">🧹 Cleaning Seva Health</div>
      <div class="val" style="color:#0f766e">${kpis.avgCleaning}%</div>
      <div class="kpi-sub">${kpis.totalCleanDone} / ${kpis.totalCleanAssigned} sevas completed</div>
    </div>
    <div class="stat-card" style="border-top:3px solid #10b981">
      <div class="lbl">✨ All-Rounder Servants</div>
      <div class="val" style="color:#15803d">${kpis.allRounders} Devotees</div>
      <div class="kpi-sub">active across all 3 depts</div>
    </div>
  </div>

  <!-- Regularity Matrix Table -->
  <div class="section-title" style="display:flex;align-items:center;justify-content:space-between">
    <div>📊 Devotee Regularity Matrix (${list.length} Devotees Engaged)</div>
    <div style="font-size:10.5px;font-weight:600;color:#64748b">Morning Program · Deity Department · Cleaning</div>
  </div>

  <div class="table-box">
    <table>
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
              <div style="display:flex;align-items:center;gap:6px">
                <div style="width:70px;height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden">
                  <div style="height:100%;width:${d.overallScore}%;background:${d.overallScore>=90?'#15803d':(d.overallScore>=75?'#2563eb':'#d97706')}"></div>
                </div>
                <b style="font-size:11px">${d.overallScore}%</b>
              </div>
            </td>
            <td style="text-align:center">
              <span class="pill ${d.statusClass === 'b-green' ? 'pill-green' : (d.statusClass === 'b-amber' ? 'pill-amber' : 'pill-grey')}">${d.statusText}</span>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  ${period === 'weekly' ? `
  <div class="section-title">📅 7-Day Cross-Department Operational Timeline</div>
  <div class="table-box">
    <table>
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
            const devPres = (APP.morningData?.rawCheckins || []).filter(c => c.date === dStr).length;
            const devTotal = (APP.morningData?.devStats || []).length || 1;
            mTotPres += devPres;
            mTotSlots += devTotal;
            const pct = Math.round((devPres / devTotal) * 100);
            return `<td style="text-align:center;font-size:10px">${pct}% <small style="color:#64748b">(${devPres})</small></td>`;
          }).join('');
          const mAvg = mTotSlots > 0 ? Math.round((mTotPres / mTotSlots) * 100) : 0;

          const deityRoster = DB.rosters?.deity || [];
          let dTotDone = 0, dTotSlots = 0;
          const dCells = days.map(d => {
            const dStr = iso(d);
            const daySlots = deityRoster.filter(r => r.date === dStr);
            const done = daySlots.filter(r => r.status === 'completed').length;
            dTotDone += done;
            dTotSlots += daySlots.length;
            const pct = daySlots.length > 0 ? Math.round((done / daySlots.length) * 100) : 0;
            return `<td style="text-align:center;font-size:10px">${daySlots.length ? pct + '%' : '—'} <small style="color:#64748b">(${done}/${daySlots.length})</small></td>`;
          }).join('');
          const dAvg = dTotSlots > 0 ? Math.round((dTotDone / dTotSlots) * 100) : 0;

          const cleaningRoster = DB.rosters?.cleaning || [];
          let cTotDone = 0, cTotSlots = 0;
          const cCells = days.map(d => {
            const dStr = iso(d);
            const daySlots = cleaningRoster.filter(r => r.date === dStr);
            const done = daySlots.filter(r => r.status === 'completed').length;
            cTotDone += done;
            cTotSlots += daySlots.length;
            const pct = daySlots.length > 0 ? Math.round((done / daySlots.length) * 100) : 0;
            return `<td style="text-align:center;font-size:10px">${daySlots.length ? pct + '%' : '—'} <small style="color:#64748b">(${done}/${daySlots.length})</small></td>`;
          }).join('');
          const cAvg = cTotSlots > 0 ? Math.round((cTotDone / cTotSlots) * 100) : 0;

          return `
          <tr>
            <td><b>🌅 Morning Programme</b></td>
            ${mCells}
            <td style="text-align:center;font-weight:700;color:#ea580c">${mAvg}%</td>
          </tr>
          <tr>
            <td><b>🛕 Deity Department</b></td>
            ${dCells}
            <td style="text-align:center;font-weight:700;color:#d97706">${dAvg}%</td>
          </tr>
          <tr>
            <td><b>🧹 Cleaning Department</b></td>
            ${cCells}
            <td style="text-align:center;font-weight:700;color:#0d9488">${cAvg}%</td>
          </tr>`;
        })()}
      </tbody>
    </table>
  </div>
  ` : ''}

  <div class="footer">
    <div>ISKCON Jia Sarai · BACE Management System</div>
    <div>Official 3-Department Seva Summary Matrix Documentation · Verified by BACE Preaching Ministry</div>
  </div>
</body>
</html>`;

  const printDoc = headerHTML + bodyContent;
  const win = window.open('', '_blank');
  if (win) {
    win.document.open();
    win.document.write(printDoc);
    win.document.close();
  } else {
    toast('Popup blocker prevented opening the PDF preview', '⚠️');
  }
}
"""

fn_batch_report = """
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
  const levelText = b.level ? (String(b.level).toLowerCase().startsWith('level') ? b.level : `Level ${b.level}`) : 'Level 1';
  const statusText = b.status === 'Active' ? '• Active Preaching' : (b.status === 'Completed' ? '• Completed' : `• ${b.status}`);

  const headerHTML = getStandardReportHTMLHeader({
    reportDocTitle: `${esc(b.name).replace(/\s+/g,'_')}_Batch_Report`,
    kicker: 'ISKCON BACE, JIA SARAI',
    title: `${esc(b.name)} Batch Report`,
    subtitle: `🗓️ Duration: ${dateRangeStr}`,
    badges: [
      { text: levelText, cls: 'level-badge' },
      { text: statusText, cls: 'active-badge' }
    ],
    metaItems: [
      { label: 'Batch Incharge', val: esc(nameOf(bIncharge)) },
      { label: 'Coordinator', val: esc(coordName) },
      { label: 'Active Students', val: `${m.activeCount} Devotees` },
      { label: 'Base Location', val: esc(b.base || 'Jia Sarai') },
      { label: 'Avg Attendance', val: `${m.avgAtt}%` }
    ]
  });

  const bodyContent = `
  <div class="stats-grid" style="grid-template-columns: repeat(5, 1fr)">
    <div class="stat-card">
      <div class="lbl">Avg Attendance</div>
      <div class="val" style="color:#ea580c">${m.avgAtt}%</div>
      <div class="kpi-sub">${m.sessions} Sessions Logged</div>
    </div>
    <div class="stat-card">
      <div class="lbl">Sadhana Regularity</div>
      <div class="val" style="color:#0284c7">${m.sadhanaReg}%</div>
      <div class="kpi-sub">Chanting &amp; Habits</div>
    </div>
    <div class="stat-card">
      <div class="lbl">16 Rounds Chanting</div>
      <div class="val" style="color:#16a34a">${m.sixteenRounds}</div>
      <div class="kpi-sub">Consistent Chanters</div>
    </div>
    <div class="stat-card">
      <div class="lbl">Regular Rising (6 AM)</div>
      <div class="val" style="color:#d97706">${m.earlyRising}%</div>
      <div class="kpi-sub">Brahma Muhurta</div>
    </div>
    <div class="stat-card">
      <div class="lbl">High Potential Devs</div>
      <div class="val" style="color:#9333ea">${m.highPot}</div>
      <div class="kpi-sub">Future Leaders</div>
    </div>
  </div>

  <div class="section-title">👥 Devotee Roster &amp; Progress Matrix</div>
  <div class="table-box">
    <table>
      <thead>
        <tr>
          <th>Devotee Name</th>
          <th>Contact &amp; Role</th>
          <th style="text-align:center">Class Att %</th>
          <th style="text-align:center">Japa / Day</th>
          <th style="text-align:center">Wake Up</th>
          <th style="text-align:center">Sloka Test</th>
          <th style="text-align:center">Spiritual Status</th>
        </tr>
      </thead>
      <tbody>
        ${(b.students||[]).map(sid => {
          const d = dv(sid);
          if(!d) return '';
          const devMetrics = devoteeBatchMetrics(sid, bid);
          const attRate = devMetrics.attRate;
          const rounds = devMetrics.rounds;
          const wake = devMetrics.wake;
          const sloka = devMetrics.sloka;
          const status = devMetrics.status;

          return `
          <tr>
            <td>
              <b>${esc(d.name)}</b>
              <div style="font-size:9.5px;color:#64748b">${d.college || d.occupation || 'Student'}</div>
            </td>
            <td>
              <div>${esc(d.phone || '—')}</div>
              <div style="font-size:9.5px;color:#64748b">${d.email || ''}</div>
            </td>
            <td style="text-align:center">
              <span class="att-pill ${attRate>=80?'att-high':(attRate>=50?'att-mid':'att-low')}">${attRate}%</span>
            </td>
            <td style="text-align:center;font-weight:700">${rounds} rnds</td>
            <td style="text-align:center;color:#475569">${wake}</td>
            <td style="text-align:center;font-weight:700;color:${sloka>=80?'#16a34a':'#475569'}">${sloka}%</td>
            <td style="text-align:center">
              <span class="pill ${status==='Leading'?'pill-green':(status==='Consistent'?'level-badge':'pill-amber')}">${status}</span>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>

  <div class="section-title">🎓 Mentorship &amp; Facilitation Team</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
    <div class="stat-card" style="text-align:left;padding:12px 14px">
      <div style="font-size:11px;font-weight:800;color:#0f172a;border-bottom:1px solid #e2e8f0;padding-bottom:5px;margin-bottom:6px">Facilitators &amp; Teachers (${facs.length})</div>
      ${facs.length ? facs.map(f => `
        <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px dashed #f1f5f9;font-size:10.5px">
          <b>${esc(f.name)}</b>
          <span style="color:#64748b">${esc(f.phone || 'Mentor')}</span>
        </div>
      `).join('') : '<div style="color:#94a3b8;font-size:10px">No facilitators assigned yet.</div>'}
    </div>
    <div class="stat-card" style="text-align:left;padding:12px 14px">
      <div style="font-size:11px;font-weight:800;color:#0f172a;border-bottom:1px solid #e2e8f0;padding-bottom:5px;margin-bottom:6px">Volunteers &amp; Sevaks (${vols.length})</div>
      ${vols.length ? vols.map(v => `
        <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px dashed #f1f5f9;font-size:10.5px">
          <b>${esc(v.name)}</b>
          <span style="color:#64748b">${esc(v.phone || 'Sevak')}</span>
        </div>
      `).join('') : '<div style="color:#94a3b8;font-size:10px">No volunteers assigned.</div>'}
    </div>
  </div>

  ${(DB.reports.find(r => r.batch === bid) || {}).story || (DB.reports.find(r => r.batch === bid) || {}).challenges || (DB.reports.find(r => r.batch === bid) || {}).next ? `
  <div class="section-title">📝 Facilitator Field Remarks &amp; Feedback</div>
  <div class="stat-card" style="text-align:left;padding:10px 14px;margin-bottom:14px">
    ${(DB.reports.find(r => r.batch === bid) || {}).story ? `<p style="margin:3px 0"><b>Successes:</b> ${esc((DB.reports.find(r => r.batch === bid) || {}).story)}</p>` : ''}
    ${(DB.reports.find(r => r.batch === bid) || {}).challenges ? `<p style="margin:3px 0"><b>Challenges:</b> ${esc((DB.reports.find(r => r.batch === bid) || {}).challenges)}</p>` : ''}
    ${(DB.reports.find(r => r.batch === bid) || {}).next ? `<p style="margin:3px 0"><b>Next Month Plan:</b> ${esc((DB.reports.find(r => r.batch === bid) || {}).next)}</p>` : ''}
  </div>` : ''}

  <div class="section-title">🧾 Budget &amp; Accounts (Collection &amp; Expenses)</div>
  <div class="meta-box" style="grid-template-columns: repeat(4, 1fr)">
    <div class="meta-item"><span>Collected Budget</span><b style="color:#16a34a;font-size:13px">₹${Number(b.budget.allocated).toLocaleString()}</b></div>
    <div class="meta-item"><span>Total Expenses (Spent)</span><b style="color:#dc2626;font-size:13px">₹${Number(b.budget.spent).toLocaleString()}</b></div>
    <div class="meta-item"><span>Remaining Balance</span><b style="color:#0f172a;font-size:13px">₹${Number(b.budget.allocated - b.budget.spent).toLocaleString()}</b></div>
    <div class="meta-item"><span>Budget Utilisation</span><b style="color:${m.util>90?'#dc2626':'#2563eb'};font-size:13px">${m.util}% spent</b></div>
  </div>

  <div class="footer">
    <div>ISKCON Jia Sarai · BACE Management System</div>
    <div>Official Batch Record · Verified by Facilitator &amp; Coordinator</div>
  </div>
</body>
</html>`;

  const printDoc = headerHTML + bodyContent;
  const win = window.open('', '_blank');
  if(win){
    win.document.open();
    win.document.write(printDoc);
    win.document.close();
  } else {
    toast('Popup blocker prevented opening the report preview','⚠️');
  }
}
"""

fn_care_report = """
function exportCareReportPDF(){
  const s = STATS();
  const g = DB.careGroups.filter(x => x.status === 'Active');
  const careUser = (DB.users||[]).find(x => x.role === 'care_manager');
  const careDev = careUser ? dv(careUser.devotee) : (DB.devotees||[]).find(x => x.appointment === ROLES.care_manager?.name || devoteeRole(x) === 'care_manager');
  const careMgrName = careDev ? careDev.name : 'Devotee Care Manager';
  const dateStr = fmtLong(iso(TODAY));

  const headerHTML = getStandardReportHTMLHeader({
    reportDocTitle: 'Devotee Care & Well-being Report — ISKCON BACE Jia Sarai',
    kicker: 'ISKCON BACE, JIA SARAI',
    title: 'Devotee Care &amp; Well-being Report',
    subtitle: `🗓️ Date: ${dateStr}`,
    badges: [
      { text: 'Devotee Care', cls: 'level-badge' },
      { text: '• Active Pastoral Ministry', cls: 'active-badge' }
    ],
    metaItems: [
      { label: 'Care Manager', val: esc(careMgrName) },
      { label: 'Date of Issue', val: dateStr },
      { label: 'Active Care Groups', val: `${g.length} Groups` },
      { label: 'Mentored Devotees', val: `${s.careCount} Devotees` },
      { label: 'Scheduled Follow-ups', val: `${s.careWeek} This Week` }
    ]
  });

  const bodyContent = `
  <!-- Executive Metrics -->
  <div class="stats-grid" style="grid-template-columns: repeat(4, 1fr)">
    <div class="stat-card" style="border-top:3px solid #10b981">
      <div class="lbl">Active Care Groups</div>
      <div class="val" style="color:#059669">${g.length}</div>
      <div class="kpi-sub">functional care units</div>
    </div>
    <div class="stat-card" style="border-top:3px solid #0284c7">
      <div class="lbl">Devotees in Care</div>
      <div class="val" style="color:#0284c7">${s.careCount}</div>
      <div class="kpi-sub">under regular mentorship</div>
    </div>
    <div class="stat-card" style="border-top:3px solid #d97706">
      <div class="lbl">Assigned Mentors</div>
      <div class="val" style="color:#d97706">${s.facilitators}</div>
      <div class="kpi-sub">trained facilitators &amp; guides</div>
    </div>
    <div class="stat-card" style="border-top:3px solid #ea580c">
      <div class="lbl">Scheduled This Week</div>
      <div class="val" style="color:#ea580c">${s.careWeek}</div>
      <div class="kpi-sub">one-on-one sessions</div>
    </div>
  </div>

  <!-- Care Groups Table -->
  <div class="section-title">🛡️ Active Devotee Care Groups &amp; Mentor Allocation</div>
  <div class="table-box">
    <table>
      <thead>
        <tr>
          <th>Group Name</th>
          <th>Counselor / Mentor</th>
          <th>Target Devotees</th>
          <th style="text-align:center">Members</th>
          <th>Meeting Schedule</th>
          <th style="text-align:center">Health Rating</th>
        </tr>
      </thead>
      <tbody>
        ${g.map(cg => {
          const counselor = dv(cg.counselor);
          const memberCount = (cg.members || []).length;
          const stars = '★'.repeat(cg.health || 5) + '☆'.repeat(5 - (cg.health || 5));
          return `
          <tr>
            <td>
              <b>${esc(cg.name)}</b>
              <div style="font-size:9px;color:#64748b">${esc(cg.focus || 'Spiritual Mentorship')}</div>
            </td>
            <td>
              <b>${esc(counselor ? counselor.name : 'Unassigned')}</b>
              <div style="font-size:9px;color:#64748b">${esc(counselor?.phone || '')}</div>
            </td>
            <td>${esc(cg.audience || 'All Devotees')}</td>
            <td style="text-align:center;font-weight:700">${memberCount}</td>
            <td>${esc(cg.schedule || 'Weekly')}</td>
            <td style="text-align:center;color:#d97706;font-size:12px">${stars}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>

  <!-- Pastoral & Spiritual Health Insights -->
  <div class="section-title">🌱 Community Pastoral &amp; Well-being Indicators</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
    <div class="stat-card" style="text-align:left;padding:12px 14px">
      <div style="font-size:11px;font-weight:800;color:#0f172a;border-bottom:1px solid #e2e8f0;padding-bottom:5px;margin-bottom:6px">Pastoral Priorities &amp; Notes</div>
      <div style="font-size:10px;color:#475569;line-height:1.5">
        <div>• <b>First-Year Students:</b> Special emphasis on emotional adjustment, hostel life balance, and personal japa guidance.</div>
        <div>• <b>Exam Seasons:</b> Structured stress management, study prayers, and adjusted morning attendance flexibility.</div>
        <div>• <b>Health &amp; Prasadam:</b> Ensuring pure sattvic nutrition and medical assistance for unwell residents.</div>
        <div>• <b>One-on-One Catchups:</b> Bi-weekly pastoral reviews for all devotees expressing personal challenges.</div>
      </div>
    </div>
    <div class="stat-card" style="text-align:left;padding:12px 14px">
      <div style="font-size:11px;font-weight:800;color:#0f172a;border-bottom:1px solid #e2e8f0;padding-bottom:5px;margin-bottom:6px">Community Spiritual Health Summary</div>
      <div style="font-size:10px;color:#475569;line-height:1.5">
        <div>• <b>Facilitators:</b> ${s.facilitators} appointed mentors providing personal spiritual guidance.</div>
        <div>• <b>Sadhana Reporting:</b> ${DB.sadhana.length} devotees submitting regular japa and rising reports.</div>
        <div>• <b>16 Rounds Chanting:</b> ${DB.sadhana.filter(r=>r.rounds>=16).length} devotees consistently chanting 16 rounds.</div>
        <div>• <b>Yatras &amp; Camps:</b> ${DB.camps.length} camp participations recorded across the community.</div>
        <div>• <b>Scheduled Meetings:</b> ${s.careWeek} care follow-ups scheduled for this week.</div>
      </div>
    </div>
  </div>

  <div class="footer">
    <div>ISKCON Jia Sarai · Confidential Devotee Care Report</div>
    <div>Generated automatically from live BACE records · Pastoral Care Ministry</div>
  </div>
</body>
</html>`;

  const printDoc = headerHTML + bodyContent;
  const win = window.open('', '_blank');
  if(win){
    win.document.open();
    win.document.write(printDoc);
    win.document.close();
  } else {
    toast('Popup blocker prevented opening the report preview','⚠️');
  }
}
"""

print('Replacing functions...')
text = replace_function(text, 'exportMorningPeriodReportPDF', fn_morning_period)
print('Replaced exportMorningPeriodReportPDF.')
text = replace_function(text, 'exportMorningGrowthReportPDF', fn_morning_growth)
print('Replaced exportMorningGrowthReportPDF.')
text = replace_function(text, 'exportDevoteeReportPDF', fn_devotee_report)
print('Replaced exportDevoteeReportPDF.')
text = replace_function(text, 'exportThreeDepartmentsMatrixPDF', fn_matrix_report)
print('Replaced exportThreeDepartmentsMatrixPDF.')
text = replace_function(text, 'exportBatchMonthlyReportPDF', fn_batch_report)
print('Replaced exportBatchMonthlyReportPDF.')
text = replace_function(text, 'exportCareReportPDF', fn_care_report)
print('Replaced exportCareReportPDF.')

with open(src_path, 'w', encoding='utf-8') as f:
    f.write(text)

print('Successfully updated public/index.html with all 6 standardized reports!')
