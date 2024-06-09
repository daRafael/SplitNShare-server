const router = require('express').Router();
const { checkTransactionPayer, checkTransactionAccess } = require('../middleware/checkTransactionAccess.middleware');
const Expense = require('../models/Expense.model')

const Transaction = require('../models/Transaction.model');

//get transactions for a given payer
router.get('/transactions/payer', (req, res) => {
  const userId = req.payload._id;

  Transaction.find({ payer: userId })
    .populate('payer')
    .populate('payee')
    .populate('expense')
    .then((transactions) => {
      console.log(`Retrived transactions for payer ${userId}`);
      res.status(200).json(transactions);
    })
    .catch((err) => {
      console.error('Error retrieving transactions of payer', err);
      res.status(500).json({ error: 'Failed to retrive transactions of payer'});
    });
});

//get transactions for payees
router.get('/transactions/payee', (req, res) => {
  const userId = req.payload._id;

  Transaction.find({ payee: userId })
    .populate('payer')
    .populate('payee')
    .populate('expense')
    .then((transactions) => {
      console.log(`Retrieved transactions for payee ${userId}`);
      res.status(200).json(transactions);
    })
    .catch((err) => {
      console.error('Error retrieving transactions of payee', err);
      res.status(500).json({ error: 'Failed to retrieve transactions of payee' });
    });
});

//get transaction by id
router.get('/transactions/:id', checkTransactionAccess, (req, res) => {
  const transaction = req.transaction;

  transaction
    .populate('payer')
    .populate('payee')
    .populate('expense')
    .then((transaction) => {
      res.status(200).json(transaction);
    })
    .catch((err) => {
      console.error('Error retrieving transaction by Id', err);
      res.status(500).json({ error: 'Failed to get transaction by Id' });
    })
} )

//update transaction status
router.put('/transactions/:id', checkTransactionPayer, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const updatedTransaction = await Transaction.findByIdAndUpdate(id, { status }, { new: true });
    if (!updatedTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (status === 'paid') {
      const expense = await Expense.findById(updatedTransaction.expense);
      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
      }

      // Check if the only members left in the expense are the payer and payee
      const shouldDeleteExpense = !expense.splitWith.some(member => member.toString() !== transaction.payer.toString() && member.toString() !== transaction.payee.toString());

      if (shouldDeleteExpense) {
        // Delete the expense if no other members are present besides the payer and payee
        await Expense.findByIdAndDelete(updatedTransaction.expense);
      } else {
        // Remove the payee from the members array if the expense has other members
        await Expense.findByIdAndUpdate(updatedTransaction.expense, { $pull: { splitWith: transaction.payee } });
      }
    }

    return res.status(200).json(updatedTransaction);
  } catch (err) {
    console.error('Error updating transaction by Id', err);
    return res.status(500).json({ error: 'Failed to update transaction by Id' });
  }
});

module.exports = router;