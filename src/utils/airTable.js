const moment = require("moment");
const Airtable = require("airtable");

Airtable.configure({
  endpointUrl: "https://api.airtable.com",
  apiKey: process.env.AIRTABLE_API_KEY,
});

const getBase = async (baseId) => {
  return Airtable.base(baseId);
};

const newDirectionTransactionsAddRow = async ({
  virtualAccountNumber,
  amount,
  referenceNumber,
  deal_id,
  investmentId,
  user_id,
}) => {
  // table: https://airtable.com/appjZAd1XKruOjNtW/tblPBWVFiaPrVjcbp/viwYozkuKRdFqD8iv?blocks=hide
  const TABLE_NAME = "Wire Confirmations";
  const BASE_ID = process.env.AIR_TABLE_NEW_DIRECTIONS_TRANSACTIONS_BASE_ID;

  try {
    const base = await getBase(BASE_ID);
    await base(TABLE_NAME).create([
      {
        fields: {
          "NDTCO Account#": virtualAccountNumber,
          "Transaction Type": "DEPOSIT",
          Amount: amount,
          "Reference Number": referenceNumber,
          "Deal Id": deal_id,
          "Investment Id": investmentId,
          "User Id": user_id,
          "Created At": moment().format("YYYY-MM-DD"),
        },
      },
    ]);
  } catch (e) {
    console.log(e);
    throw new Error(`Airtable ${TABLE_NAME} Error`);
  }
};

const accountingCapitalAccountsAddRow = async ({
  user_name,
  amount,
  referenceNumber,
}) => {
  // table:
  const TABLE_NAME = "Transactions";
  const BASE_ID = process.env.AIR_TABLE_BANK_TRANSACTIONS_BASE_ID;
  try {
    const base = await getBase(BASE_ID);
    await base(TABLE_NAME).create([
      {
        fields: {
          "*Name": `Wire in from ${user_name}`,
          "**Date": moment().format("YYYY-MM-DD"),
          "**USD": Number(amount),
          "ND Reference Number": referenceNumber,
        },
      },
    ]);
  } catch (e) {
    console.log(e);
    throw new Error(`Airtable ${TABLE_NAME} Error`);
  }
};

module.exports = {
  newDirectionTransactionsAddRow,
  accountingCapitalAccountsAddRow,
};
