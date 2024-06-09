const Transaction = require('../models/Transaction.model')

const checkTransactionAccess = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.payload._id;

  try {
    const transaction = await Transaction.findById(id);
    if(!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if(transaction.payer.toString() === userId || transaction.payee.toString() === userId) {
      req.transaction = transaction;
      next();
    }
    else {
      res.status(403).json({ error: "Forbidden: you can't access this transaction" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

const checkTransactionPayer = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.payload._id;

  try {
    const transaction = await Transaction.findById(id);
    if(!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    if(transaction.payer.toString() === userId) {
      next();
    } else {
      res.status(403).json({ error: 'Forbidden: you are not the payer of this transaction' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

module.exports = {
  checkTransactionAccess,
  checkTransactionPayer
}