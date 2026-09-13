const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const loadAppConfig = require('../config/env');
const { Devotee, Batch, Department } = require('../models');

dotenv.config();
loadAppConfig();

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

const updateBatches = async () => {
  try {
    await connectDB();

    console.log('🔍 Looking up Narad Sabha and Gaurvani Sabha batches...');
    let gauravaniBatch = await Batch.findOne({ name: { $regex: /gaur.*vani/i } });
    let naradaBatch = await Batch.findOne({ name: { $regex: /narad/i } });

    if (!gauravaniBatch) {
      console.log('Creating Gaurvani Sabha batch...');
      gauravaniBatch = await Batch.create({
        name: 'Gaurvani Sabha',
        level: 3,
        desc: 'Senior sadhakas leading classes and outreach',
        day: 'Friday',
        time: '6:30 pm',
        status: 'Active'
      });
    }

    if (!naradaBatch) {
      console.log('Creating Narad Sabha batch...');
      naradaBatch = await Batch.create({
        name: 'Narad Sabha',
        level: 3,
        desc: 'Preachers in training with service responsibility',
        day: 'Monday',
        time: '6:00 pm',
        status: 'Active'
      });
    }

    console.log(`📌 Found Gaurvani Sabha ID: ${gauravaniBatch._id}`);
    console.log(`📌 Found Narad Sabha ID: ${naradaBatch._id}`);

    // Remove previous devotees belonging to these batches
    console.log('\n🧹 Removing previous data of these respective batches...');
    const delGauravani = await Devotee.deleteMany({ batch: gauravaniBatch._id });
    const delNarada = await Devotee.deleteMany({ batch: naradaBatch._id });
    console.log(`   - Deleted ${delGauravani.deletedCount} previous devotees from Gaurvani Sabha`);
    console.log(`   - Deleted ${delNarada.deletedCount} previous devotees from Narad Sabha`);

    // Fetch preaching/education department for default link
    const preachingDept = await Department.findOne({ category: 'Preaching' });

    // Helper to insert batch devotees
    const insertDevoteesForBatch = async (list, batchDoc) => {
      let coordinatorDoc = null;
      let secretaryDoc = null;
      const createdDocs = [];

      for (const item of list) {
        const cleanName = item.name.trim();
        const email = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '.') + '@iskcon.in';
        const role = item.role || 'Member';
        const isSurya = cleanName.includes('Surya Narayana');

        // Check if a devotee with same name or phone already exists in other batches
        let devotee = await Devotee.findOne({
          $or: [{ name: cleanName }, { phone: `+91 ${item.phone}` }]
        });

        const devoteePayload = {
          name: cleanName,
          gender: 'M',
          phone: `+91 ${item.phone}`,
          email,
          address: item.residence,
          residence: item.residence,
          attendanceMode: item.mode,
          batchRole: role,
          org: 'IIT Delhi & Associates',
          occupation: isSurya ? 'Full-time devotee' : (item.residence.includes('BACE') ? 'Full-time devotee / Student' : 'Working professional / Student'),
          status: 'Active',
          level: 3,
          batch: batchDoc._id,
          dept: preachingDept ? preachingDept._id : null,
          appointment: isSurya ? 'Area Leader' : (role === 'Coordinator' ? `${batchDoc.name} Coordinator` : (role === 'Secretary' ? `${batchDoc.name} Secretary` : null)),
          isFacilitator: role === 'Coordinator' || isSurya,
          availability: 'Anytime',
          sadhana: {
            rounds: 16,
            morningProgram: isSurya ? 98 : (item.mode === 'Online' ? 85 : 92),
            lastReported: new Date()
          },
          swabhav: {
            nature: isSurya ? 'Teaching' : (role === 'Coordinator' ? 'Organising' : 'Teaching'),
            suggested: 'Class, study facilitation and outreach',
            interests: ['Reading', 'Kirtan', 'Preaching'],
            engaged: true
          },
          careStatus: {
            emotional: 'Doing well',
            spiritual: 'Steady'
          },
          attendancePct: item.mode === 'Online' ? 88 : 95
        };

        if (devotee) {
          // Update existing
          devotee = await Devotee.findByIdAndUpdate(devotee._id, devoteePayload, { new: true });
        } else {
          devotee = await Devotee.create(devoteePayload);
        }

        createdDocs.push(devotee);

        if (role === 'Coordinator') coordinatorDoc = devotee;
        if (role === 'Secretary') secretaryDoc = devotee;
      }

      // Update Batch document coordinator and secretary
      await Batch.findByIdAndUpdate(batchDoc._id, {
        coordinator: coordinatorDoc ? coordinatorDoc._id : null,
        secretary: secretaryDoc ? secretaryDoc._id : null
      });

      return { createdDocs, coordinatorDoc, secretaryDoc };
    };

    console.log('\n📥 Inserting updated Gaurvani Sabha devotees (18 members)...');
    const gauravaniResult = await insertDevoteesForBatch(GAURAVANI_LIST, gauravaniBatch);
    console.log(`✅ Gaurvani Sabha updated: ${gauravaniResult.createdDocs.length} devotees`);
    console.log(`   - Coordinator: ${gauravaniResult.coordinatorDoc ? gauravaniResult.coordinatorDoc.name : 'N/A'}`);
    console.log(`   - Secretary: ${gauravaniResult.secretaryDoc ? gauravaniResult.secretaryDoc.name : 'N/A'}`);

    console.log('\n📥 Inserting updated Narad Sabha devotees (19 members)...');
    const naradaResult = await insertDevoteesForBatch(NARADA_LIST, naradaBatch);
    console.log(`✅ Narad Sabha updated: ${naradaResult.createdDocs.length} devotees`);
    console.log(`   - Coordinator: ${naradaResult.coordinatorDoc ? naradaResult.coordinatorDoc.name : 'N/A'}`);
    console.log(`   - Secretary: ${naradaResult.secretaryDoc ? naradaResult.secretaryDoc.name : 'N/A'}`);

    const totalDevotees = await Devotee.countDocuments();
    console.log(`\n🎉 All done! Total Devotees in MongoDB: ${totalDevotees}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating batches:', error);
    process.exit(1);
  }
};

updateBatches();
