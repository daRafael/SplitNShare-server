const router = require('express').Router();
const User = require('../models/User.model');

const { checkUserEditPermission } = require('../middleware/checkUserEditPermission.middleware')

//Adding friend to user friends array and to friend's friends array
router.post('/users/friends', async (req, res) => {
  const userId = req.payload._id;
  const { friendInput } = req.body;
  console.log(req.body)

  try {
    let friend = await User.findOne({ username: friendInput });

    // If user not found by username, search by email
    if (!friend) {
      friend = await User.findOne({ email: friendInput });
    }

    if (!friend) {
      return res.status(404).json({ error: 'Friend not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.friends.includes(friend._id)) {
      return res.status(200).json({ message: 'Friend already added' });
    }

    //create mutual friendship
    //update user friends list
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $push: { friends: friend._id } },
      { new: true }
    );

    //update friend friends list
    const updatedFriend = await User.findByIdAndUpdate(
      friend._id,
      { $push: { friends: user._id } },
      { new: true }
    )

    res.status(200).json({ user: updatedUser, friend: updatedFriend });
  } catch (err) {
    console.error('Error adding friend:', err);
    res.status(500).json({ error: 'Failed to add friend' });
  }

})

// GET all friends of a user by user ID
router.get('/users/friends', (req, res) => {
  const userId = req.payload._id;

  User.findById(userId)
    .populate('friends')
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.status(200).json(user.friends);
    })
    .catch((err) => {
      console.error('Error retrieving user friends:', err);
      res.status(500).json({ error: 'Failed to retrieve user friends' });
    });
});

//GET
router.get('/users', (req, res) => {
  User.find({})
    .populate('groups.owner')
    .populate('groups.member')
    .then((users) => {
      console.log('Retrieved users:', users);
      res.status(200).json(users);
    })
    .catch((err) => {
      console.error('Error while retrieving users', err)
      res.status(500).json({ error: 'Failed to retrive users' });
    });
});

// GET Id
router.get('/users/:id', (req, res) => {
  const { id } = req.params;

  User.findById(id)
    .populate('groups.owner')
    .populate('groups.member')
    .then((user) => {
      if(!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.status(200).json(user);
    })
    .catch((err) => {
      console.error('Error retrieving user by Id', err);
      res.status(500).json({ error: 'Failed to get user by Id' });
    });
});

//get all groups in common between all users involved in expense (createdBy and splitWith array);
router.post('/users/groups/common', async (req, res) => {
  try {
    const { splitWith } = req.body;
    const createdBy = req.payload._id;

    // Fetch the user IDs from the request body and add the createdBy user ID
    const userIds = [...splitWith, createdBy];

    // Find all the groups for each user
    const users = await User.find({ _id: { $in: userIds } })
      .populate('groups.owner')
      .populate('groups.member');

    // Extract the groups ids from each user
    const userGroups = users.map((user) => [...user.groups.owner, ...user.groups.member]);

    // Find the common groups id between all users
    const commonGroups = userGroups.reduce((intersection, userGroup) => {
      return intersection.filter((group) => userGroup.includes(group));
    });

    res.status(200).json(commonGroups);
  } catch (err) {
    console.error('Error retrieving common groups:', err);
    res.status(500).json({ error: 'Failed to retrieve common groups' });
  }
});

//update user
router.put('/users/:id', checkUserEditPermission, (req, res) => {
  const { id } = req.params;

  const {
    name,
    email,
    password,
    currency,
    friends,
    groups,
    balance
  } = req.body;

  User.findByIdAndUpdate(
    id,
    {
      name,
      email,
      password,
      currency,
      friends,
      groups,
      balance
    },
    {new: true}
  )
    .then((user) => {
      if(!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    })
    .catch((err) => {
      console.error('Error updating user by Id', err);
      res.status(500).json({ error: 'Fail to update user by Id' });
    });
});

// Remove friend from user's friends array
router.delete('/users/friends/:id', async (req, res) => {
  const userId = req.payload._id;
  const { id: friendId } = req.params;

  try {
  
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }


    const friendIndex = user.friends.indexOf(friendId);
    if (friendIndex === -1) {
      return res.status(404).json({ error: 'Friend not found in user\'s friends' });
    }


    user.friends.splice(friendIndex, 1);
    await user.save();

    res.status(200).json({ message: 'Friend removed successfully' });
  } catch (err) {
    console.error('Error removing friend:', err);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

//DELETE
router.delete('/users/:id', checkUserEditPermission, (req, res) => {
  const { id } = req.params;

  User.findByIdAndDelete(id)
    .then((user) => {
      if(!user) {
        return res.status(404).json({error: 'User not found' });
      }
      res.status(200).json(user);
    })
    .catch((err) => {
      console.error('Error deleting user by Id', err);
      res.status(500).json({ error: 'Fail to delete user by Id' });
    });
});

module.exports = router