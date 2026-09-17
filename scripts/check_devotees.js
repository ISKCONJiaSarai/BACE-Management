require('dotenv').config();
const mongoose = require('mongoose');
require('../models/Batch');
require('../models/Department');
require('../models/CareGroup');
const Devotee = require('../models/Devotee');


mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const total = await Devotee.countDocuments();
  console.log('TOTAL DEVOTEES IN DB:', total);

  // Get 3 samples (excluding the area leader)
  const sample = await Devotee.find({ appointment: { $ne: 'BACE Administrator' } })
    .populate('batch', 'name level')
    .populate('dept', 'name')
    .populate('careGroup', 'name')
    .populate('facilitator', 'name')
    .limit(3);

  sample.forEach(d => {
    console.log('\n--- ' + d.name + ' ---');
    console.log('  gender:', d.gender);
    console.log('  phone:', d.phone);
    console.log('  email:', d.email);
    console.log('  batch:', JSON.stringify(d.batch));
    console.log('  dept:', JSON.stringify(d.dept));
    console.log('  careGroup:', JSON.stringify(d.careGroup));
    console.log('  facilitator:', JSON.stringify(d.facilitator));
    console.log('  status:', d.status);
    console.log('  level:', d.level);
    console.log('  customId:', d.customId);
  });

  // Also check the GET /api/devotees endpoint structure
  console.log('\n\n=== CHECKING /api/devotees ROUTE ===');
  const { DevoteeRouter } = require('./routes/devoteeRoutes');
  mongoose.disconnect();
}).catch(e => {
  console.error('ERROR:', e.message);
  mongoose.disconnect();
});
