const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  devotee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Devotee',
    required: true,
    index: true
  },
  activity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    default: null
  },
  type: {
    type: String,
    enum: ['MangalaAarti', 'SandhyaAarti', 'Class', 'CareGroup', 'Batch', 'Seva', 'Festival'],
    required: true
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'Excused'],
    default: 'Present'
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

module.exports = mongoose.model('Attendance', AttendanceSchema);
