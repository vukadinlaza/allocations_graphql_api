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
          Processed: false,
        },
      },
    ]);
  } catch (e) {
    throw new Error(`Airtable ${TABLE_NAME} Error`);
  }
};

const bankTransactionsTransactionsAddRow = async ({
  user_name,
  amount,
  referenceNumber,
  account,
}) => {
  // table: https://airtable.com/appPoxRLndZXMKzi8/tbl66sSPTRCGRFMiS/viwxpMFlyWSJzaQlH?blocks=hide
  const TABLE_NAME = "Transactions";
  const BASE_ID = process.env.AIR_TABLE_BANK_TRANSACTIONS_BASE_ID;
  try {
    const base = await getBase(BASE_ID);
    await base(TABLE_NAME).create(
      [
        {
          fields: {
            "*Name": `Wire in from ${user_name}`,
            "**Date": moment().format("YYYY-MM-DD"),
            "**USD": Number(amount),
            "**Account": [account],
            "ND Reference Number": referenceNumber,
          },
        },
      ],
      { typecast: true }
    );
  } catch (e) {
    throw new Error(`Airtable ${TABLE_NAME} Error`);
  }
};

const findOrCreateBankingTransactionsAccount = async (virtualAccountNumber) => {
  // table: https://airtable.com/appPoxRLndZXMKzi8/tbllrhjQGmz7boL3G/viwAo38G3Xlto3Obd?blocks=hide
  const TABLE_NAME = "Accounts";
  const BASE_ID = process.env.AIR_TABLE_BANK_TRANSACTIONS_BASE_ID;
  const accountName = `New Directions - ${virtualAccountNumber}`;
  const base = await getBase(BASE_ID);
  try {
    const res = await base(TABLE_NAME)
      .select({ filterByFormula: `{*Name} = '${accountName}'` })
      .firstPage();
    // If no row found, create new account
    if (res.length == 0)
      await base(TABLE_NAME).create([
        {
          fields: {
            "*Name": accountName,
            "**Institution": "New Directions",
          },
        },
      ]);
  } catch (e) {
    throw new Error(`Airtable ${TABLE_NAME} Error`);
  }
  // Return the account name after either successfully finding, or creating an account by naming convention
  return accountName;
};

module.exports = {
  newDirectionTransactionsAddRow,
  bankTransactionsTransactionsAddRow,
  findOrCreateBankingTransactionsAccount,
};
