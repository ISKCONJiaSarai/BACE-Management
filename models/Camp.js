const mongoose = require('mongoose');

const CampSchema = new mongoose.Schema({
  customId: {
    type: String,
    unique: true,
    sparse: true
  },
  name: {
    type: String,
    required: [true, 'Camp / Retreat name is required'],
    trim: true
  },
  type: {
    type: String,
    default: 'Annual Dham Retreat',
    trim: true
  },
  badge: {
    type: String,
    default: 'Retreat',
    trim: true
  },
  dates: {
    type: String,
    default: '',
    trim: true
  },
  startDate: {
    type: String,
    default: ''
  },
  endDate: {
    type: String,
    default: ''
  },
  loc: {
    type: String,
    default: '',
    trim: true
  },
  lead: {
    type: String,
    default: 'HG Audarya Gour Das',
    trim: true
  },
  desc: {
    type: String,
    default: '',
    trim: true
  },
  participants: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Open', 'Annual', 'Completed', 'Upcoming', 'Planning'],
    default: 'Open'
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Camp || mongoose.model('Camp', CampSchema);
