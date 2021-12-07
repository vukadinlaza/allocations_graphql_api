const moment = require("moment");
const transformServiceDeal = ({ serviceDeal, coverImage }) => {
  if (!serviceDeal) return {};
  return {
    _id: serviceDeal._id,
    name: serviceDeal.name,
    approved: true,
    organization: serviceDeal.organization_id,
    created_at: serviceDeal.created_at,
    company_name: serviceDeal.portfolio_company_name,
    company_description: serviceDeal.description,
    date_closed: serviceDeal.closing_date,
    deal_lead: serviceDeal.manager_name,
    pledge_link: "",
    status: serviceDeal.phase || "onboarding",
    appLink: `deals/${serviceDeal.org_slug || "allocations"}/${
      serviceDeal.slug
    }`,
    docSpringTemplateId:
      serviceDeal.docspring_template_id || "tpl_RrmjKbpFRr7qhKY3dD",
    slug: serviceDeal.slug,
    memo: serviceDeal.memo,
    dealCoverImageKey: coverImage?.link || "null",
    dealParams: {
      dealType: serviceDeal.offering_type,
      minimumInvestment: serviceDeal.minimum_investment,
      signDeadline: moment(serviceDeal.sign_deadline).format(
        "YYYY-MM-DD:HH:MM"
      ),
      wireDeadline: moment(serviceDeal.wire_deadline).format(
        "YYYY-MM-DD:HH:MM"
      ),
      estimatedSetupCostsDollar: "100000",
      managementFees: serviceDeal?.management_fee?.value,
      managementFeeType: serviceDeal.management_fee_frequency,
    },
  };
};
const transformLegacyDeal = ({ legacyDeal }) => {
  return {
    _id: legacyDeal._id,
    approved: true,
    organization_id: legacyDeal.organization,
    createdAt: legacyDeal.created_at,
    portfolio_company_name: legacyDeal.company_name,
    description: legacyDeal.company_description,
    closing_date: legacyDeal.date_closed,
    manager_name: legacyDeal.deal_lead,
    pledge_link: legacyDeal.pledge_link,
    status: legacyDeal.status,
    docspring_template_id:
      legacyDeal.docSpringTemplateId || "tpl_RrmjKbpFRr7qhKY3dD",
    slug: legacyDeal.slug,
    memo: legacyDeal.memo,
    offering_type: legacyDeal.dealParams.dealType,
    minimum_investment: legacyDeal.dealParams.minimumInvestment,
    sign_deadline: legacyDeal.dealParams.signDeadline,
    wire_deadline: legacyDeal.dealParams.wireDeadline,
    estimatedSetupCostsDollar: legacyDeal.dealParams.estimatedSetupCostsDollar,
    "management_fee.value": legacyDeal.dealParams.managementFees,
    management_fee_frequency: legacyDeal.dealParams.managementFeeType,
    virtual_account_number: legacyDeal.virtual_account_number,
  };
};

module.exports = {
  transformServiceDeal,
  transformLegacyDeal,
};
