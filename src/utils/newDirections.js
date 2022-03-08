const getReferenceNumber = (body) => {
  const regex = new RegExp(
    /Originator(\D+)to(\D+)Beneficiary(\D+)Information(\D+)(?<refNum>\d+)/
  );
  const referenceName = regex.exec(body);
  if (!referenceName || !referenceName.groups || !referenceName.groups.refNum)
    throw new Error(`No Reference Number found.`);
  const referenceNumber = referenceName.groups.refNum;
  if (referenceNumber.length != 8)
    throw new Error(`Invalid Reference Number: ${referenceNumber}`);

  return referenceNumber;
};
const getWireAmount = (body) => {
  const regexAmount = new RegExp(
    /in(\D+)the(\D+)amount(\D+)of(\D+)(?<amount>[\d,]+.\d+)/
  );
  const amountNamed = regexAmount.exec(body);
  if (!amountNamed || !amountNamed.groups || !amountNamed.groups.amount)
    throw new Error("No amount found.");

  return amountNamed.groups.amount;
};

module.exports = {
  getReferenceNumber,
  getWireAmount,
};
