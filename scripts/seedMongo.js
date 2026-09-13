const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const { Devotee, Department, Batch, CareGroup } = require('../models');

dotenv.config();

const DEPT_DATA = [
  ['Gita for Life Preaching','Outreach course for working professionals and alumni','📖','#3C4E7A','Preaching','Weekly'],
  ['Sreshtha IITD Preaching','Campus preaching for IIT Delhi students','🎓','#3C4E7A','Preaching','Weekly'],
  ['Deity Department','Deity wake-up, worship, aarti singing and bhoga offerings','🪔','#C9601B','Worship','Daily'],
  ['Sankirtan Dept. & Inventory','Book distribution, sankirtan events and inventory issue/return','📚','#B8861F','Outreach','Weekly'],
  ['Morning Program','Mangala aarti, japa and Bhagavatam class attendance','🌅','#C4801C','Sadhana','Daily'],
  ['Kitchen Department','Daily menu, prasadam cooking, rebates and feedback','🍲','#7A5230','Prasadam','Daily'],
  ['Accounts','Community finances, donations, receipts and budgets','🧾','#2E7D6B','Administration','Monthly'],
  ['Cleaning','Recurring cleaning roster with completion proof photos','🧹','#1F6F78','Facilities','Daily'],
  ['Purchasing','Groceries, supplies and vendor coordination','🛒','#3E7FA8','Facilities','Weekly'],
  ['Maintenance','Repairs, electrical, plumbing and facilities','🔧','#7A5230','Facilities','Weekly'],
  ['Birthday & Festival','Birthday database, automatic wishes and festival execution','🎉','#B8861F','Community','Monthly'],
  ['Public Relations','Guests, temple relations and external outreach','🤝','#3E7FA8','Community','Monthly'],
  ['Health Care Department','Devotee health, first aid and clinic accompaniment','🩺','#B4402F','Care','Monthly'],
  ['Sadhana Reporting','Daily sadhana collection, review and follow-up','📿','#2E7D6B','Sadhana','Daily'],
  ['Tulsi Maharani Care','Tulsi watering, pruning and seasonal care','🌿','#2E7D6B','Worship','Daily'],
  ['Social Media','Reels, design, posts and digital outreach','📱','#3C4E7A','Outreach','Weekly'],
  ['BBT Department','Book catalogue, requests, approval, issue and return','📕','#C9601B','Outreach','Weekly'],
  ['Study and Academics','Scriptural study support and academic mentoring','✍️','#1F6F78','Education','Monthly'],
  ['Saturday Bhagavatam Class','Weekly Bhagavatam class coordination','🕉','#C9601B','Education','Weekly'],
  ['BACE OC','Overall coordination office — cross-department follow-through','🧭','#1F1B16','Administration','Weekly'],
  ['Area Leader Office','Strategic oversight and community direction','🪷','#1F1B16','Administration','Monthly']
];

const BATCH_DATA = [
  ['Taksharya', 1, 'First-step batch for newcomers from campus outreach', 'Tuesday', '6:30 pm', 40000],
  ['Sreshtha', 1, 'Regular weekly class for committed newcomers', 'Thursday', '7:00 pm', 50000],
  ['IITD Faculty & Staff Preaching', 1, 'Study circle for faculty and campus staff', 'Saturday', '5:30 pm', 30000],
  ['Siksharthakam', 1, 'Foundational online course for new people', 'Sunday', '8:00 pm', 25000],
  ['Arjun Sabha', 2, 'Deeper study and sadhana commitment', 'Wednesday', '6:30 pm', 45000],
  ['Alumni Preaching', 2, 'Alumni and working professionals group', 'Saturday', '8:00 pm', 60000],
  ['Narad Sabha', 3, 'Preachers in training with service responsibility', 'Monday', '6:00 pm', 55000],
  ['Gaurvani Sabha', 3, 'Senior sadhakas leading classes and outreach', 'Friday', '6:30 pm', 35000]
];

