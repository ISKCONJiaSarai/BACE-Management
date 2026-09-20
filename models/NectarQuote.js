const mongoose = require('mongoose');

const NectarQuoteSchema = new mongoose.Schema({
  customId: {
    type: String,
    unique: true,
    sparse: true
  },
  quote: {
    type: String,
    required: [true, 'Quote text is required'],
    trim: true
  },
  citation: {
    type: String,
    required: [true, 'Citation is required'],
    trim: true
  },
  topic: {
    type: String,
    default: 'General Vani',
    trim: true
  },
  order: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('NectarQuote', NectarQuoteSchema);
