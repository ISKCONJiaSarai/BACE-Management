const fs = require('fs');
const vm = require('vm');

let code = fs.readFileSync('public/index.html', 'utf8');
const isCrlf = code.includes('\r\n');
if (isCrlf) {
  code = code.replace(/\r\n/g, '\n');
}

// 1. In normalizeDevotee: enforce gender to 'Male' or 'Female'
const oldNormalize = `function normalizeDevotee(d){
  if(!d||typeof d!=='object')return d;
  d.friends=Array.isArray(d.friends)?d.friends:[];`;

const newNormalize = `function normalizeDevotee(d){
  if(!d||typeof d!=='object')return d;
  d.gender = (d.gender === 'Female' || d.gender === 'female' || d.gender === 'F') ? 'Female' : 'Male';
  d.friends=Array.isArray(d.friends)?d.friends:[];`;

if (!code.includes(oldNormalize)) {
  console.error('Failed to find oldNormalize');
  process.exit(1);
}
code = code.replace(oldNormalize, newNormalize);

// 2. In openDevoteeForm: add Gender field right after Full name
const oldDevFormName = `FLD('name','Full name','text',{v:d?.name||'',ph:'e.g. Mukunda Datta Das'}),`;
const newDevFormName = `FLD('name','Full name','text',{v:d?.name||'',ph:'e.g. Mukunda Datta Das'}),
    FLD('gender','Gender','select',{v:d?.gender||'Male',opts:['Male','Female'],half:1}),`;

if (!code.includes(oldDevFormName)) {
  console.error('Failed to find oldDevFormName');
  process.exit(1);
}
code = code.replace(oldDevFormName, newDevFormName);

// 3. In save-devotee: save gender in both update and create
const oldSaveDevUpdate = `        name: v.name.trim(),
        phone: v.phone.trim(),`;
const newSaveDevUpdate = `        name: v.name.trim(),
        gender: (v.gender === 'Female' || v.gender === 'female' || v.gender === 'F') ? 'Female' : 'Male',
        phone: v.phone.trim(),`;

if (!code.includes(oldSaveDevUpdate)) {
  console.error('Failed to find oldSaveDevUpdate');
  process.exit(1);
}
code = code.replace(oldSaveDevUpdate, newSaveDevUpdate);

const oldSaveDevCreate = `        name: v.name.trim(),
        gender: 'M',`;
const newSaveDevCreate = `        name: v.name.trim(),
        gender: (v.gender === 'Female' || v.gender === 'female' || v.gender === 'F') ? 'Female' : 'Male',`;

if (!code.includes(oldSaveDevCreate)) {
  console.error('Failed to find oldSaveDevCreate');
  process.exit(1);
}
code = code.replace(oldSaveDevCreate, newSaveDevCreate);

// 4. In viewDevotees(): add gender to filters and table columns
const oldDevFilters = `const f=APP.filters.dev||(APP.filters.dev={q:'',status:'',dept:'',batch:'',level:'',careGroup:'',facilitator:'',skill:'',attendance:'',swabhav:'',sort:'name_asc'});`;
const newDevFilters = `const f=APP.filters.dev||(APP.filters.dev={q:'',status:'',gender:'',dept:'',batch:'',level:'',careGroup:'',facilitator:'',skill:'',attendance:'',swabhav:'',sort:'name_asc'});`;

if (!code.includes(oldDevFilters)) {
  console.error('Failed to find oldDevFilters');
  process.exit(1);
}
code = code.replace(oldDevFilters, newDevFilters);

const oldDevFilterCheck = `if(f.role&&devoteeRole(d)!==f.role)return false;
    if(f.status&&d.status!==f.status)return false;`;
const newDevFilterCheck = `if(f.role&&devoteeRole(d)!==f.role)return false;
    if(f.status&&d.status!==f.status)return false;
    if(f.gender&&d.gender!==f.gender)return false;`;

if (!code.includes(oldDevFilterCheck)) {
  console.error('Failed to find oldDevFilterCheck');
  process.exit(1);
}
code = code.replace(oldDevFilterCheck, newDevFilterCheck);

// Mobile filter dropdown
const oldMobFilterStatus = `${"${mobSelect('status', f.status, [['Active','Active'],['Pending Approval','Pending'],['New','New'],['Inactive','Inactive']], 'Status')}"}`;
const newMobFilterStatus = `${"${mobSelect('status', f.status, [['Active','Active'],['Pending Approval','Pending'],['New','New'],['Inactive','Inactive']], 'Status')}"}
        ${"${mobSelect('gender', f.gender, [['Male','Male'],['Female','Female']], 'Gender')}"}`;

