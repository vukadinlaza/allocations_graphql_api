const {
  transformLegacyInvestment,
} = require("../../src/graphql/datasources/investment-utils");

describe("transorm legacy investment test", () => {
  it("transforms a legacy investment", () => {
    const legacyInvestment = {
      _id: "61c0c7ad99264e7d50e9186f",
      status: "signed",
      invited_at: 1640023980920,
      created_at: 1640023980920,
      amount: 1000,
      user_id: "6179a5f0922940633554b301",
      deal_id: "6067188903048400236de5fd",
      organization: "5e4d9a334ffe0530c9350d40",
      submissionData: {
        country: "United States",
        country_search: "United States",
        state: "Utah",
        state_search: "Utah",
        __typename: "SubmissionData",
        investor_type: "entity",
        legalName: "Leagal Name of Entity or Individual",
        accredited_investor_status:
          "Each equity owner of my entity is an accredited investor",
        fullName: "Signer's Full Name",
        title: "Title",
        investmentAmount: "1,000",
        clientIp: "73.157.133.247",
        dealId: "6067188903048400236de5fd",
        docSpringTemplateId: "tpl_3nKjygaFgz44KyCANJ",
        submissionId: "sub_hzFmeQDCL3LHmHH2Tj",
      },
      documents: [
        "investments/61c0c7ad99264e7d50e9186f/1640023982194-SPV_Docs_-_Sharding_38_Allocations_SPV_-_60MM_Cap_-_Final.pdf",
      ],
    };

    const serviceInvestment = {
      _id: legacyInvestment._id,
      user_id: "6179a5f0922940633554b301",
      deal_id: "6067188903048400236de5fd",
      investor_name: "Signer's Full Name",
      investor_email: "dummy@email.com",
      phase: "signed",
      committed_amount: 1000,
      wired_amount: null,
      wired_date: null,
      investor_type: "entity",
      investor_entity_name: "Leagal Name of Entity or Individual",
      investor_country: "United States",
      investor_state: "Utah",
      accredited_investor_type:
        "Each equity owner of my entity is an accredited investor",
    };

    const transformedInvestment = transformLegacyInvestment({
      _id: legacyInvestment._id,
      legacyInvestment: legacyInvestment,
    });

    expect(transformedInvestment).toStrictEqual(serviceInvestment);
  });
});
