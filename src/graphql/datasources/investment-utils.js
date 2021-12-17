const transformLegacyInvestment = (legacyInvestment) => {
  return {
    deal_id: legacyInvestment.deal_id,
    user_id: legacyInvestment.user_id,
    phase: legacyInvestment.status,
    investor_email: "dummy@gmail.com",
    subscription_amount: legacyInvestment.amount,
    wired_amount: legacyInvestment.capitalWiredAmount,
    wired_date: legacyInvestment.wired_at,
    investor_type: legacyInvestment.submissionData.investor_type,
    entity_name: legacyInvestment.submissionData.legalName,
    country: legacyInvestment.submissionData.country,
    state: legacyInvestment.submissionData.state,
    accredited_investor_status:
      legacyInvestment.submissionData.accredited_investor_status,
  };
};

module.exports = {
  transformLegacyInvestment,
};