const GAURAVANI_LIST = [
  { sn: 1, name: 'Purushottam Chandra pr', phone: '9599406925', residence: 'Nilachal Dham BACE', mode: 'Offline at BACE' },
  { sn: 2, name: 'Audarya Gaur pr', phone: '9971932510', residence: 'Jia Sarai BACE', mode: 'Offline at BACE', role: 'Coordinator' },
  { sn: 3, name: 'Sakshi Paramatma pr', phone: '7292046236', residence: 'Jia Sarai BACE', mode: 'Offline at BACE' },
  { sn: 4, name: 'Daksha Chaitanya pr', phone: '9599507579', residence: 'Home at Delhi', mode: 'Offline at BACE' },
  { sn: 5, name: 'Ravindra Gaur pr', phone: '7669011901', residence: 'Chattarpur flat', mode: 'Offline at BACE' },
  { sn: 6, name: 'Yogeswara Priya pr', phone: '8376864606', residence: 'Home at Dwaraka', mode: 'Offline at BACE' },
  { sn: 7, name: 'Subal Krsnacharan pr', phone: '8287020058', residence: 'Chattarpur flat', mode: 'Offline at BACE' },
  { sn: 8, name: 'Ekachakra Nitai pr', phone: '7417705296', residence: 'Jia Sarai BACE', mode: 'Offline at BACE' },
  { sn: 9, name: 'Surya Narayana Das', phone: '7907737187', residence: 'Jia Sarai BACE', mode: 'Offline at BACE' },
  { sn: 10, name: 'Achyuta Deenabandu pr', phone: '9651539936', residence: 'Chattarpur flat', mode: 'Offline at BACE' },
  { sn: 11, name: 'Prashant pr', phone: '7355756316', residence: 'Jia Sarai BACE', mode: 'Offline at BACE', role: 'Secretary' },
  { sn: 12, name: 'Hemant pr', phone: '7357480250', residence: 'Jia Sarai BACE', mode: 'Offline at BACE' },
  { sn: 13, name: 'Adbut Gaur pr', phone: '9999624233', residence: 'Home at Baddarpur', mode: 'Online' },
  { sn: 14, name: 'Priya Brajesh pr', phone: '9718147152', residence: 'Post Doc. at US', mode: 'Online' },
  { sn: 15, name: 'Rupa Chaitanya pr', phone: '7827836164', residence: 'Flat at Ayodhya', mode: 'Online' },
  { sn: 16, name: 'Gaura Charan pr', phone: '7840086429', residence: 'Home at Delhi', mode: 'Online' },
  { sn: 17, name: 'Dhruva Murari pr', phone: '9536999390', residence: 'Job Hyderabad', mode: 'Online' },
  { sn: 18, name: 'Gaurav Singh pr', phone: '8130994369', residence: 'Personal Home', mode: 'Online' }
];

const NARADA_LIST = [
  { sn: 1, name: 'Janardhan Shyam pr', phone: '7054117460', residence: 'Jia Sarai BACE', mode: 'Offline at BACE' },
  { sn: 2, name: 'Swayam Bhagavan pr', phone: '8540892209', residence: 'Jia Sarai BACE', mode: 'Offline at BACE' },
  { sn: 3, name: 'Dhirendra pr', phone: '8094976774', residence: 'Jia Sarai BACE', mode: 'Offline at BACE', role: 'Coordinator' },
  { sn: 4, name: 'Harsh pr', phone: '7067628467', residence: 'Flat at Jia Sara', mode: 'Offline at BACE' },
  { sn: 5, name: 'Tryambakesh pr', phone: '8434614166', residence: 'Flat at Delhi', mode: 'Offline at BACE' },
  { sn: 6, name: 'Neteesh pr', phone: '7302700640', residence: 'Jia Sarai BACE', mode: 'Offline at BACE' },
  { sn: 7, name: 'Suraj pr', phone: '8400922410', residence: 'Jia Sarai BACE', mode: 'Offline at BACE' },
  { sn: 8, name: 'Vineet pr', phone: '7838282673', residence: 'Jia Sarai BACE', mode: 'Offline at BACE' },
  { sn: 9, name: 'Mohit pr', phone: '9896157854', residence: 'Home at Chattarpur', mode: 'Offline at BACE' },
  { sn: 10, name: 'Aman Raj pr', phone: '9508314944', residence: 'BACE Extn.', mode: 'Offline at BACE' },
  { sn: 11, name: 'Raj pr', phone: '8955121393', residence: 'Nilgiri Hostel', mode: 'Offline at BACE' },
  { sn: 12, name: 'Arpit pr', phone: '8439383371', residence: 'BACE Extn.', mode: 'Offline at BACE' },
  { sn: 13, name: 'Himanshu pr', phone: '8307673689', residence: 'BACE Extn.', mode: 'Offline at BACE' },
  { sn: 14, name: 'Sameer pr', phone: '7781998528', residence: 'BACE Extn.', mode: 'Offline at BACE' },
  { sn: 15, name: 'Suresh pr', phone: '8890057274', residence: 'Job at Nagpur', mode: 'Online', role: 'Secretary' },
  { sn: 16, name: 'Bharat pr', phone: '7060868649', residence: 'Rudrapur Gurukul', mode: 'Online' },
  { sn: 17, name: 'Yash pr', phone: '8699427745', residence: 'Job at Mumbai', mode: 'Online' },
  { sn: 18, name: 'Rachit pr', phone: '6261254227', residence: 'Home at Gwalior', mode: 'Online' },
  { sn: 19, name: 'Shivam pr', phone: '8433125397', residence: 'Home at Agra', mode: 'Online' }
];

