const Group = require('../models/Group.model');

const checkGroupAccess = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.payload._id;

  try {
    const group = await Group.findById(id);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.owner.toString() === userId || group.members.includes(userId)) {
      req.group = group; // Attach the group to the request object for next middleware(checkOwnership)
      next();
    } else {
      res.status(403).json({ error: 'Forbidden: you are not a member of the group' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const checkGroupOwnership = async (req, res, next) => {
  const userId = req.payload._id;

  try {
    if (req.group.owner.toString() === userId) {
      next();
    } else {
      res.status(403).json({ error: 'Forbidden: You are not the owner of this group' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  checkGroupAccess,
  checkGroupOwnership
};