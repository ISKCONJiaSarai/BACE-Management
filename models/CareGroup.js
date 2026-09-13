const mongoose = require('mongoose');

const MeetingLogSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now
  },
  present: {
    type: Number,
    default: 0
  },
  note: {
    type: String,
    trim: true
  }
}, { _id: false });

const CareGroupSchema = new mongoose.Schema({
  customId: {
    type: String,
    unique: true,
    sparse: true
  },
  name: {
    type: String,
    required: [true, 'Care group name is required'],
    trim: true
  },
  leader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Devotee',
    required: true
  },
  facilitator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Devotee'
  },
  freq: {
    type: String,
    default: 'Weekly'
  },
  day: {
    type: String,
    default: 'Monday'
  },
  time: {
    type: String,
    default: '7:30 pm'
  },
  place: {
    type: String,
    default: 'Temple Hall'
  },
  status: {
    type: String,
    enum: ['Active', 'Paused', 'Disbanded'],
    default: 'Active'
  },
  desc: {
    type: String,
    default: 'Weekly gathering with japa, reading and prasadam.'
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Devotee'
  }],
  attendance: {
    type: Number,
    min: 0,
    max: 100,
    default: 75
  },
  meetings: [MeetingLogSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('CareGroup', CareGroupSchema);