if (!code.includes(oldMobFilterStatus)) {
  console.error('Failed to find oldMobFilterStatus');
  process.exit(1);
}
code = code.replace(oldMobFilterStatus, newMobFilterStatus);

// Table columns in viewDevotees
const oldCols = `     {
       w:'24%',
       h: \`<div class="col-filter-wrap">
         <span>Devotee</span>
         \${colSelect('sort', f.sort, [
           ['name_asc', 'A→Z'],
           ['name_desc', 'Z→A'],
           ['date_desc', 'Newest'],
           ['date_asc', 'Oldest'],
           ['sadhana_desc', 'Rounds']
         ], '↕ Sort', true)}
         \${colSelect('role', f.role, [
           ...Object.entries(ROLES).filter(([k]) => k !== 'admin').map(([k, r]) => [k, r.name])
         ], 'Role')}
       </div>\`,
       label: 'Devotee',
       c: d => {
         const rKey = devoteeRole(d);
         const rObj = ROLES[rKey] || ROLES.devotee;
         const isLeader = rKey !== 'devotee';
         return \`<div class="who"><div style="flex:none">\${av(d.name,'s')}</div><div style="min-width:0;overflow:hidden"><b style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block">\${esc(d.name)}\${isLeader?\` <span style="font-size:10px;font-weight:700;color:var(--accent)">\${rObj.emoji}</span>\`:''}</b><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">\${esc(d.org||d.highestEducation||'BACE')}\${isLeader?\` · <span style="color:var(--accent);font-weight:600">\${esc(rObj.name)}</span>\`:''}</span></div></div>\`;
       }
     },
     {
       w:'9%',
       h: \`<div class="col-filter-wrap">
         <span>Status</span>
         \${colSelect('status', f.status, [
           ['Active', 'Active'],
           ['Pending Approval', 'Pending'],
           ['New', 'New'],
           ['Inactive', 'Inactive']
         ], 'All')}
       </div>\`,
       label: 'Status',
       c: d => sbadge(d.status)
     },
     {
       w:'14%',
       h: \`<div class="col-filter-wrap">
         <span>Batch</span>
         \${colSelect('batch', f.batch, [
           ...(DB.batches || []).map(b => [b.id, b.name]),
           ['none', 'No batch']
         ], 'All')}
       </div>\`,
       label: 'Level / batch',
       c: d => d.batch ? \`<span class="tbl-trunc">\${badge('L'+d.level,'indigo')} \${esc(batch(d.batch)?.name||'')}</span>\` : '<span class="tiny">—</span>'
     },
     {
       w:'11%',
       h: \`<div class="col-filter-wrap">
         <span>Dept</span>
         \${colSelect('dept', f.dept, [
           ...activeDepts().map(d => [d.id, d.name]),
           ['none', 'No seva']
         ], 'All')}
       </div>\`,
       label: 'Department',
       c: d => d.dept ? \`<span class="tbl-trunc" title="\${esc(dept(d.dept)?.name||'')}">\${esc(dept(d.dept)?.name||'')}</span>\` : '<span class="tiny">—</span>'
     },
     {
       w:'11%',
       h: \`<div class="col-filter-wrap">
         <span>Care</span>
         \${colSelect('careGroup', f.careGroup, [
           ...(DB.careGroups || []).map(g => [g.id, g.name]),
           ['none', 'No group']
         ], 'All')}
       </div>\`,
       label: 'Care group',
       c: d => d.careGroup ? \`<span class="tbl-trunc" title="\${esc(group(d.careGroup)?.name||'')}">\${esc(group(d.careGroup)?.name||'')}</span>\` : '<span class="tiny">—</span>'
     },
     {
       w:'13%',
       h: \`<div class="col-filter-wrap">
         <span>Facilitator</span>
         \${colSelect('facilitator', f.facilitator, [
           ...getHierarchyFacilitators().map(x => [x.id, x.name]),
           ['none', 'No facilitator']
         ], 'All')}
       </div>\`,
       label: 'Facilitator',
       c: d => {
         const facName = d.facilitator ? nameOf(d.facilitator) : '';
         return facName ? \`<span class="tbl-trunc" title="\${esc(facName)}"><span class="badge b-teal" style="font-size:10.5px;padding:2px 6px">🤝 \${esc(facName)}</span></span>\` : '<span class="tiny" style="color:var(--ink-3)">—</span>';
       }
     },
     {
       w:'8%',`;

