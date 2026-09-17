const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  devotee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Devotee',
    required: false,
    index: true
  },
  activity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    default: null
  },
  type: {
    type: String,
    enum: ['MangalaAarti', 'SandhyaAarti', 'Class', 'CareGroup', 'Batch', 'Seva', 'Festival', 'Morning programme'],
    required: true,
    index: true
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  },
  dateStr: {
    type: String,
    index: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'Excused', 'On Time', 'Grace'],
    default: 'Present'
  },
  timeIn: {
    type: String,
    trim: true
  },
  timeInMin: {
    type: Number
  },
  standardTime: {
    type: String,
    trim: true
  },
  diffMin: {
    type: Number
  },
  ref: {
    type: String,
    index: true,
    trim: true
  },
  qrVerified: {
    type: Boolean,
    default: false
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Devotee'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

AttendanceSchema.index({ devotee: 1, type: 1, dateStr: 1 }, { unique: false });

module.exports = mongoose.model('Attendance', AttendanceSchema);
