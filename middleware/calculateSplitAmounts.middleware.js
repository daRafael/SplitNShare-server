const calculateSplitAmounts = (req, res, next) => {
  const { amountPaid, splitWith, splitType, splitAmounts, paidBy } = req.body;
  const userId = req.payload._id;

  if (!amountPaid || !splitWith || !splitType) {
    return res.status(400).json({ error: 'Required fields are missing' });
  }

  //Ensure the creator of expense is included in the splitWith array
  if(!splitWith.includes(userId)) {
    splitWith.push(userId);
  }

  let calculatedSplitAmounts;

  if (splitType === 'equally') {
    const splitCount = splitWith.length;
    const totalCents = Math.round(amountPaid * 100); // Convert to cents
    const equalCents = Math.floor(totalCents / splitCount); // Equal share in cents
    const remainder = totalCents % splitCount; // Remainder to distribute between users

    calculatedSplitAmounts = new Array(splitCount).fill(equalCents); // Fill with equal cents amounts
    
    for (let i = 0; i < remainder; i++) {
      calculatedSplitAmounts[i] += 1; // Distribute the remainder
    }
  } else if (splitType === 'exactAmounts') {
    const totalSplitAmount = splitAmounts.reduce((acc, curr) => acc + curr, 0);

    if (Math.round(totalSplitAmount * 100) !== Math.round(amountPaid * 100)) {
      return res.status(400).json({ error: 'Split amounts do not add up to the total amount paid' });
    }

    calculatedSplitAmounts = splitAmounts.map(amount => Math.round(amount * 100)); // Convert to cents
  } else {
    return res.status(400).json({ error: 'Invalid split type' });
  }

  // Convert calculated split amounts from cents back to normal money format
  calculatedSplitAmounts = calculatedSplitAmounts.map(amount => amount / 100);

  req.calculatedSplitAmounts = calculatedSplitAmounts;
  next();
};

module.exports = calculateSplitAmounts;
