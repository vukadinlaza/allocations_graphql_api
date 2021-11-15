function nWithCommas(x) {
  if (!x) return 0;
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function amountFormat(amount) {
  if (!amount) return 0;
  const floatAmount = parseFloat(amount).toFixed(2);
  return nWithCommas(floatAmount);
}

const formatCompanyName = (companyName) => {
  if (companyName.includes("Fund")) return companyName;
  const splitCompanyArray = companyName.split(" ");

  if (splitCompanyArray[splitCompanyArray.length - 1] !== "SPV") {
    return [...splitCompanyArray, "SPV"].join(" ");
  }

  return companyName;
};

module.exports = { nWithCommas, amountFormat, formatCompanyName };