const newCols = `     {
       w:'22%',
       h: \`<div class="col-filter-wrap">
         <span>Devotee</span>
         \${colSelect('sort', f.sort, [
           ['name_asc', 'A→Z'],
           ['name_desc', 'Z→A'],
           ['date_desc', 'Newest'],
           ['date_asc', 'Oldest'],
           ['sadhana_desc', 'Rounds']
         ], '↕ Sort', true)}
         \${colSelect('role', f.role, [
           ...Object.entries(ROLES).filter(([k]) => k !== 'admin').map(([k, r]) => [k, r.name])
         ], 'Role')}
       </div>\`,
       label: 'Devotee',
       c: d => {
         const rKey = devoteeRole(d);
         const rObj = ROLES[rKey] || ROLES.devotee;
         const isLeader = rKey !== 'devotee';
         return \`<div class="who"><div style="flex:none">\${av(d.name,'s')}</div><div style="min-width:0;overflow:hidden"><b style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block">\${esc(d.name)}\${isLeader?\` <span style="font-size:10px;font-weight:700;color:var(--accent)">\${rObj.emoji}</span>\`:''}</b><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">\${esc(d.org||d.highestEducation||'BACE')}\${isLeader?\` · <span style="color:var(--accent);font-weight:600">\${esc(rObj.name)}</span>\`:''}</span></div></div>\`;
       }
     },
     {
       w:'8%',
       h: \`<div class="col-filter-wrap">
         <span>Status</span>
         \${colSelect('status', f.status, [
           ['Active', 'Active'],
           ['Pending Approval', 'Pending'],
           ['New', 'New'],
           ['Inactive', 'Inactive']
         ], 'All')}
       </div>\`,
       label: 'Status',
       c: d => sbadge(d.status)
     },
     {
       w:'7%',
       h: \`<div class="col-filter-wrap">
         <span>Gender</span>
         \${colSelect('gender', f.gender, [
           ['Male', 'Male'],
           ['Female', 'Female']
         ], 'All')}
       </div>\`,
       label: 'Gender',
       c: d => \`<span class="badge \${d.gender==='Female'?'b-amber':'b-indigo'}" style="font-size:10.5px">\${d.gender||'Male'}</span>\`
     },
     {
       w:'13%',
       h: \`<div class="col-filter-wrap">
         <span>Batch</span>
         \${colSelect('batch', f.batch, [
           ...(DB.batches || []).map(b => [b.id, b.name]),
           ['none', 'No batch']
         ], 'All')}
       </div>\`,
       label: 'Level / batch',
       c: d => d.batch ? \`<span class="tbl-trunc">\${badge('L'+d.level,'indigo')} \${esc(batch(d.batch)?.name||'')}</span>\` : '<span class="tiny">—</span>'
     },
     {
       w:'10%',
       h: \`<div class="col-filter-wrap">
         <span>Dept</span>
         \${colSelect('dept', f.dept, [
           ...activeDepts().map(d => [d.id, d.name]),
           ['none', 'No seva']
         ], 'All')}
       </div>\`,
       label: 'Department',
       c: d => d.dept ? \`<span class="tbl-trunc" title="\${esc(dept(d.dept)?.name||'')}">\${esc(dept(d.dept)?.name||'')}</span>\` : '<span class="tiny">—</span>'
     },
     {
       w:'10%',
       h: \`<div class="col-filter-wrap">
         <span>Care</span>
         \${colSelect('careGroup', f.careGroup, [
           ...(DB.careGroups || []).map(g => [g.id, g.name]),
           ['none', 'No group']
         ], 'All')}
       </div>\`,
       label: 'Care group',
       c: d => d.careGroup ? \`<span class="tbl-trunc" title="\${esc(group(d.careGroup)?.name||'')}">\${esc(group(d.careGroup)?.name||'')}</span>\` : '<span class="tiny">—</span>'
     },
     {
       w:'12%',
       h: \`<div class="col-filter-wrap">
         <span>Facilitator</span>
         \${colSelect('facilitator', f.facilitator, [
           ...getHierarchyFacilitators().map(x => [x.id, x.name]),
           ['none', 'No facilitator']
         ], 'All')}
       </div>\`,
       label: 'Facilitator',
       c: d => {
         const facName = d.facilitator ? nameOf(d.facilitator) : '';
         return facName ? \`<span class="tbl-trunc" title="\${esc(facName)}"><span class="badge b-teal" style="font-size:10.5px;padding:2px 6px">🤝 \${esc(facName)}</span></span>\` : '<span class="tiny" style="color:var(--ink-3)">—</span>';
       }
     },
     {
       w:'8%',`;

if (!code.includes(oldCols)) {
  console.error('Failed to find oldCols');
  process.exit(1);
}
code = code.replace(oldCols, newCols);

