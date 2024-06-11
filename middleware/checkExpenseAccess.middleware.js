const Expense = require('../models/Expense.model')

const checkExpenseAccess = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.payload._id;

  try {
    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (expense.paidBy.toString() === userId || expense.splitWith.includes(userId)) {
      req.expense = expense; // Attach the expense to the request object for next middleware(CreatedBy&PaidBy)
      next();
    } else {
      res.status(403).json({ error: 'Forbidden: you are not a member of the group' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const checkExpenseEditPermission = async (req, res, next) => {
  const userId = req.payload._id;

  try {
    if (
      req.expense.createdBy.toString() === userId ||
      req.expense.paidBy.toString() === userId
    ) {
      next();
    } else {
      res.status(403).json({ error: 'Forbidden: You do not have permission to edit or delete this expense' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  checkExpenseAccess,
  checkExpenseEditPermission
};
