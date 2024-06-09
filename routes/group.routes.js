const router = require('express').Router();
const { checkGroupAccess } = require('../middleware/checkGroupAccess.middleware');
const { checkGroupOwnership } = require('../middleware/checkGroupAccess.middleware');

const Group = require('../models/Group.model');
const User = require('../models/User.model');
const Expense = require('../models/Expense.model')

//post Group
router.post('/groups', async (req, res) => {
  const userId  = req.payload._id
  const {
    name,
    members,
    expenses,
    date
  } = req.body

  try {
    const group = await Group.create({
      name,
      owner: userId,
      members,
      expenses,
      date
    });
    console.log('Group created:', group); 

    await User.findByIdAndUpdate(
      userId,
      { $push: { 'groups.owner': group._id }},
      { new: true }
    );

    for (const memberId of members) {
      await User.findByIdAndUpdate(
        memberId,
        { $push: { 'groups.member': group._id }},
        { new: true }
      );
    }

    res.status(201).json(group);
  } catch (err) {
    console.error('Error creating group:', err);
    res.status(500).json({ error: 'Failed to create group'});
  }
});

//get all groups where user is a memeber or owner 
router.get('/groups', (req, res) => {
  const userId = req.payload._id

  Group.find({ $or:[{owner: userId}, {members: userId}]})
    .populate('owner')
    .populate('members')
    .populate('expenses')
    .then((groups) => {
      if(!groups) {
        return res.status(404).json({ error: 'The user is not part of any group'})
      }
      console.log('Retrived groups:', groups);
      res.status(200).json(groups);
    })
    .catch((err) => {
      console.error('Error while retrieving groups:', err);
      res.status(500).json({ error: 'Failed to retrieve groups '});
    });
});

//getting all groups of owner
router.get('/groups/owner', (req, res) => {
  const userId  = req.payload._id;

  Group.find({ owner: userId })
    .populate('owner')
    .populate('members')
    .populate('expenses')
    .then((groups) => {
      if(!groups) {
        return res.status(404).json({ error: 'The user is not owner of any group'})
      }
      console.log(`Retrived groups for owner ${userId}`);
      res.status(200).json(groups);
    })
    .catch((err) => {
      console.error('Error retrieving groups of owner', err);
      res.status(500).json({ error: 'Failed to retrive groups of owner'});
    });
});

//getting all groups where user is member
router.get('/groups/member', (req, res) => {
  const userId  = req.payload._id;

  Group.find({ members: userId })
    .populate('owner')
    .populate('members')
    .populate('expenses')
    .then((groups) => {
      if(!groups) {
        return res.status(404).json({ error: 'The user is not member of any group'})
      }
      console.log(`Retrieved groups for member ${userId}`);
      res.status(200).json(groups);
    })
    .catch((err) => {
      console.error('Error retrieving groups of member', err);
      res.status(500).json({ error: 'Failed to retrieve groups of member'});
    })
});

//getting group by id
router.get('/groups/:id', checkGroupAccess, (req, res) => {
  const  group  = req.group;

  group
    .populate('owner')
    .populate('members')
    .populate('expenses')
    .then((group) => {
      res.status(200).json(group);
    })
    .catch((err) => {
      console.error('Error retrieving group by Id', err);
      res.status(500).json({ error: 'Failed to get group by Id' });
    });
});

//update group by id
router.put('/groups/:id', checkGroupAccess, checkGroupOwnership, (req, res) => {
  const { id } = req.params
  const {
    name,
    members,
    expenses,
    date
  } = req.body;

  Group.findByIdAndUpdate(
    id,
    {
      name,
      members,
      expenses,
      date
    },
    { new: true}
  )
    .then((group) => {
      if(!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
      
      res.status(200).json(group)
    })
    .catch((err) => {
      console.error('Error updating group by Id', err);
      res.status(500).json({ error: 'Fail to update group by Id' });
    });
});

// Delete group by Id
router.delete('/groups/:id', checkGroupAccess, checkGroupOwnership, async (req, res) => {
  const { id } = req.params;

  try {
    // Delete expenses associated with the group
    await Expense.deleteMany({ group: id });

    // Delete the group
    const deletedGroup = await Group.findByIdAndDelete(id);
    if (!deletedGroup) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.status(200).json(deletedGroup);
  } catch (err) {
    console.error('Error deleting group and associated expenses:', err);
    res.status(500).json({ error: 'Failed to delete group and associated expenses' });
  }
});

module.exports = router;