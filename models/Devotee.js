const mongoose = require('mongoose');

// Sub-schema: Sadhana Tracking
const SadhanaSubSchema = new mongoose.Schema({
  rounds: {
    type: Number,
    default: 0,
    min: [0, 'Rounds cannot be negative'],
    max: [64, 'Rounds cannot exceed 64']
  },
  morningProgram: {
    type: Number, // Percentage 0 - 100
    default: 0,
    min: 0,
    max: 100
  },
  lastReported: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Sub-schema: Swabhav & Nature
const SwabhavSubSchema = new mongoose.Schema({
  nature: {
    type: String,
    trim: true,
    enum: [
      'Music', 'Organising', 'Teaching', 'Design',
      'Cooking', 'Writing', 'Numbers', 'Building',
      'Hospitality', 'Gardening', 'Other'
    ],
    default: 'Teaching'
  },
  suggested: {
    type: String,
    trim: true
  },
  interests: [{
    type: String,
    trim: true
  }],
  engaged: {
    type: Boolean,
    default: false
  }
}, { _id: false });

// Sub-schema: Care & Well-being Status
const CareStatusSubSchema = new mongoose.Schema({
  emotional: {
    type: String,
    enum: ['Doing well', 'Needs attention', 'Follow-up required', 'Critical', 'Not assessed'],
    default: 'Doing well'
  },
  spiritual: {
    type: String,
    enum: ['Steady', 'Growing', 'Irregular', 'Struggling', 'Not assessed'],
    default: 'Steady'
  },
  notes: {
    type: String,
    trim: true
  },
  lastChecked: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Sub-schema: Devotee Journey Timeline
const TimelineItemSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Milestone', 'Award', 'LevelUp', 'SevaAssigned', 'CareCall', 'Note'],
    default: 'Note'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  desc: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// Sub-schema: Assignment Transition History (Batch/Dept/Mentor transitions)
const HistoryRecordSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Batch', 'Department', 'Facilitator', 'Mentor', 'Role', 'Status'],
    required: true
  },
  from: {
    type: String,
    trim: true
  },
  to: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  changedBy: {
    type: String,
    trim: true
  }
});

// Primary Devotee Schema
const DevoteeSchema = new mongoose.Schema({
  // Custom identifier (e.g. 'd1', 'd2') for backwards compatibility with static frontend
  customId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Devotee name is required'],
    trim: true,
    index: true
  },
  gender: {
    type: String,
    enum: ['M', 'F', 'Other'],
    default: 'M'
  },
  dob: {
    type: Date
  },
  phone: {
    type: String,
    trim: true,
    index: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    index: true
  },
  address: {
    type: String,
    trim: true
  },
  occupation: {
    type: String,
    trim: true,
    default: 'Student'
  },
  org: {
    type: String,
    trim: true, // College or Workplace (e.g. IIT Delhi, DTU, NSUT)
    default: 'IIT Delhi'
  },
  emergency: {
    type: String,
    trim: true
  },
  joined: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Active', 'New', 'Inactive', 'Alumni'],
    default: 'New',
    index: true
  },
  level: {
    type: Number,
    enum: [0, 1, 2, 3], // 0: Contact/Seeker, 1: Beginner, 2: Intermediate, 3: Senior/Committed
    default: 0,
    index: true
  },

  // Organizational & Care Relationships
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    default: null
  },
  residence: {
    type: String,
    trim: true
  },
  attendanceMode: {
    type: String,
    enum: ['Offline at BACE', 'Online', 'Hybrid'],
    default: 'Offline at BACE'
  },
  batchRole: {
    type: String,
    enum: ['Coordinator', 'Secretary', 'Member'],
    default: 'Member'
  },
  careGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CareGroup',
    default: null
  },
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Devotee'
  }],
  facilitator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Devotee',
    default: null
  },
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Devotee',
    default: null
  },
  dept: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null
  },

  // Seva / Service Details
  service: {
    type: String,
    trim: true
  },
  serviceRole: {
    type: String,
    enum: ['Lead', 'Coordinator', 'Volunteer', 'Member', null],
    default: null
  },
  serviceStart: {
    type: Date,
    default: null
  },
  skills: [{
    type: String,
    trim: true
  }],
  availability: {
    type: String,
    enum: ['Weekday mornings', 'Weekday evenings', 'Weekends', 'Anytime'],
    default: 'Weekends'
  },

  // Seniority & Leadership Appointments
  appointment: {
    type: String,
    trim: true, // e.g. 'Area Leader', 'Coordinator', 'Department Head', 'Internal Manager'
    default: null
  },
  isFacilitator: {
    type: Boolean,
    default: false
  },

  // Nested structured metrics
  sadhana: {
    type: SadhanaSubSchema,
    default: () => ({})
  },
  swabhav: {
    type: SwabhavSubSchema,
    default: () => ({})
  },
  careStatus: {
    type: CareStatusSubSchema,
    default: () => ({})
  },

  // Outreach & Conversion Metrics
  firstContact: {
    type: Date,
    default: Date.now
  },
  source: {
    type: String,
    enum: [
      'Book distribution', 'Friend referral', 'Campus stall',
      'Instagram', 'Class visit', 'Prasadam distribution',
      'Festival', 'Hostel outreach', 'Alumni network', 'Other'
    ],
    default: 'Book distribution'
  },
  attendancePct: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  // Journey logs
  timeline: [TimelineItemSchema],
  history: [HistoryRecordSchema]

}, {
  timestamps: true, // Automatically manages createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Text index for unified full-text search
DevoteeSchema.index({
  name: 'text',
  email: 'text',
  phone: 'text',
  org: 'text',
  service: 'text'
});

// Virtual for initials (e.g. "Gopal Das" -> "GD")
DevoteeSchema.virtual('initials').get(function() {
  if (!this.name) return '?';
  return this.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
});

const Devotee = mongoose.model('Devotee', DevoteeSchema);

module.exports = Devotee;
