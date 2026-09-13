const mongoose = require('mongoose');

const BatchSchema = new mongoose.Schema({
  customId: {
    type: String,
    unique: true,
    sparse: true
  },
  name: {
    type: String,
    required: [true, 'Batch name is required'],
    trim: true
  },
  level: {
    type: Number,
    enum: [1, 2, 3],
    required: true
  },
  desc: {
    type: String,
    trim: true
  },
  day: {
    type: String,
    enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    default: 'Sunday'
  },
  time: {
    type: String,
    trim: true
  },
  freq: {
    type: String,
    default: 'Weekly'
  },
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Paused'],
    default: 'Active'
  },
  coordinator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Devotee',
    default: null
  },
  secretary: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Devotee',
    default: null
  },
  facilitators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Devotee'
  }],
  budget: {
    allocated: { type: Number, default: 0 },
    spent: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Batch', BatchSchema);
