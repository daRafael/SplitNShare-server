const checkUserEditPermission = (req, res, next) => {
  const { id } = req.params;
  const userId = req.payload._id;

  if (id !== userId) {
    return res.status(403).json({ error: 'You are not authorized to update this user' });
  }
  next();
};

module.exports = {checkUserEditPermission};