const SENIOR = [
  'Surya Narayana Das',
  'Nitai Charan Das',
  'Madhava Priya Das',
  'Acyuta Gauranga Das',
  'Radha Ramana Das',
  'Jagannath Vallabh Das'
];

const SENIOR_ROLES = [
  'Area Leader',
  'Coordinator',
  'Internal Manager',
  'Preaching Manager',
  'Care Manager',
  'Admin'
];

const FIRST_NAMES = [
  'Rahul', 'Amit', 'Rohan', 'Vivek', 'Karan', 'Nikhil', 'Aditya', 'Siddharth', 'Manish',
  'Harsh', 'Anirudh', 'Gaurav', 'Pranav', 'Tarun', 'Yash', 'Kunal', 'Abhishek', 'Devansh',
  'Sameer', 'Ritesh', 'Varun', 'Ankit', 'Saurabh', 'Naveen', 'Mohit', 'Rakesh', 'Sanjay',
  'Deepak', 'Arjun', 'Kartik', 'Ishaan', 'Raghav', 'Vikram', 'Shubham', 'Nishant', 'Akash'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Mehta', 'Iyer', 'Nair', 'Reddy', 'Rao', 'Joshi',
  'Kulkarni', 'Desai', 'Bansal', 'Chauhan', 'Pandey', 'Tiwari', 'Mishra', 'Agarwal', 'Sinha'
];

const COLLEGES = ['IIT Delhi', 'DTU', 'NSUT', 'IIIT Delhi', 'Jamia Millia Islamia', 'DU North Campus'];
const OCCUPATIONS = ['B.Tech 1st year', 'B.Tech 2nd year', 'B.Tech 3rd year', 'B.Tech 4th year', 'M.Tech', 'PhD scholar', 'Software engineer'];

