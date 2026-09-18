const express = require('express');
const router = express.Router();
const { Expense, Department, Batch } = require('../models');

// Helper to escape regex special characters
const escapeRegex = (s) => String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Recalculate Department / Batch budget.spent from all approved/pending expenses
async function syncDeptSpent(deptId, deptName) {
  try {
    const query = {
      $or: [
        { deptId: String(deptId) },
        { deptName: String(deptName) }
      ],
      status: { $ne: 'Rejected' }
    };
    const agg = await Expense.aggregate([
      { $match: query },
      { $group: { _id: null, totalSpent: { $sum: '$amount' } } }
    ]);
    const total = agg.length > 0 ? agg[0].totalSpent : 0;

    await Department.findOneAndUpdate(
      { $or: [{ customId: String(deptId) }, { name: String(deptName) }] },
      { $set: { 'budget.spent': total } }
    );
    await Batch.findOneAndUpdate(
      { $or: [{ customId: String(deptId) }, { id: String(deptId) }, { name: String(deptName) }] },
      { $set: { 'budget.spent': total } }
    );
    return total;
  } catch (err) {
    console.error('Error syncing department/batch spent:', err);
    return 0;
  }
}

// @route   GET /api/expenses
// @desc    Get all expenses (with optional section filter) with summary stats, departments & batches
router.get('/', async (req, res) => {
  try {
    const { deptId, category, status, from, to, q, section } = req.query;

    const filter = {};
    if (section && section !== 'all') {
      filter.section = section;
    }
    if (deptId && deptId !== 'all') {
      filter.$or = [{ deptId: String(deptId) }, { deptName: new RegExp(escapeRegex(deptId), 'i') }];
    }
    if (category && category !== 'all') {
      filter.category = category;
    }
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }
    if (q && q.trim()) {
      const qReg = new RegExp(escapeRegex(q.trim()), 'i');
      filter.$or = [
        { title: qReg },
        { paidBy: qReg },
        { billRef: qReg },
        { deptName: qReg },
        { category: qReg }
      ];
    }

    const expenses = await Expense.find(filter).sort({ date: -1, createdAt: -1 });

    // Fetch all departments from Mongo to compute budgets & allocations
    const departments = await Department.find({}).select('customId name icon color category budget');

    // Build department budget summary
    const deptList = departments.map(d => {
      const allocated = (d.budget && d.budget.allocated) || 0;
      const spent = (d.budget && d.budget.spent) || 0;
      const remaining = Math.max(0, allocated - spent);
      const utilizationPct = allocated > 0 ? Math.min(100, Math.round((spent / allocated) * 100)) : 0;
      return {
        id: d.customId || String(d._id),
        mongoId: String(d._id),
        name: d.name,
        icon: d.icon || '🏛️',
        color: d.color || '#C9601B',
        category: d.category || 'General',
        allocated,
        spent,
        remaining,
        utilizationPct
      };
    });

    // Fetch all batches from Mongo to compute preaching budgets & allocations
    let batches = [];
    try {
      batches = await Batch.find({}).select('customId id name level desc day time freq budget');
    } catch (bErr) {
      console.warn('Could not fetch batches for accounts:', bErr.message);
    }
    const batchList = (batches || []).map(b => {
      const allocated = (b.budget && b.budget.allocated) || 0;
      const spent = (b.budget && b.budget.spent) || 0;
      const remaining = Math.max(0, allocated - spent);
      const utilizationPct = allocated > 0 ? Math.min(100, Math.round((spent / allocated) * 100)) : 0;
      return {
        id: b.customId || b.id || String(b._id),
        mongoId: String(b._id),
        name: b.name,
        level: b.level || 1,
        desc: b.desc || '',
        day: b.day || '',
        time: b.time || '',
        allocated,
        spent,
        remaining,
        utilizationPct
      };
    });

    // Compute overall summaries
    let totalAllocated = 0;
    let totalSpent = 0;
    deptList.forEach(d => {
      totalAllocated += d.allocated;
      totalSpent += d.spent;
    });

    // Also calculate totals directly from current expense documents
    const allExpenses = await Expense.find({ status: { $ne: 'Rejected' } });
    const directTotalSpent = allExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const approvedExpenses = allExpenses.filter(e => e.status === 'Approved' || e.status === 'Reimbursed');
    const approvedAmount = approvedExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const pendingExpenses = allExpenses.filter(e => e.status === 'Pending');
    const pendingAmount = pendingExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    if (totalSpent === 0 && directTotalSpent > 0) {
      totalSpent = directTotalSpent;
    }

    const totalRemaining = Math.max(0, totalAllocated - totalSpent);
    const overallUtilizationPct = totalAllocated > 0 ? Math.min(100, Math.round((totalSpent / totalAllocated) * 100)) : 0;

    // Dept breakdown for graphs
    const deptBreakdownMap = {};
    allExpenses.forEach(e => {
      const k = e.deptName || 'General';
      deptBreakdownMap[k] = (deptBreakdownMap[k] || 0) + Number(e.amount || 0);
    });
    const deptBreakdown = Object.entries(deptBreakdownMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Category breakdown for graphs
    const catBreakdownMap = {};
    allExpenses.forEach(e => {
      const c = e.category || 'Miscellaneous';
      catBreakdownMap[c] = (catBreakdownMap[c] || 0) + Number(e.amount || 0);
    });
    const categoryBreakdown = Object.entries(catBreakdownMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    const topDept = deptBreakdown[0] || { name: 'None', amount: 0 };

    res.json({
      success: true,
      count: expenses.length,
      expenses,
      departments: deptList,
      batches: batchList,
      summary: {
        totalAllocated,
        totalSpent,
        totalRemaining,
        overallUtilizationPct,
        approvedCount: approvedExpenses.length,
        approvedAmount,
        pendingCount: pendingExpenses.length,
        pendingAmount,
        topDept,
        deptBreakdown,
        categoryBreakdown
      }
    });
  } catch (err) {
    console.error('Error fetching expenses:', err);
    res.status(500).json({ success: false, message: 'Server error loading expenses', error: err.message });
  }
});

// @route   POST /api/expenses
// @desc    Create a new expense and update department spent
router.post('/', async (req, res) => {
  try {
    const {
      section,
      deptId,
      deptName,
      title,
      category,
      amount,
      date,
      paidBy,
      paymentMode,
      billRef,
      status,
      notes,
      receiptUrl
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Expense title is required' });
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid positive amount is required' });
    }

    const count = await Expense.countDocuments();
    const customId = `exp-${Date.now().toString().slice(-4)}-${count + 1}`;

    let effSection = section;
    if (!effSection) {
      const isPreach = (deptName && (
        deptName.toLowerCase().includes('preaching') ||
        deptName.toLowerCase().includes('taksharya') ||
        deptName.toLowerCase().includes('sreshtha') ||
        deptName.toLowerCase().includes('sabha') ||
        deptName.toLowerCase().includes('siksharthakam')
      ));
      effSection = isPreach ? 'preaching' : 'departments';
    }

    const newExpense = new Expense({
      customId,
      section: effSection,
      deptId: deptId || 'dp1',
      deptName: deptName || 'General Department',
      title: title.trim(),
      category: category ? category.trim() : 'General',
      amount: numAmount,
      date: date || new Date().toISOString().slice(0, 10),
      paidBy: paidBy ? paidBy.trim() : 'BACE Cashier',
      paymentMode: paymentMode || 'UPI',
      billRef: billRef ? billRef.trim() : '',
      status: status || 'Approved',
      notes: notes ? notes.trim() : '',
      receiptUrl: receiptUrl ? receiptUrl.trim() : ''
    });

    await newExpense.save();

    // Recalculate and persist updated department spent
    await syncDeptSpent(newExpense.deptId, newExpense.deptName);

    res.status(201).json({
      success: true,
      message: 'Expense recorded successfully in MongoDB',
      expense: newExpense
    });
  } catch (err) {
    console.error('Error creating expense:', err);
    res.status(500).json({ success: false, message: 'Server error saving expense', error: err.message });
  }
});

// @route   PUT /api/expenses/:id
// @desc    Update an existing expense
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (updateData.amount) {
      updateData.amount = Number(updateData.amount);
    }

    let expense = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      expense = await Expense.findById(id);
    }
    if (!expense) {
      expense = await Expense.findOne({ customId: id });
    }

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    const oldDeptId = expense.deptId;
    const oldDeptName = expense.deptName;

    Object.assign(expense, updateData);
    await expense.save();

    // Resync department spent
    await syncDeptSpent(expense.deptId, expense.deptName);
    if (oldDeptId !== expense.deptId || oldDeptName !== expense.deptName) {
      await syncDeptSpent(oldDeptId, oldDeptName);
    }

    res.json({
      success: true,
      message: 'Expense updated successfully in MongoDB',
      expense
    });
  } catch (err) {
    console.error('Error updating expense:', err);
    res.status(500).json({ success: false, message: 'Server error updating expense', error: err.message });
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete an expense
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let expense = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      expense = await Expense.findById(id);
    }
    if (!expense) {
      expense = await Expense.findOne({ customId: id });
    }

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    const deptId = expense.deptId;
    const deptName = expense.deptName;

    await Expense.deleteOne({ _id: expense._id });

    // Resync department spent
    await syncDeptSpent(deptId, deptName);

    res.json({
      success: true,
      message: 'Expense deleted successfully from MongoDB'
    });
  } catch (err) {
    console.error('Error deleting expense:', err);
    res.status(500).json({ success: false, message: 'Server error deleting expense', error: err.message });
  }
});

