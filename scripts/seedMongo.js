const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const loadAppConfig = require('../config/env');
const { Devotee, Department, Batch, CareGroup, User } = require('../models');

dotenv.config();
loadAppConfig();

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
  ['Taksharya', 1, 'First-step batch for newcomers from campus outreach', 'Tuesday', '6:30 pm', 40000, 'b1'],
  ['Narad Sabha', 3, 'Preachers in training with service responsibility', 'Monday', '6:00 pm', 55000, 'b7'],
  ['Gaurvani Sabha', 3, 'Senior sadhakas leading classes and outreach', 'Friday', '6:30 pm', 35000, 'b8']
];

const GAURAVANI_LIST = [
  { sn: 1, name: 'Purushottam Chandra pr', phone: '9599406925', residence: 'Nilachal Dham BACE', mode: 'Offline at BACE', role: 'Member' },
  { sn: 2, name: 'Audarya Gaur pr', phone: '9971932510', residence: 'Jia Sarai BACE', mode: 'Offline at BACE', role: 'Coordinator' },
  { sn: 3, name: 'Sakshi Paramatma pr', phone: '7292046236', residence: 'Jia Sarai BACE', mode: 'Offline at BACE', role: 'Member' },
  { sn: 4, name: 'Daksha Chaitanya pr', phone: '9599507579', residence: 'Home at Delhi', mode: 'Offline at BACE', role: 'Member' },
  { sn: 5, name: 'Ravindra Gaur pr', phone: '7669011901', residence: 'Chattarpur flat', mode: 'Offline at BACE', role: 'Member' },
  { sn: 6, name: 'Yogeswara Priya pr', phone: '8376864606', residence: 'Home at Dwaraka', mode: 'Offline at BACE', role: 'Member' },
  { sn: 7, name: 'Subal Krsnacharan pr', phone: '8287020058', residence: 'Chattarpur flat', mode: 'Offline at BACE', role: 'Member' },
  { sn: 8, name: 'Ekachakra Nitai pr', phone: '7417705296', residence: 'Jia Sarai BACE', mode: 'Offline at BACE', role: 'Member' },
  { sn: 9, name: 'Surya Narayana Das', phone: '7907737187', residence: 'Jia Sarai BACE', mode: 'Offline at BACE', role: 'Member', isLeader: true },
  { sn: 10, name: 'Achyuta Deenabandu pr', phone: '9651539936', residence: 'Chattarpur flat', mode: 'Offline at BACE', role: 'Member' },
  { sn: 11, name: 'Prashant pr', phone: '7355756316', residence: 'Jia Sarai BACE', mode: 'Offline at BACE', role: 'Secretary' },
  { sn: 12, name: 'Hemant pr', phone: '7357480250', residence: 'Jia Sarai BACE', mode: 'Offline at BACE', role: 'Member' },
  { sn: 13, name: 'Adbut Gaur pr', phone: '9999624233', residence: 'Home at Baddarpur', mode: 'Online', role: 'Member' },
  { sn: 14, name: 'Priya Brajesh pr', phone: '9718147152', residence: 'Post Doc. at US', mode: 'Online', role: 'Member' },
  { sn: 15, name: 'Rupa Chaitanya pr', phone: '7827836164', residence: 'Flat at Ayodhya', mode: 'Online', role: 'Member' },
  { sn: 16, name: 'Gaura Charan pr', phone: '7840086429', residence: 'Home at Delhi', mode: 'Online', role: 'Member' },
  { sn: 17, name: 'Dhruva Murari pr', phone: '9536999390', residence: 'Job Hyderabad', mode: 'Online', role: 'Member' },
  { sn: 18, name: 'Gaurav Singh pr', phone: '8130994369', residence: 'Personal Home', mode: 'Online', role: 'Member' }
];

