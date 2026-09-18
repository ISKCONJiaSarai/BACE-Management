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

// Sample initial expenses for temple departments & preaching batches
const SAMPLE_EXPENSES = [
  // --- DEPARTMENTS ---
  {
    section: 'departments',
    deptId: 'dp3',
    deptName: 'Deity Department',
    title: 'Fresh Roses, Marigolds & Jasmine for Deity Garlands',
    category: 'Flowers & Garlands',
    amount: 1450,
    date: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10),
    paidBy: 'Dhirendra pr',
    paymentMode: 'UPI',
    billRef: 'FLW-2026-091',
    status: 'Approved',
    notes: 'Daily supply from Ghazipur flower market'
  },
  {
    section: 'departments',
    deptId: 'dp3',
    deptName: 'Deity Department',
    title: 'Pure Cow Ghee & Camphor for Aarti',
    category: 'Pooja Items',
    amount: 3200,
    date: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10),
    paidBy: 'Madhav Charan Das',
    paymentMode: 'Cash',
    billRef: 'GHEE-883',
    status: 'Approved',
    notes: '5kg Bilona cow ghee tin'
  },
  {
    section: 'departments',
    deptId: 'dp3',
    deptName: 'Deity Department',
    title: 'Silk Cloth for New Deity Night Dresses',
    category: 'Deity Dresses',
    amount: 2800,
    date: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10),
    paidBy: 'Tulasi Priya Dasi',
    paymentMode: 'UPI',
    billRef: 'TXT-5510',
    status: 'Approved',
    notes: 'Pure yellow and pink silk'
  },
  {
    section: 'departments',
    deptId: 'dp6',
    deptName: 'Kitchen Department',
    title: 'Sunday Feast Basmati Rice & Desi Toor Dal (50kg)',
    category: 'Bhoga & Groceries',
    amount: 6800,
    date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
    paidBy: 'Sundar Gopal Das',
    paymentMode: 'Bank Transfer',
    billRef: 'GRC-1029',
    status: 'Approved',
    notes: 'Wholesale grains from Khari Baoli'
  },
  {
    section: 'departments',
    deptId: 'dp6',
    deptName: 'Kitchen Department',
    title: 'Fresh Cottage Cheese (Paneer) & Green Vegetables',
    category: 'Fresh Vegetables',
    amount: 2450,
    date: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10),
    paidBy: 'Sundar Gopal Das',
    paymentMode: 'UPI',
    billRef: 'VEG-994',
    status: 'Approved',
    notes: '8kg fresh paneer + seasonal subji'
  },
  {
    section: 'departments',
    deptId: 'dp6',
    deptName: 'Kitchen Department',
    title: 'Commercial LPG Cylinder Refill (2 cylinders)',
    category: 'Fuel & Gas',
    amount: 3900,
    date: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
    paidBy: 'Nitin pr',
    paymentMode: 'UPI',
    billRef: 'HP-GAS-449',
    status: 'Approved',
    notes: '19kg commercial cylinders for BACE kitchen'
  },
  {
    section: 'departments',
    deptId: 'dp8',
    deptName: 'Cleaning',
    title: 'Floor Disinfectant (Lizol 5L), Harpic & Wiper Mops',
    category: 'Cleaning Supplies',
    amount: 1850,
    date: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
    paidBy: 'Dhirendra pr',
    paymentMode: 'UPI',
    billRef: 'CLN-312',
    status: 'Approved',
    notes: 'Temple hall and ashram cleaning gear'
  },
  {
    section: 'departments',
    deptId: 'dp8',
    deptName: 'Cleaning',
    title: 'Microfiber Cleaning Cloths & Heavy Duty Dustbins',
    category: 'Cleaning Supplies',
    amount: 980,
    date: new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10),
    paidBy: 'Anand pr',
    paymentMode: 'Cash',
    billRef: 'PLST-771',
    status: 'Approved',
    notes: 'Prasadam area dustbins and wipers'
  },
  {
    section: 'departments',
    deptId: 'dp10',
    deptName: 'Maintenance',
    title: 'Temple Hall LED Tube Lights & Switchboard Replacement',
    category: 'Electrical & Maintenance',
    amount: 2150,
    date: new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10),
    paidBy: 'Nitin pr',
    paymentMode: 'UPI',
    billRef: 'ELEC-414',
    status: 'Approved',
    notes: 'Energy saving 20W LED fixtures'
  },
  {
    section: 'departments',
    deptId: 'dp13',
    deptName: 'Health Care Department',
    title: 'First Aid Kit Refill & Emergency Medicines',
    category: 'Medical & First Aid',
    amount: 750,
    date: new Date(Date.now() - 11 * 86400000).toISOString().slice(0, 10),
    paidBy: 'Madhav Charan Das',
    paymentMode: 'UPI',
    billRef: 'MED-1102',
    status: 'Approved',
    notes: 'Bandages, antiseptic, ORS, paracetamol'
  },
  {
    section: 'departments',
    deptId: 'dp3',
    deptName: 'Deity Department',
    title: 'Brass Aarti Bell & Ghee Lamp Polish',
    category: 'Pooja Items',
    amount: 600,
    date: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10),
    paidBy: 'Dhirendra pr',
    paymentMode: 'Cash',
    billRef: 'PLSH-09',
    status: 'Pending',
    notes: 'Brass polisher liquid and polishing cloth'
  },
  {
    section: 'departments',
    deptId: 'dp6',
    deptName: 'Kitchen Department',
    title: 'Stainless Steel Serving Ladles & Buckets',
    category: 'Utensils',
    amount: 2200,
    date: new Date().toISOString().slice(0, 10),
    paidBy: 'Sundar Gopal Das',
    paymentMode: 'UPI',
    billRef: 'UTN-54',
    status: 'Pending',
    notes: 'Awaiting bill copy upload'
  },

  // --- PREACHING ---
  {
    section: 'preaching',
    deptId: 'b1',
    deptName: 'Taksharya',
    title: 'Youth Sunday Feast Prasadam & Paneer Sabji',
    category: 'Outreach Prasadam & Feasts',
    amount: 3200,
    date: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10),
    paidBy: 'Dhirendra pr',
    paymentMode: 'UPI',
    billRef: 'TAK-PRAS-101',
    status: 'Approved',
    notes: 'Prasadam for 45 newcomer students'
  },
  {
    section: 'preaching',
    deptId: 'b2',
    deptName: 'Sreshtha',
    title: 'IIT Delhi Campus Seminar Hall Booking & AV Sound System',
    category: 'Hall & Venue Booking',
    amount: 4500,
    date: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10),
    paidBy: 'Surya Narayana Das',
    paymentMode: 'Bank Transfer',
    billRef: 'IITD-SEM-882',
    status: 'Approved',
    notes: 'Weekend youth seminar venue and mic setup'
  },
  {
    section: 'preaching',
    deptId: 'dp1',
    deptName: 'Gita for Life Preaching',
    title: 'Course Manuals & Gita Booklets Printing (150 copies)',
    category: 'Course Manuals & Study Guides',
    amount: 4500,
    date: new Date(Date.now() - 4 * 86400000).toISOString().slice(0, 10),
    paidBy: 'Surya Narayana Das',
    paymentMode: 'Bank Transfer',
    billRef: 'PRT-8821',
    status: 'Approved',
    notes: 'Full color study guides for Level 1 batch'
  },
  {
    section: 'preaching',
    deptId: 'dp2',
    deptName: 'Sreshtha IITD Preaching',
    title: 'Campus Kirtan Sound System Cable & Mic Stand Repair',
    category: 'Sound & AV',
    amount: 1200,
    date: new Date(Date.now() - 8 * 86400000).toISOString().slice(0, 10),
    paidBy: 'Prashant pr',
    paymentMode: 'UPI',
    billRef: 'AUD-302',
    status: 'Approved',
    notes: 'XLR cables and dual mic stands'
  },
  {
    section: 'preaching',
    deptId: 'b5',
    deptName: 'Arjun Sabha',
    title: 'Bhagavad Gita As It Is Pocket Edition (60 copies for outreach)',
    category: 'Books & Literature (BBT)',
    amount: 3600,
    date: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10),
    paidBy: 'Sundar Gopal Das',
    paymentMode: 'UPI',
    billRef: 'BBT-BK-409',
    status: 'Approved',
    notes: 'Distribution to registered hostel students'
  },
  {
    section: 'preaching',
    deptId: 'b6',
    deptName: 'Alumni Preaching',
    title: 'Working Professionals Weekend Meet High-Tea & Snacks',
    category: 'Outreach Prasadam & Feasts',
    amount: 2800,
    date: new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10),
    paidBy: 'Nitin pr',
    paymentMode: 'UPI',
    billRef: 'ALM-TEA-204',
    status: 'Approved',
    notes: 'Alumni gathering catering'
  },
  {
    section: 'preaching',
    deptId: 'b7',
    deptName: 'Narad Sabha',
    title: 'Preachers Training Workshop Study Kits & Clipboards',
    category: 'Stationery & Registration Kits',
    amount: 1900,
    date: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
    paidBy: 'Madhav Charan Das',
    paymentMode: 'Cash',
    billRef: 'NAR-STN-112',
    status: 'Approved',
    notes: 'Study kits for student preachers'
  },
  {
    section: 'preaching',
    deptId: 'b8',
    deptName: 'Gaurvani Sabha',
    title: 'Campus Preaching Standees & Rollup Banners (3 units)',
    category: 'Banners, Standees & Posters',
    amount: 2400,
    date: new Date(Date.now() - 9 * 86400000).toISOString().slice(0, 10),
    paidBy: 'Dhirendra pr',
    paymentMode: 'UPI',
    billRef: 'BNR-GVR-901',
    status: 'Approved',
    notes: 'Standees for college stalls'
  },
  {
    section: 'preaching',
    deptId: 'b1',
    deptName: 'Taksharya',
    title: 'Campus Outreach Transport Auto Fare for Preaching Team',
    category: 'Transport & Travel for Preachers',
    amount: 650,
    date: new Date(Date.now() - 1 * 86400000).toISOString().slice(0, 10),
    paidBy: 'Piyush pr',
    paymentMode: 'Cash',
    billRef: 'TRV-441',
    status: 'Pending',
    notes: 'Reimbursement for JNU and IIT campus travel'
  }
];

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

    let expenses = await Expense.find(filter).sort({ date: -1, createdAt: -1 });

    // Auto-seed if database is empty so dashboard works immediately!
    if (expenses.length === 0 && (!deptId || deptId === 'all') && (!category || category === 'all') && (!section || section === 'all') && !q) {
      const totalCount = await Expense.countDocuments();
      if (totalCount === 0) {
        await Expense.insertMany(SAMPLE_EXPENSES.map((e, idx) => ({
          ...e,
          customId: `exp-${100 + idx + 1}`
        })));
        expenses = await Expense.find(filter).sort({ date: -1, createdAt: -1 });
      }
    }

    // Fetch all departments from Mongo to compute budgets & allocations
    const departments = await Department.find({}).select('customId name icon color category budget');

    // Build department budget summary
    const deptList = departments.map(d => {
      const allocated = (d.budget && d.budget.allocated) || 30000;
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
      const allocated = (b.budget && b.budget.allocated) || 40000;
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

// @route   POST /api/expenses/seed-sample
// @desc    Force re-seed sample department expenses
router.post('/seed-sample', async (req, res) => {
  try {
    const { force } = req.body;
    if (force) {
      await Expense.deleteMany({});
    } else {
      const cnt = await Expense.countDocuments();
      if (cnt > 0) {
        return res.json({ success: true, message: 'Expenses already exist, skipping seed' });
      }
    }

    const inserted = await Expense.insertMany(SAMPLE_EXPENSES.map((e, idx) => ({
      ...e,
      customId: `exp-${Date.now().toString().slice(-4)}-${idx + 1}`
    })));

    // Sync all department spent values
    const uniqueDepts = [...new Set(inserted.map(e => e.deptId))];
    for (const dId of uniqueDepts) {
      const match = inserted.find(e => e.deptId === dId);
      await syncDeptSpent(dId, match ? match.deptName : '');
    }

    res.json({
      success: true,
      message: `Successfully seeded ${inserted.length} temple department expenses`,
      count: inserted.length
    });
  } catch (err) {
    console.error('Error seeding expenses:', err);
    res.status(500).json({ success: false, message: 'Server error seeding expenses', error: err.message });
  }
});

module.exports = router;
