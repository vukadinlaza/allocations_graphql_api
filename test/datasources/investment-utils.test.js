const {
  transformLegacyInvestment,
} = require("../../src/graphql/datasources/investment-utils");

describe("transorm legacy investment test", () => {
  it("transforms a legacy investment", () => {
    const User = {
      _id: "4562",
      email: "user@gmail.com",
      name: "Brett",
    };
    const SubmissionData = {
      investor_type: "entity",
      legalName: "boom",
      country: "United States",
      state: "Wyoming",
      accredited_investor_status: "long string",
    };

    const Deal = {
      _id: "7629",
    };

    const legacyInvestment = {
      deal: Deal,
      user: User,
      investor: User,
      status: "invited",
      amount: 1000,
      capitalWiredAmount: 1543,
      wired_at: "wired date",
      submissionData: SubmissionData,
    };

    const serviceInvestment = {
      deal_id: "7629",
      user_id: "4562",
      investor_name: "Brett",
      investor_email: "user@gmail.com",
      phase: "invited",
      subscription_amount: 1000,
      wired_amount: 1543,
      wired_date: "wired date",
      investor_type: "entity",
      entity_name: "boom",
      country: "United States",
      state: "Wyoming",
      accredited_investor_status: "long string",
    };

    const transformedInvestment = transformLegacyInvestment(legacyInvestment);

    expect(transformedInvestment).toStrictEqual(serviceInvestment);
  });
});
