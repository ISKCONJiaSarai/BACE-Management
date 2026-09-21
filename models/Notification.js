const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  customId: {
    type: String,
    unique: true,
    sparse: true
  },
  devoteeId: {
    type: String,
    default: 'all',
    trim: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true
  },
  body: {
    type: String,
    required: [true, 'Notification body is required'],
    trim: true
  },
  em: {
    type: String,
    default: '🔔',
    trim: true
  },
  category: {
    type: String,
    enum: ['Management', 'Preaching', 'Care', 'Messages', 'Community', 'General'],
    default: 'General'
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  date: {
    type: String,
    default: () => new Date().toISOString()
  },
  link: {
    type: String,
    default: '',
    trim: true
  },
  dismissed: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', NotificationSchema);