// 5. In viewDevotee(id): add Gender to Basic info
const oldDevProfileBasic = `<dt>Full name</dt><dd>\${esc(d.name)}</dd><dt>Date of birth</dt><dd>\${fmtD(d.dob)}</dd>`;
const newDevProfileBasic = `<dt>Full name</dt><dd>\${esc(d.name)}</dd><dt>Gender</dt><dd><span class="badge \${d.gender==='Female'?'b-amber':'b-indigo'}">\${esc(d.gender||'Male')}</span></dd><dt>Date of birth</dt><dd>\${fmtD(d.dob)}</dd>`;

if (!code.includes(oldDevProfileBasic)) {
  console.error('Failed to find oldDevProfileBasic');
  process.exit(1);
}
code = code.replace(oldDevProfileBasic, newDevProfileBasic);

// 6. In viewCompleteProfile(): use Male and Female values in select
const oldCompleteProfileGender = `<select name="gender" required>
                <option value="M" \${defGender==='M'?'selected':''}>Male</option>
                <option value="F" \${defGender==='F'?'selected':''}>Female</option>
                <option value="Other" \${defGender==='Other'?'selected':''}>Other</option>
              </select>`;

const newCompleteProfileGender = `<select name="gender" required>
                <option value="Male" \${defGender==='Male'||defGender==='M'?'selected':''}>Male</option>
                <option value="Female" \${defGender==='Female'||defGender==='F'?'selected':''}>Female</option>
              </select>`;

if (!code.includes(oldCompleteProfileGender)) {
  console.error('Failed to find oldCompleteProfileGender');
  process.exit(1);
}
code = code.replace(oldCompleteProfileGender, newCompleteProfileGender);

// 7. In CSV exports: export-devotees and export-table
const oldCsvExportDevs = `case 'export-devotees':downloadCSV('devotees.csv',[['Name','Status','Level','Batch','Department','Care group','Facilitator','Phone','Email','Joined','Attendance %'],
    ...DB.devotees.map(d=>[d.name,d.status,d.level,batch(d.batch)?.name||'',dept(d.dept)?.name||'',group(d.careGroup)?.name||'',nameOf(d.facilitator),d.phone,d.email,d.joined,d.attendancePct])]);`;

const newCsvExportDevs = `case 'export-devotees':downloadCSV('devotees.csv',[['Name','Gender','Status','Level','Batch','Department','Care group','Facilitator','Phone','Email','Joined','Attendance %'],
    ...DB.devotees.map(d=>[d.name,d.gender||'Male',d.status,d.level,batch(d.batch)?.name||'',dept(d.dept)?.name||'',group(d.careGroup)?.name||'',nameOf(d.facilitator),d.phone,d.email,d.joined,d.attendancePct])]);`;

if (!code.includes(oldCsvExportDevs)) {
  console.error('Failed to find oldCsvExportDevs');
  process.exit(1);
}
code = code.replace(oldCsvExportDevs, newCsvExportDevs);

const oldExportTableDev = `const map={dev:['devotees',()=>[['Name','Status','Batch','Department'],...DB.devotees.map(d=>[d.name,d.status,batch(d.batch)?.name||'',dept(d.dept)?.name||''])]],`;
const newExportTableDev = `const map={dev:['devotees',()=>[['Name','Gender','Status','Batch','Department'],...DB.devotees.map(d=>[d.name,d.gender||'Male',d.status,batch(d.batch)?.name||'',dept(d.dept)?.name||''])]],`;

if (!code.includes(oldExportTableDev)) {
  console.error('Failed to find oldExportTableDev');
  process.exit(1);
}
code = code.replace(oldExportTableDev, newExportTableDev);

// 8. In parseCSV: add gender to keyMap
const oldKeyMap = `  const keyMap = {
    name: ['name', 'devotee', 'devoteename', 'fullname', 'devotees'],`;

const newKeyMap = `  const keyMap = {
    name: ['name', 'devotee', 'devoteename', 'fullname', 'devotees'],
    gender: ['gender', 'sex', 'm/f', 'mf'],`;

if (!code.includes(oldKeyMap)) {
  console.error('Failed to find oldKeyMap');
  process.exit(1);
}
code = code.replace(oldKeyMap, newKeyMap);

// In CSV import row mapping
const oldImportExisting = `      if(existing){
        if(row.phone) existing.phone = row.phone;`;
const newImportExisting = `      if(existing){
        if(row.gender) existing.gender = (String(row.gender).toLowerCase().startsWith('f')) ? 'Female' : 'Male';
        if(row.phone) existing.phone = row.phone;`;

