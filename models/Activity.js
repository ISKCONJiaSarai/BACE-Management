const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  customId: {
    type: String,
    unique: true,
    sparse: true
  },
  name: {
    type: String,
    required: [true, 'Activity name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['Seva', 'Service', 'Class', 'Event', 'Task', 'Responsibility'],
    default: 'Seva'
  },
  dept: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    default: null
  },
  date: {
    type: Date,
    default: Date.now
  },
  start: {
    type: String, // e.g. '04:30'
    trim: true
  },
  end: {
    type: String, // e.g. '05:15'
    trim: true
  },
  location: {
    type: String,
    trim: true,
    default: 'Temple Hall'
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Devotee'
  }],
  status: {
    type: String,
    enum: ['Scheduled', 'Assigned', 'Accepted', 'In Progress', 'Completed', 'Completed by Another', 'Missed', 'Cancelled', 'Excused'],
    default: 'Scheduled'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  need: {
    type: Number,
    default: 1
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Activity', ActivitySchema);
