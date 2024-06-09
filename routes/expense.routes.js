const router = require('express').Router();
const { checkExpenseAccess, checkExpenseEditPermission } = require('../middleware/checkExpenseAccess.middleware')
const calculateSplitAmounts = require('../middleware/calculateSplitAmounts.middleware')

const Expense = require('../models/Expense.model');
const Group = require('../models/Group.model')
const Transaction = require('../models/Transaction.model')
const User = require('../models/User.model')

// Post Expense
router.post('/expenses', calculateSplitAmounts, async (req, res) => {
  const userId = req.payload._id;
  const calculatedSplitAmounts = req.calculatedSplitAmounts;

  const {
    description,
    amountPaid,
    currency,
    paidBy,
    splitWith,
    splitType,
    group,
    date
  } = req.body;

  try {
    
    let groupId = group;

    if (!group) {
      const groupName = `${description} group`
      const newGroup = await Group.create({
        name: groupName,
        owner: userId,
        members: splitWith,
      });
      groupId = newGroup._id;
      
      // Update each user's groups.member field
      await Promise.all(
        splitWith.map(user =>
          User.findByIdAndUpdate(user, { $push: { "groups.member": groupId } })
        )
      );

      // Update the owner's groups.owner field
      await User.findByIdAndUpdate(userId, { $push: { "groups.owner": groupId } });
    }


    const expense = await Expense.create({
      createdBy: userId,
      description,
      amountPaid,
      currency,
      paidBy,
      splitWith,
      splitType,
      splitAmounts: calculatedSplitAmounts,
      group: groupId,
      date
    });

    console.log('Expense created:', expense);

    await Group.findByIdAndUpdate(groupId, { $push: { expenses: expense._id } });

    // Create a transaction between each user that owes money to the payer
    const splitTransactions = await Promise.all(
      splitWith.map((splitUserId, index) => {
        return Transaction.create({
          payer: paidBy || userId,
          payee: splitUserId,
          amount: calculatedSplitAmounts[index],
          currency,
          date,
          expense: expense._id,
          status: 'pending'
        });
      })
    );

    res.status(201).json({ expense, transactions: splitTransactions });
  } catch (err) {
    console.error('Error creating expense', err);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Post Expense for a Group
router.post('/expenses/group/:id', calculateSplitAmounts, async (req, res) => {
  const userId = req.payload._id;
  const { id: groupId } = req.params;
  console.log(groupId)
  const calculatedSplitAmounts = req.calculatedSplitAmounts;
  const { 
    description, 
    amountPaid, 
    currency, 
    paidBy, 
    splitType,  
    date 
  } = req.body;

  try {
    // Fetch the group and its members
    const groupData = await Group.findById(groupId).populate('members');
    if (!groupData) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const splitWith = groupData.members.map(member => member._id);

    const expense = await Expense.create({
      createdBy: userId,
      description,
      amountPaid,
      currency,
      paidBy,
      splitWith,
      splitType,
      splitAmounts: calculatedSplitAmounts,
      group: groupId,
      date
    });

    console.log('Group Expense created:', expense);

    await Group.findByIdAndUpdate(groupId, { $push: { expenses: expense._id } });

    // Create a transaction between each user that owes money to the payer
    const splitTransactions = await Promise.all(
      splitWith.map((splitUserId, index) => {
        return Transaction.create({
          payer: paidBy || userId,
          payee: splitUserId,
          amount: calculatedSplitAmounts[index],
          currency,
          date,
          expense: expense._id,
          status: 'pending'
        });
      })
    );

    res.status(201).json({ expense, transactions: splitTransactions });
  } catch (err) {
    console.error('Error creating group expense', err);
    res.status(500).json({ error: 'Failed to create group expense' });
  }
});

//get all expenses where user is involved
router.get('/expenses', (req, res) => {
  const userId = req.payload._id

  Expense.find({ $or:[{createdBy: userId }, {paidBy: userId}, {splitWith: userId}]})
    .populate('paidBy')
    .populate('splitWith')
    .populate('createdBy')
    .populate('group')
    .then((expenses) => {
      if(!expenses) {
        return res.status(404).json({ error: 'The has no expenses '});
      }
      console.log('Retrived expenses:', expenses);
      res.status(200).json(expenses);
    })
    .catch((err) => {
      console.error('Error while retrieving expenses', err);
      res.status(500).json({ error: 'Failed to retrieve expenses' });
    });
});

//getting all expenses where user paid
router.get('/expenses/paid', (req, res) => {
  const userId  = req.payload._id;

  Expense.find({ paidBy: userId })
    .populate('paidBy')
    .populate('splitWith')
    .populate('createdBy')
    .populate('group')
    .then((expenses) => {
      if(!expenses) {
        return res.status(404).json({ error: 'The user has not paid any expenses'})
      }
      console.log(`Retrived expenses paid by ${userId}`);
      res.status(200).json(expenses);
    })
    .catch((err) => {
      console.error('Error retrieving paid expenses', err);
      res.status(500).json({ error: 'Failed to retrive paid expenses' });
    });
});

//getting all expenses where user has not paid
router.get('/expenses/split', (req, res) => {
  const userId  = req.payload._id;

  Expense.find({ splitWith: userId })
    .populate('paidBy')
    .populate('splitWith')
    .populate('createdBy')
    .populate('group')
    .then((expenses) => {
      if(!expenses) {
        return res.status(404).json({ error: 'The user has no expenses that he is not payer'})
      }
      console.log(`Retrieved all expenses where user is not payer ${userId}`);
      res.status(200).json(expenses);
    })
    .catch((err) => {
      console.error('Error retrieving expenses that user is not payer', err);
      res.status(500).json({ error: 'Failed to retrieve that user is not payer'});
    })
});

// get expense by id
router.get('/expenses/:id', checkExpenseAccess, (req, res) => {
  const expense = req.expense;

  expense
    .populate('paidBy')
    .populate('splitWith')
    .populate('createdBy')
    .populate('group')
    .then((expense) => {
      res.status(200).json(expense);
    })
    .catch((err) => {
      console.error('Error retrieving expnese by Id', err);
      res.status(500).json({ error: 'Failed to get student by Id' });
    });
});

//put edit expense
router.put('/expenses/:id', checkExpenseAccess, checkExpenseEditPermission, (req, res) => {
  const { id } = req.params;

  const {
    description,
    amount,
    currency,
    paidBy,
    splitWith,
    splitType,
    group,
    date
  } = req.body;

  Expense.findByIdAndUpdate(
    id,
    {
      description,
      amount,
      currency,
      paidBy,
      splitWith,
      splitType,
      group,
      date
    },
    {new: true}
  )
    .then((expense) => {
      if(!expense) {
        return res.status(404).json({ error: 'Expense not found' });
      }
      res.json(expense);
    })
    .catch((err) => {
      console.error('Error updating expense by Id', err);
      res.status(500).json({ error: 'Fail to update expense by Id' });
    });
});

router.delete('/expenses/:id', checkExpenseAccess, checkExpenseEditPermission, async (req, res) => {
  const { id } = req.params;

  try {
    // Find the expense to be deleted
    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Delete the associated transactions
    await Transaction.deleteMany({ expense: id });

    // Update the groups to remove the reference to the deleted expense
    await Group.updateMany({ expenses: id }, { $pull: { expenses: id } });

    // Delete the expense itself
    await Expense.findByIdAndDelete(id);

    res.status(200).json({ message: 'Expense deleted successfully' });
  } catch (err) {
    console.error('Error deleting expense by Id', err);
    res.status(500).json({ error: 'Failed to delete expense by Id' });
  }
});

module.exports = router