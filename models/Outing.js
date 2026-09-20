const mongoose = require('mongoose');

const OutingSchema = new mongoose.Schema({
  customId: {
    type: String,
    unique: true,
    sparse: true
  },
  name: {
    type: String,
    required: [true, 'Outing title is required'],
    trim: true
  },
  category: {
    type: String,
    default: 'Nature Walk & Picnic',
    trim: true
  },
  date: {
    type: String,
    required: [true, 'Outing date is required']
  },
  location: {
    type: String,
    required: [true, 'Location / Venue is required'],
    trim: true
  },
  coordinator: {
    type: String,
    default: 'd1',
    trim: true
  },
  batch: {
    type: String,
    default: 'all',
    trim: true
  },
  status: {
    type: String,
    enum: ['Upcoming', 'Completed', 'Planning'],
    default: 'Upcoming'
  },
  highlights: {
    type: [String],
    default: []
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  attendees: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Outing || mongoose.model('Outing', OutingSchema);
