const mongoose = require('mongoose');

const FollowupSchema = new mongoose.Schema({
  customId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  kind: {
    type: String,
    enum: ['Preaching', 'Care'],
    default: 'Preaching'
  },
  subject: {
    type: String, // Devotee ID, Contact ID, or Name
    required: [true, 'Subject/Person is required'],
    trim: true
  },
  subjectName: {
    type: String,
    trim: true
  },
  assigned: {
    type: String, // Devotee ID or Facilitator name
    trim: true
  },
  purpose: {
    type: String,
    trim: true,
    default: 'Follow-up'
  },
  due: {
    type: String, // YYYY-MM-DD
    trim: true
  },
  last: {
    type: String, // YYYY-MM-DD
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  batch: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Followup', FollowupSchema);
