function nWithCommas(x) {
  if (!x) return 0;
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function amountFormat(amount) {
  if (!amount) return 0;
  const floatAmount = parseFloat(amount).toFixed(2);
  return nWithCommas(floatAmount);
}

module.exports = { nWithCommas, amountFormat };
