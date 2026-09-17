require('dotenv').config();
const mongoose = require('mongoose');
const Devotee = require('../models/Devotee');
const Batch = require('../models/Batch');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const tak = await Batch.findOne({ name: 'Taksharya' });
  const allDevsInTak = await Devotee.find({ batch: tak._id });
  const facsInTak = allDevsInTak.filter(d => {
    const app = (d.appointment || '') + ' ' + (d.appointments || []).join(' ');
    return /facilitator/i.test(app);
  });
  console.log('Facilitators belonging to Taksharya (' + facsInTak.length + '):');
  facsInTak.forEach(f => console.log(' -', f.name, f.phone));

  // Also check b.facilitators in Taksharya
  console.log('Taksharya b.facilitators:', tak.facilitators);

  mongoose.disconnect();
}).catch(e => {
  console.error(e);
});
