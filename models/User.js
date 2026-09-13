const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  devotee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Devotee',
    required: true
  },
  role: {
    type: String,
    enum: [
      'area_leader',
      'coordinator',
      'internal_manager',
      'preaching_manager',
      'care_manager',
      'admin',
      'devotee'
    ],
    default: 'devotee'
  },
  active: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
