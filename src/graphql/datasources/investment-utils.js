const transformLegacyInvestment = ({ _id, legacyInvestment }) => {
  return {
    _id: _id,
    deal_id: legacyInvestment.deal_id,
    user_id: legacyInvestment.user_id,
    phase: legacyInvestment.status,
    investor_name: legacyInvestment.submissionData
      ? legacyInvestment.submissionData.fullName
      : null,
    investor_email: "dummy@email.com",
    committed_amount: legacyInvestment.amount ? legacyInvestment.amount : null,
    wired_amount: legacyInvestment.capitalWiredAmount
      ? legacyInvestment.capitalWiredAmount
      : null,
    wired_date: legacyInvestment.wired_at ? legacyInvestment.wired_at : null,
    investor_type: legacyInvestment.submissionData
      ? legacyInvestment.submissionData.investor_type
      : null,
    investor_entity_name: legacyInvestment.submissionData
      ? legacyInvestment.submissionData.legalName
      : null,
    investor_country: legacyInvestment.submissionData
      ? legacyInvestment.submissionData.country
      : null,
    investor_state: legacyInvestment.submissionData
      ? legacyInvestment.submissionData.state
      : null,
    accredited_investor_type: legacyInvestment.submissionData
      ? legacyInvestment.submissionData.accredited_investor_status
      : null,
  };
};

module.exports = {
  transformLegacyInvestment,
};
