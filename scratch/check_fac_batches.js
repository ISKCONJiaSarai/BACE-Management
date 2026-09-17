require('dotenv').config();
const mongoose = require('mongoose');
const Devotee = require('../models/Devotee');
const Batch = require('../models/Batch');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const names = ['Bharat', 'Suresh', 'Aman Raj', 'Suraj', 'Harsh', 'Dhirendra', 'Swayam Bhagavan', 'Jitendra', 'Hemant', 'Surya'];
  for (const n of names) {
    const d = await Devotee.findOne({ name: new RegExp(n, 'i') }).populate('batch', 'name');
    console.log(n + ' -> ' + (d ? (d.name + ' | batch: ' + (d.batch ? d.batch.name : 'none') + ' | app: ' + d.appointment + ' | apps: ' + JSON.stringify(d.appointments||[])) : 'NOT FOUND'));
  }
  mongoose.disconnect();
}).catch(e => {
  console.error(e);
});
