const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
  customId: {
    type: String,
    unique: true,
    sparse: true
  },
  name: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true
  },
  desc: {
    type: String,
    trim: true
  },
  icon: {
    type: String,
    default: '🏛️'
  },
  color: {
    type: String,
    default: '#C9601B'
  },
  category: {
    type: String,
    trim: true
  },
  reportFreq: {
    type: String,
    enum: ['Daily', 'Weekly', 'Fortnightly', 'Monthly'],
    default: 'Weekly'
  },
  head: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  incharge: {
    type: String,
    default: ''
  },
  module: {
    type: String,
    default: null
  },
  assistants: [{
    type: mongoose.Schema.Types.Mixed
  }],
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Archived'],
    default: 'Active'
  },
  perf: {
    type: Number,
    min: 0,
    max: 100,
    default: 80
  },
  budget: {
    allocated: { type: Number, default: 0 },
    spent: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Department', DepartmentSchema);