if (!code.includes(oldImportExisting)) {
  console.error('Failed to find oldImportExisting');
  process.exit(1);
}
code = code.replace(oldImportExisting, newImportExisting);

const oldImportNew = `          name: rawName,
          gender: row.gender || 'M',`;
const newImportNew = `          name: rawName,
          gender: (row.gender && String(row.gender).toLowerCase().startsWith('f')) ? 'Female' : 'Male',`;

if (!code.includes(oldImportNew)) {
  console.error('Failed to find oldImportNew');
  process.exit(1);
}
code = code.replace(oldImportNew, newImportNew);

// 9. In downloadDevoteeCsvTemplate: include Gender in template headers and sample rows
const oldTemplateHeaders = `  const headers = [
    'Name', 'Phone', 'Email', 'Batch', 'Batch Role', 'Residence', 'Attendance Mode',
    'Level', 'Status', 'College/Org', 'Occupation', 'Highest Education', 'Present Studies or Job',
    'Department', 'Care Group', 'Facilitator', 'Attendance %', 'Sadhana Rounds', 'Skills'
  ];
  const sampleRows = [
    [
      'Mukunda Datta Das', '9876543210', 'mukunda.datta@example.com', 'Gaurvani Sabha', 'Member',
      'Jia Sarai BACE', 'Offline at BACE', '3', 'Active', 'IIT Delhi', 'Student',
      'B.Tech', 'IITD Mechanical Engineering', 'Morning Program', 'Care Group 1', f1, '90', '16', 'Organising, Teaching'
    ],
    [
      'Vrindavan Chandra pr', '9876543211', 'vrindavan.chandra@example.com', 'Narad Sabha', 'Coordinator',
      'Nilachal Dham BACE', 'Offline at BACE', '3', 'Active', 'DTU', 'Job',
      'M.Tech', 'Software Engineer', 'Deity Department', 'Care Group 2', f2, '85', '16', 'Music, Deity Seva'
    ],
    [
      'Bhakta Rohan Sharma', '9876543212', 'rohan.sharma@example.com', 'Taksharya', 'Member',
      'Kailash Hostel', 'Offline at BACE', '1', 'New', 'IIT Delhi', 'Student',
      'B.Tech', 'IITD Chemical', 'Sankirtan Dept. & Inventory', 'Care Group 3', f3, '75', '4', 'Reading'
    ]
  ];`;

const newTemplateHeaders = `  const headers = [
    'Name', 'Gender', 'Phone', 'Email', 'Batch', 'Batch Role', 'Residence', 'Attendance Mode',
    'Level', 'Status', 'College/Org', 'Occupation', 'Highest Education', 'Present Studies or Job',
    'Department', 'Care Group', 'Facilitator', 'Attendance %', 'Sadhana Rounds', 'Skills'
  ];
  const sampleRows = [
    [
      'Mukunda Datta Das', 'Male', '9876543210', 'mukunda.datta@example.com', 'Gaurvani Sabha', 'Member',
      'Jia Sarai BACE', 'Offline at BACE', '3', 'Active', 'IIT Delhi', 'Student',
      'B.Tech', 'IITD Mechanical Engineering', 'Morning Program', 'Care Group 1', f1, '90', '16', 'Organising, Teaching'
    ],
    [
      'Radhika Devi Dasi', 'Female', '9876543211', 'radhika.devi@example.com', 'Narad Sabha', 'Coordinator',
      'Nilachal Dham BACE', 'Offline at BACE', '3', 'Active', 'DTU', 'Job',
      'M.Tech', 'Software Engineer', 'Deity Department', 'Care Group 2', f2, '85', '16', 'Music, Deity Seva'
    ],
    [
      'Bhakta Rohan Sharma', 'Male', '9876543212', 'rohan.sharma@example.com', 'Taksharya', 'Member',
      'Kailash Hostel', 'Offline at BACE', '1', 'New', 'IIT Delhi', 'Student',
      'B.Tech', 'IITD Chemical', 'Sankirtan Dept. & Inventory', 'Care Group 3', f3, '75', '4', 'Reading'
    ]
  ];`;

if (!code.includes(oldTemplateHeaders)) {
  console.error('Failed to find oldTemplateHeaders');
  process.exit(1);
}
code = code.replace(oldTemplateHeaders, newTemplateHeaders);

if (isCrlf) {
  code = code.replace(/\n/g, '\r\n');
}

// 10. Check syntax
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
console.log('Successfully updated public/index.html with Gender column, filters, forms, exports, and template!');