const NARADA_LIST = [
  { sn: 1, name: 'Janardhan Shyam pr', phone: '7054117460', residence: 'Jia Sarai BACE', mode: 'Offline at BACE', role: 'Member' },
  { sn: 2, name: 'Swayam Bhagavan pr', phone: '8540892209', residence: 'Jia Sarai BACE', mode: 'Offline at BACE', role: 'Member' },
  { sn: 3, name: 'Dhirendra pr', phone: '8094976774', residence: 'Jia Sarai BACE', mode: 'Offline at BACE', role: 'Coordinator' },
  { sn: 4, name: 'Harsh pr', phone: '7067628467', residence: 'Flat at Jia Sara', mode: 'Offline at BACE', role: 'Member' },
  { sn: 5, name: 'Tryambakesh pr', phone: '8434614166', residence: 'Flat at Delhi', mode: 'Offline at BACE', role: 'Member' },
  { sn: 6, name: 'Neteesh pr', phone: '7302700640', residence: 'Jia Sarai BACE', mode: 'Offline at BACE', role: 'Member', email: 'sharmaneetesh1910@gmail.com' },
  { sn: 7, name: 'Suraj pr', phone: '8400922410', residence: 'Jia Sarai BACE', mode: 'Offline at BACE', role: 'Member' },
  { sn: 8, name: 'Vineet pr', phone: '7838282673', residence: 'Jia Sarai BACE', mode: 'Offline at BACE', role: 'Member' },
  { sn: 9, name: 'Mohit pr', phone: '9896157854', residence: 'Home at Chattarpur', mode: 'Offline at BACE', role: 'Member' },
  { sn: 10, name: 'Aman Raj pr', phone: '9508314944', residence: 'BACE Extn.', mode: 'Offline at BACE', role: 'Member', email: 'amanraj101012@gmail.com' },
  { sn: 11, name: 'Raj pr', phone: '8955121393', residence: 'Nilgiri Hostel', mode: 'Offline at BACE', role: 'Member' },
  { sn: 12, name: 'Arpit pr', phone: '8439383371', residence: 'BACE Extn.', mode: 'Offline at BACE', role: 'Member' },
  { sn: 13, name: 'Himanshu pr', phone: '8307673689', residence: 'BACE Extn.', mode: 'Offline at BACE', role: 'Member' },
  { sn: 14, name: 'Sameer pr', phone: '7781998528', residence: 'BACE Extn.', mode: 'Offline at BACE', role: 'Member' },
  { sn: 15, name: 'Suresh pr', phone: '8890057274', residence: 'Job at Nagpur', mode: 'Online', role: 'Secretary' },
  { sn: 16, name: 'Bharat pr', phone: '7060868649', residence: 'Rudrapur Gurukul', mode: 'Online', role: 'Member' },
  { sn: 17, name: 'Yash pr', phone: '8699427745', residence: 'Job at Mumbai', mode: 'Online', role: 'Member', email: 'yash9704.iitd@gmail.com' },
  { sn: 18, name: 'Rachit pr', phone: '6261254227', residence: 'Home at Gwalior', mode: 'Online', role: 'Member' },
  { sn: 19, name: 'Shivam pr', phone: '8433125397', residence: 'Home at Agra', mode: 'Online', role: 'Member' }
];

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
        perf: Math.floor(Math.random() * 20) + 80,
        budget: { allocated: 30000, spent: 14000 }
      }))
    );

    console.log('📚 Seeding Batches...');
    const insertedBatches = await Batch.insertMany(
      BATCH_DATA.map(b => ({
        customId: b[6],
        name: b[0],
        level: b[1],
        desc: b[2],
        day: b[3],
        time: b[4],
        status: 'Active',
        budget: { allocated: b[5], spent: Math.round(b[5] * 0.45) }
      }))
    );

    const gauravaniBatch = insertedBatches.find(b => b.name.includes('Gaurvani'));
    const naradaBatch = insertedBatches.find(b => b.name.includes('Narad'));
    const taksharyaBatch = insertedBatches.find(b => b.name.includes('Taksharya'));
    const preachingDept = insertedDepts.find(d => d.category === 'Preaching');

    console.log('👥 Seeding Devotees (Surya Narayana Das, Gaurvani, Narad, 1 sample)...');
    const devoteesToInsert = [];

    // 1. Surya Narayana Das
    devoteesToInsert.push({
      customId: 'd1',
      name: 'Surya Narayana Das',
      gender: 'M',
      phone: '+91 7907737187',
      email: 'suryakiranjune2@gmail.com',
      address: 'Jia Sarai BACE',
      residence: 'Jia Sarai BACE',
      attendanceMode: 'Offline at BACE',
      occupation: 'Full-time devotee / PhD scholar',
      org: 'IIT Delhi',
      status: 'Active',
      level: 3,
      appointment: 'Area Leader',
      isFacilitator: true,
      batch: gauravaniBatch ? gauravaniBatch._id : null,
      batchRole: 'Member',
      dept: preachingDept ? preachingDept._id : null,
      sadhana: { rounds: 16, morningProgram: 98, lastReported: new Date() },
      swabhav: { nature: 'Teaching', suggested: 'Preaching & facilitation', engaged: true },
      careStatus: { emotional: 'Doing well', spiritual: 'Steady' },
      attendancePct: 98
    });

    // 2. Gaurvani Sabha Devotees (excluding Surya Narayana Das)
    for (const g of GAURAVANI_LIST) {
      if (g.name.includes('Surya Narayana')) continue;
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
        occupation: g.residence.includes('BACE') ? 'Full-time devotee' : 'Working professional / Student',
        status: 'Active',
        level: 3,
        batch: gauravaniBatch ? gauravaniBatch._id : null,
        dept: preachingDept ? preachingDept._id : null,
        appointment: g.role && g.role !== 'Member' ? `Gaurvani Sabha ${g.role}` : null,
        isFacilitator: g.role === 'Coordinator',
        sadhana: { rounds: 16, morningProgram: g.mode === 'Online' ? 85 : 92, lastReported: new Date() },
        swabhav: { nature: 'Teaching', suggested: 'Outreach & class support', engaged: true },
        careStatus: { emotional: 'Doing well', spiritual: 'Steady' },
        attendancePct: g.mode === 'Online' ? 88 : 95
      });
    }

    // 3. Narad Sabha Devotees
    for (const n of NARADA_LIST) {
      devoteesToInsert.push({
        name: n.name,
        gender: 'M',
        phone: `+91 ${n.phone}`,
        email: n.email || (n.name.toLowerCase().replace(/[^a-z0-9]/g, '.') + '@iskcon.in'),
        address: n.residence,
        residence: n.residence,
        attendanceMode: n.mode,
        batchRole: n.role || 'Member',
        org: 'IIT Delhi & Associates',
        occupation: n.residence.includes('BACE') ? 'Full-time devotee' : 'Working professional / Student',
        status: 'Active',
        level: 3,
        batch: naradaBatch ? naradaBatch._id : null,
        dept: preachingDept ? preachingDept._id : null,
        appointment: n.role && n.role !== 'Member' ? `Narad Sabha ${n.role}` : null,
        isFacilitator: n.role === 'Coordinator',
        sadhana: { rounds: 16, morningProgram: n.mode === 'Online' ? 85 : 92, lastReported: new Date() },
        swabhav: { nature: 'Teaching', suggested: 'Outreach & study circle', engaged: true },
        careStatus: { emotional: 'Doing well', spiritual: 'Steady' },
        attendancePct: n.mode === 'Online' ? 88 : 95
      });
    }

    // 4. Exactly 1 Sample Dummy Devotee
    devoteesToInsert.push({
      customId: 'd_sample',
      name: 'Rahul Sharma',
      gender: 'M',
      phone: '+91 9876543210',
      email: 'rahul.sharma@example.in',
      address: 'Hostel, IIT Delhi',
      residence: 'Hostel',
      attendanceMode: 'Offline at BACE',
      batchRole: 'Member',
      org: 'IIT Delhi',
      occupation: 'B.Tech 2nd year',
      status: 'Active',
      level: 1,
      batch: taksharyaBatch ? taksharyaBatch._id : null,
      dept: insertedDepts[5]._id,
      sadhana: { rounds: 4, morningProgram: 75, lastReported: new Date() },
      swabhav: { nature: 'Organising', suggested: 'Seva volunteer', engaged: true },
      careStatus: { emotional: 'Doing well', spiritual: 'Growing' },
      attendancePct: 80
    });

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

    if (taksharyaBatch) {
      await Batch.findByIdAndUpdate(taksharyaBatch._id, {
        coordinator: audarya ? audarya._id : null
      });
    }

    // Seed 1 Sample Care Group
    console.log('🪷 Seeding 1 Sample Care Group...');
    const careGroup = await CareGroup.create({
      customId: 'cg1',
      name: 'Group 1 · Gaura',
      day: 'Monday',
      time: '7:30 pm',
      place: 'Temple Hall',
      leader: audarya ? audarya._id : insertedDevotees[0]._id,
      status: 'Active',
      attendance: 85
    });

    // Relink user accounts
    console.log('🔗 Relinking real users...');
    const suryaDev = insertedDevotees.find(d => d.name === 'Surya Narayana Das');
    if (suryaDev) {
      await User.findOneAndUpdate(
        { email: 'suryakiranjune2@gmail.com' },
        { devotee: suryaDev._id, role: 'area_leader', approvalStatus: 'approved', profileCompleted: true }
      );
    }
    const amanDev = insertedDevotees.find(d => d.email === 'amanraj101012@gmail.com');
    if (amanDev) {
      await User.findOneAndUpdate(
        { email: 'amanraj101012@gmail.com' },
        { devotee: amanDev._id, approvalStatus: 'approved' }
      );
    }
    const yashDev = insertedDevotees.find(d => d.email === 'yash9704.iitd@gmail.com');
    if (yashDev) {
      await User.findOneAndUpdate(
        { email: 'yash9704.iitd@gmail.com' },
        { devotee: yashDev._id, approvalStatus: 'approved' }
      );
    }
    const neteeshDev = insertedDevotees.find(d => d.email === 'sharmaneetesh1910@gmail.com');
    if (neteeshDev) {
      await User.findOneAndUpdate(
        { email: 'sharmaneetesh1910@gmail.com' },
        { devotee: neteeshDev._id, approvalStatus: 'approved' }
      );
    }

    console.log(`\n🎉 Data seeding completed successfully!`);
    console.log(`   - Total Devotees in MongoDB: ${insertedDevotees.length} (18 Gaurvani + 19 Narad + 1 sample)`);
    console.log(`   - Gaurvani Sabha Devotees: 18`);
    console.log(`   - Narad Sabha Devotees: 19`);
    console.log(`   - Batches: 3 (Narad Sabha, Gaurvani Sabha, 1 sample Taksharya)`);
    console.log(`   - Care Groups: 1 (Group 1 · Gaura)\n`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
};

seedCompleteData();
