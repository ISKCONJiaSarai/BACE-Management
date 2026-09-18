const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  customId: {
    type: String,
    unique: true,
    sparse: true
  },
  deptId: {
    type: String,
    required: [true, 'Department ID is required'],
    index: true
  },
  deptName: {
    type: String,
    required: [true, 'Department name is required'],
    index: true
  },
  section: {
    type: String,
    enum: ['preaching', 'departments'],
    default: 'departments',
    index: true
  },
  title: {
    type: String,
    required: [true, 'Expense title or description is required'],
    trim: true
  },
  category: {
    type: String,
    default: 'General',
    trim: true,
    index: true
  },
  amount: {
    type: Number,
    required: [true, 'Expense amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  date: {
    type: String,
    required: [true, 'Expense date is required'],
    default: () => new Date().toISOString().slice(0, 10),
    index: true
  },
  paidBy: {
    type: String,
    trim: true,
    default: 'BACE Cashier'
  },
  paymentMode: {
    type: String,
    enum: ['UPI', 'Cash', 'Bank Transfer', 'Card', 'Cheque', 'Other'],
    default: 'UPI'
  },
  billRef: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['Approved', 'Pending', 'Reimbursed', 'Rejected'],
    default: 'Approved',
    index: true
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  receiptUrl: {
    type: String,
    trim: true,
    default: ''
  },
  createdBy: {
    type: String,
    default: 'System'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Expense', ExpenseSchema);
