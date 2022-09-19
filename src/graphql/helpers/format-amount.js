const formatAmount = (amount) => {
  const formattedString = Number.parseFloat(amount).toFixed(2);

  return Number(formattedString);
};

module.exports = { formatAmount };