const seedCompleteData = async () => {
  try {
    await connectDB();

    console.log('🧹 Clearing old collections...');
    await Devotee.deleteMany();
    await Department.deleteMany();
    await Batch.deleteMany();
    await CareGroup.deleteMany();

    console.log('🏛️ Seeding Departments...');
    const insertedDepts = await Department.insertMany(
      DEPT_DATA.map((d, i) => ({
        customId: `dp${i + 1}`,
        name: d[0],
        desc: d[1],
        icon: d[2],
        color: d[3],
        category: d[4],
        reportFreq: d[5],
        status: 'Active',
        perf: Math.floor(Math.random() * 25) + 75,
        budget: { allocated: 30000, spent: 15000 }
      }))
    );

    console.log('📚 Seeding Batches...');
    const insertedBatches = await Batch.insertMany(
      BATCH_DATA.map((b, i) => ({
        customId: `b${i + 1}`,
        name: b[0],
        level: b[1],
        desc: b[2],
        day: b[3],
        time: b[4],
        status: 'Active',
        budget: { allocated: b[5], spent: Math.round(b[5] * 0.6) }
      }))
    );

    const gauravaniBatch = insertedBatches.find(b => b.name.includes('Gaurvani'));
    const naradaBatch = insertedBatches.find(b => b.name.includes('Narad'));
    const preachingDept = insertedDepts.find(d => d.category === 'Preaching');

    console.log('👥 Seeding Devotees...');
    const devoteesToInsert = [];

    // 1. Seed Senior leadership (6)
    for (let i = 0; i < SENIOR.length; i++) {
      const name = SENIOR[i];
      const isSurya = name.includes('Surya Narayana');
      devoteesToInsert.push({
        customId: `d_senior_${i + 1}`,
        name,
        gender: 'M',
        phone: isSurya ? '+91 7907737187' : `+91 981100223${i}`,
        email: name.toLowerCase().replace(/[^a-z0-9]/g, '.') + '@iskcon.in',
        address: 'Jia Sarai BACE',
        residence: 'Jia Sarai BACE',
        attendanceMode: 'Offline at BACE',
        occupation: 'Full-time devotee',
        org: 'IIT Delhi',
        status: 'Active',
        level: 3,
        appointment: SENIOR_ROLES[i],
        isFacilitator: true,
        dept: insertedDepts[i % insertedDepts.length]._id,
        batch: isSurya ? gauravaniBatch._id : null,
        batchRole: isSurya ? 'Member' : null,
        sadhana: { rounds: 16, morningProgram: 96, lastReported: new Date() },
        swabhav: { nature: 'Teaching', suggested: 'Preaching & facilitation', engaged: true },
        careStatus: { emotional: 'Doing well', spiritual: 'Steady' },
        attendancePct: 98
      });
    }

    // 2. Seed Gauravani Sabha Devotees (excluding Surya Narayana who is added as senior lead)
    let gauravaniCoordId = null;
    let gauravaniSecId = null;
    for (const g of GAURAVANI_LIST) {
      if (g.name.includes('Surya Narayana')) continue; // Already added above
      devoteesToInsert.push({
        name: g.name,
        gender: 'M',
        phone: `+91 ${g.phone}`,
        email: g.name.toLowerCase().replace(/[^a-z0-9]/g, '.') + '@iskcon.in',
        address: g.residence,
        residence: g.residence,
        attendanceMode: g.mode,
        batchRole: g.role || 'Member',
        org: 'IIT Delhi & Associates',
        occupation: g.residence.includes('BACE') ? 'Full-time devotee / Student' : 'Working professional / Student',
        status: 'Active',
        level: 3,
        batch: gauravaniBatch._id,
        dept: preachingDept ? preachingDept._id : null,
        appointment: g.role ? `Gaurvani Sabha ${g.role}` : null,
        isFacilitator: g.role === 'Coordinator',
        sadhana: { rounds: 16, morningProgram: g.mode === 'Online' ? 85 : 92, lastReported: new Date() },
        swabhav: { nature: 'Teaching', suggested: 'Outreach & class support', engaged: true },
        careStatus: { emotional: 'Doing well', spiritual: 'Steady' },
        attendancePct: g.mode === 'Online' ? 88 : 95
      });
    }

    // 3. Seed Narada Sabha Devotees
    for (const n of NARADA_LIST) {
      devoteesToInsert.push({
        name: n.name,
        gender: 'M',
        phone: `+91 ${n.phone}`,
        email: n.name.toLowerCase().replace(/[^a-z0-9]/g, '.') + '@iskcon.in',
        address: n.residence,
        residence: n.residence,
        attendanceMode: n.mode,
        batchRole: n.role || 'Member',
        org: 'IIT Delhi & Associates',
        occupation: n.residence.includes('BACE') ? 'Full-time devotee / Student' : 'Working professional / Student',
        status: 'Active',
        level: 3,
        batch: naradaBatch._id,
        dept: preachingDept ? preachingDept._id : null,
        appointment: n.role ? `Narad Sabha ${n.role}` : null,
        isFacilitator: n.role === 'Coordinator',
        sadhana: { rounds: 16, morningProgram: n.mode === 'Online' ? 85 : 92, lastReported: new Date() },
        swabhav: { nature: 'Teaching', suggested: 'Outreach & study circle', engaged: true },
        careStatus: { emotional: 'Doing well', spiritual: 'Steady' },
        attendancePct: n.mode === 'Online' ? 88 : 95
      });
    }

    // 4. Seed other campus students (Level 1 & 2)
    for (let i = 0; i < 40; i++) {
      const fn = FIRST_NAMES[i % FIRST_NAMES.length];
      const ln = LAST_NAMES[i % LAST_NAMES.length];
      const name = `${fn} ${ln}`;
      const level = (i % 2) + 1; // 1 or 2
      const candidateBatches = insertedBatches.filter(b => b.level === level);
      const batch = candidateBatches[i % candidateBatches.length];

      devoteesToInsert.push({
        name,
        gender: 'M',
        phone: `+91 98${String(20000000 + i).slice(0, 8)}`,
        email: `${fn.toLowerCase()}.${ln.toLowerCase()}@example.in`,
        address: 'Katwaria Sarai / Ber Sarai, New Delhi',
        residence: 'Hostel / Flat',
        attendanceMode: 'Offline at BACE',
        batchRole: 'Member',
        org: COLLEGES[i % COLLEGES.length],
        occupation: OCCUPATIONS[i % OCCUPATIONS.length],
        status: 'Active',
        level,
        batch: batch ? batch._id : null,
        dept: insertedDepts[(i + 2) % insertedDepts.length]._id,
        sadhana: { rounds: level === 2 ? 16 : 8, morningProgram: 75, lastReported: new Date() },
        swabhav: { nature: 'Organising', suggested: 'Seva volunteer', engaged: true },
        careStatus: { emotional: 'Doing well', spiritual: 'Growing' },
        attendancePct: 82
      });
    }

    const insertedDevotees = await Devotee.insertMany(devoteesToInsert);

    // Update batch coordinators & secretaries
    const audarya = insertedDevotees.find(d => d.name.includes('Audarya Gaur'));
    const prashant = insertedDevotees.find(d => d.name.includes('Prashant pr'));
    const dhirendra = insertedDevotees.find(d => d.name.includes('Dhirendra'));
    const suresh = insertedDevotees.find(d => d.name.includes('Suresh pr'));

    if (gauravaniBatch) {
      await Batch.findByIdAndUpdate(gauravaniBatch._id, {
        coordinator: audarya ? audarya._id : null,
        secretary: prashant ? prashant._id : null
      });
    }

    if (naradaBatch) {
      await Batch.findByIdAndUpdate(naradaBatch._id, {
        coordinator: dhirendra ? dhirendra._id : null,
        secretary: suresh ? suresh._id : null
      });
    }

    // Seed Care Groups
    console.log('🪷 Seeding Care Groups...');
    const careGroupsData = [
      ['Group 1 · Gaura', 'Monday', '7:30 pm', 'Temple Hall'],
      ['Group 2 · Nitai', 'Tuesday', '8:00 pm', 'Ashram Room 2'],
      ['Group 3 · Tulsi', 'Wednesday', '7:00 pm', 'Hostel Common Room'],
      ['Group 4 · Govardhan', 'Thursday', '8:30 pm', 'Temple Hall'],
      ['Group 5 · Yamuna', 'Saturday', '6:00 pm', 'Terrace'],
      ['Group 6 · Vrinda', 'Sunday', '11:00 am', 'Prasadam Hall']
    ];

    const facilitators = insertedDevotees.filter(d => d.isFacilitator);
    const careGroups = await CareGroup.insertMany(
      careGroupsData.map((cg, i) => ({
        customId: `cg${i + 1}`,
        name: cg[0],
        day: cg[1],
        time: cg[2],
        place: cg[3],
        leader: facilitators.length > 0 ? facilitators[i % facilitators.length]._id : insertedDevotees[0]._id,
        status: 'Active',
        attendance: 88
      }))
    );

    console.log(`\n🎉 Data seeding completed successfully!`);
    console.log(`   - Total Devotees in MongoDB: ${insertedDevotees.length}`);
    console.log(`   - Gaurvani Sabha Devotees: 18`);
    console.log(`   - Narad Sabha Devotees: 19`);
    console.log(`   - Departments: ${insertedDepts.length}`);
    console.log(`   - Batches: ${insertedBatches.length}`);
    console.log(`   - Care Groups: ${careGroups.length}\n`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
};

seedCompleteData();
