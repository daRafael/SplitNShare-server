const express = require("express");
const router = express.Router();

const Balance = require("../models/Balance.model")

/* //get all balances
router.get('/balances', (req, res) => {
  Balance.find({})
    .populate('user')
    .populate('balanceWith.user')
    .then((balances) => {
      console.log('Retrieved balances:', balances);
      res.status(200).json(balances);
    })
    .catch((err) => {
      console.error('Error while retrieving balances', err)
      res.status(500).json({ error: 'Failed to retrive balances' });
    })
})

//get balance by user Id
router.get('/balances/:userId', (req, res) => {
  const { userId } = req.params

  Balance.findOne({user: userId})
    .populate('user')
    .populate('balanceWith.user')
    .then((balance) => {
      if(!balance) {
        return res.status(404).json({ error: 'Balance not found' });
      }
      res.status(200).json(balance);
    })
    .catch((err) => {
      console.error('Error retriving balance by user Id', err);
      res.status(500).json({ error: 'Failed to retrieve balance by user Id' });
    });
});

// update an existing balance by userId
router.put("/balances/:userId", (req, res) => {
  const { userId } = req.params;
  const { balanceWith } = req.body;

  Balance.findOneAndUpdate(
    {user: userId},
    {balanceWith: balanceWith},
    {new: true}
  )
    .then((balance) => {
      if(!balance) {
        return res.status(404).json({ error: 'Balance not found' });
      }
      res.status(200).json(balance);
    })
    .catch((err) => {
      console.error('Error updating balance', err);
      res.status(500).json({ error: 'Failed to update balance' });
    });
}); */

module.exports = router;