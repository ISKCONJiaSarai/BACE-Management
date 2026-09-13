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