// @route   PUT /api/expenses/budget/:deptId
// @desc    Update department or batch allocated budget
router.put('/budget/:deptId', async (req, res) => {
  try {
    const { deptId } = req.params;
    const { allocated } = req.body;
    const numAllocated = Number(allocated);
    if (isNaN(numAllocated) || numAllocated < 0) {
      return res.status(400).json({ success: false, message: 'Valid non-negative allocated budget is required' });
    }

    let dept = null;
    if (deptId.match(/^[0-9a-fA-F]{24}$/)) {
      dept = await Department.findById(deptId);
    }
    if (!dept) {
      dept = await Department.findOne({ customId: deptId });
    }
    if (!dept) {
      dept = await Department.findOne({ name: new RegExp('^' + escapeRegex(deptId) + '$', 'i') });
    }

    if (dept) {
      dept.budget = dept.budget || {};
      dept.budget.allocated = numAllocated;
      await dept.save();
      return res.json({
        success: true,
        message: `Updated allocated budget for ${dept.name} to ₹${numAllocated.toLocaleString('en-IN')}`,
        department: dept
      });
    }

    let batch = null;
    if (deptId.match(/^[0-9a-fA-F]{24}$/)) {
      batch = await Batch.findById(deptId);
    }
    if (!batch) {
      batch = await Batch.findOne({ $or: [{ customId: deptId }, { id: deptId }] });
    }
    if (!batch) {
      batch = await Batch.findOne({ name: new RegExp('^' + escapeRegex(deptId) + '$', 'i') });
    }

    if (batch) {
      batch.budget = batch.budget || {};
      batch.budget.allocated = numAllocated;
      await batch.save();
      return res.json({
        success: true,
        message: `Updated allocated budget for ${batch.name} to ₹${numAllocated.toLocaleString('en-IN')}`,
        batch
      });
    }

    return res.status(404).json({ success: false, message: 'Department or Batch not found' });
  } catch (err) {
    console.error('Error updating budget:', err);
    res.status(500).json({ success: false, message: 'Server error updating budget', error: err.message });
  }
});

// @route   DELETE /api/expenses/clear-all
// @desc    Clear all expenses and reset department/batch spent amounts
router.delete('/clear-all', async (req, res) => {
  try {
    const deleted = await Expense.deleteMany({});

    // Reset budget.spent on all departments and batches
    await Department.updateMany({}, { $set: { 'budget.spent': 0 } });
    await Batch.updateMany({}, { $set: { 'budget.spent': 0 } });

    res.json({
      success: true,
      message: `Cleared ${deleted.deletedCount} expenses and reset all spent budgets to 0`,
      count: deleted.deletedCount
    });
  } catch (err) {
    console.error('Error clearing expenses:', err);
    res.status(500).json({ success: false, message: 'Server error clearing expenses', error: err.message });
  }
});

module.exports = router;
