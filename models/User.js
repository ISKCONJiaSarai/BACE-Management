const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true,
    sparse: true
  },
  email: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true,
    sparse: true
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  avatar: {
    type: String
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId;
    }
  },
  devotee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Devotee'
  },
  role: {
    type: String,
    enum: [
      'area_leader',
      'coordinator',
      'internal_manager',
      'preaching_manager',
      'care_manager',
      'dept_head',
      'preaching_coord',
      'facilitator',
      'admin',
      'devotee'
    ],
    default: 'devotee'
  },
  roles: [{
    type: String,
    trim: true
  }],
  active: {
    type: Boolean,
    default: true
  },
  approvalStatus: {
    type: String,
    enum: ['pending_profile', 'pending_approval', 'approved', 'rejected'],
    default: 'pending_profile'
  },
  profileCompleted: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
