const phoneUtil =
  require("google-libphonenumber").PhoneNumberUtil.getInstance();
const { isAdmin } = require("../permissions");
const {
  ReferenceNumberService,
} = require("@allocations/reference-number-service");
const { BankingService } = require("@allocations/banking-service");
const ReferenceNumberSchema = require("../schema/newDirections");
const { ApolloError } = require("apollo-server-errors");
const moment = require("moment");

const ND_BANKING_PROVIDER = "New Directions";

const assignNDasBankingProvider = async (deals, deal_id) => {
  await deals.updateDealById({
    deal_id,
    deal: { bankingProvider: ND_BANKING_PROVIDER },
  });
};

/*
Frees up reference numbers for reuse
Is dependance on deal.bankingProvider to be set to "New Directions"
  this happens in referenceNumbersAllocate mutation
*/
const deallocateReferenceNumbers = async ({ dealDataSource, deal_id }) => {
  const deal = dealDataSource.getDealById({ deal_id });
  if (!deal) throw new ApolloError("No deal found");
  if (deal.bankingProvider == ND_BANKING_PROVIDER)
    await ReferenceNumberService.releaseByDealId({ deal_id });
};

const Schema = ReferenceNumberSchema;

const ReferenceNumber = {};

const getReferenceNumberRange = (referenceNumbers) => {
  const refNums = referenceNumbers.sort(
    (a, b) => Number(a.number) - Number(b.number)
  );
  const low = refNums[0].number;
  const high = refNums[refNums.length - 1].number;
  return `${low}-${high}`;
};

/*
validateDateOfBirth
Date of birth must be in iso format
Must be at least 18 years of age
*/
const validateDateOfBirth = (dob) => {
  const errMsg = "Invalid Date of Birth";
  if (!moment(dob, "mm/dd/yyyy").isValid()) throw new ApolloError(errMsg);
  if (moment().subtract(18, "years").isBefore(moment(dob)))
    throw new ApolloError("Must be at least 18 years old");
};

const validateEmail = (email) => {
  const emailRegex =
    /^(([^<>()[\]\\.,;:\s@\\"]+(\.[^<>()[\]\\.,;:\s@\\"]+)*)|(\\".+\\"))@(([^<>()[\]\\.,;:\s@\\"]+\.)+[^<>()[\]\\.,;:\s@\\"]{2,})$/i;
  if (!emailRegex.test(email)) throw new ApolloError("Invalid email");
};

/*
validatePhoneNumber
Ex Valid input: 15182226489
Number must include country code, area code and number
Phone region is hard coded to US currently
*/
const validatePhoneNumber = (phoneNumber) => {
  try {
    if (phoneNumber[0] != "+") phoneNumber = "+" + phoneNumber;

    const baseRegion = "US";
    const number = phoneUtil.parseAndKeepRawInput(phoneNumber, baseRegion);
    const validPhone = phoneUtil.isValidNumberForRegion(number, baseRegion);

    if (!validPhone) throw new ApolloError("Invalid Phone Number");
  } catch (e) {
    throw new ApolloError(e.message);
  }
};

const validateNewAccountInfo = (accountInfo) => {
  validateEmail(accountInfo.email);
  validateDateOfBirth(accountInfo.dateOfBirth);
  validatePhoneNumber(accountInfo.phone);
};

const Queries = {
  referenceNumbersByDealId: async (_, { deal_id }) => {
    return ReferenceNumberService.numbersByDealId({ deal_id });
  },
};

const Mutations = {
  referenceNumbersAllocate: async (_parent, { deal_id }, ctx) => {
    isAdmin(ctx);
    await assignNDasBankingProvider(ctx.datasources.deals, deal_id);
    return ReferenceNumberService.allocate({ deal_id });
  },
  createNDBankAccount: async (_parent, { accountInfo }, ctx) => {
    try {
      isAdmin(ctx);
      validateNewAccountInfo(accountInfo);
      const referenceNumbers = await ReferenceNumberService.allocate({
        deal_id: accountInfo.contactID,
      });
      await assignNDasBankingProvider(
        ctx.datasources.deals,
        accountInfo.contactID
      );
      const referenceIDs = getReferenceNumberRange(referenceNumbers);
      const newBankingInfo = { ...accountInfo, referenceIDs };

      const uploadRes = await BankingService.uploadNDVirtualAccount(
        newBankingInfo
      );

      return uploadRes;
    } catch (e) {
      throw new ApolloError(e);
    }
  },
};

const Subscriptions = {};

module.exports = {
  Schema,
  Queries,
  Mutations,
  Subscriptions,
  subResolvers: { ReferenceNumber },
  validatePhoneNumber,
  validateEmail,
  validateDateOfBirth,
  deallocateReferenceNumbers,
};
