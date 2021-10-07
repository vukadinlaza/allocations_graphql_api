const { ObjectId } = require("mongodb");

const transformServiceDeal = ({ serviceDeal, coverImage }) => {
  return {
    _id: ObjectId(serviceDeal._id),
    approved: true,
    organization: ObjectId(serviceDeal.organization_id),
    created_at: serviceDeal.createdAt,
    company_name: serviceDeal.portfolio_company_name,
    company_description: serviceDeal.description,
    date_closed: serviceDeal.closing_date,
    deal_lead: serviceDeal.manager_name,
    pledge_link: "",
    status: serviceDeal.status,
    docSpringTemplateId:
      serviceDeal.docspring_template_id || "tpl_RrmjKbpFRr7qhKY3dD",
    slug: serviceDeal.slug,
    memo: serviceDeal.memo,
    dealCoverImageKey: coverImage?.link || null,
    dealParams: {
      dealType: serviceDeal.offering_type,
      minimumInvestment: serviceDeal.minimum_subscription_amount,
      signDeadline: serviceDeal.sign_deadline,
      wireDeadline: serviceDeal.sign_deadline,
      estimatedSetupCostsDollar: "100000",
      managementFees: serviceDeal.management_fee,
      managementFeeType: serviceDeal.management_fee_frequency,
    },
  };
};
const transformLegacyDeal = ({ legacyDeal, coverImage }) => {
  return {
    _id: ObjectId(legacyDeal._id),
    approved: true,
    organization_id: ObjectId(legacyDeal.organization),
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
    dealCoverImageKey: coverImage.link || null,
    offering_type: legacyDeal.dealParams.dealType,
    minimum_subscription_amount: legacyDeal.dealParams.minimumInvestment,
    sign_deadline: legacyDeal.dealParams.signDeadline,
    sign_deadline: legacyDeal.dealParams.wireDeadline,
    estimatedSetupCostsDollar: legacyDeal.dealParams.estimatedSetupCostsDollar,
    "management_fee.value": legacyDeal.dealParams.managementFees,
    management_fee_frequency: legacyDeal.dealParams.managementFeeType,
  };
};

module.exports = {
  transformServiceDeal,
  transformLegacyDeal,
};
