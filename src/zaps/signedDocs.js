const fetch = require("node-fetch");

const signedSPV = async ({ submissionData }) => {
  let url = null;
  if (process.env.NODE_ENV === "production") {
    url = "https://hooks.zapier.com/hooks/catch/10079430/bykd5dx/";
  } else {
    url = "https://hooks.zapier.com/hooks/catch/10079430/bo3dhk1/";
  }
  await fetch(url, {
    method: "post",
    body: JSON.stringify({
      name:
        submissionData.investor_type === "entity"
          ? submissionData.fullName
          : submissionData.legalName,
      type: submissionData.investor_type,
      entityName:
        submissionData.investor_type === "entity"
          ? submissionData.legalName
          : "",
      amount: submissionData.investmentAmount,
    }),
    headers: { "Content-Type": "application/json" },
  });
};

const wFormSigned = async (submissionData) => {
  let url = null;
  if (process.env.NODE_ENV === "production") {
    url = "https://hooks.zapier.com/hooks/catch/10079430/byaxoa3/";
  } else {
    url = "https://hooks.zapier.com/hooks/catch/10079430/bo3mxvk/";
  }

  let form = null;
  if (submissionData.kycTemplateName.includes("W-8")) {
    form = {
      document: submissionData.kycTemplateName,
      name: submissionData.name_of_individual_who_is_the_beneficial_owner
        ? submissionData.name_of_individual_who_is_the_beneficial_owner
        : submissionData.organization_name,
      dateSigned: submissionData.date_mm_dd_yyyy,
      signedBy: submissionData.signature,
    };
  }

  if (submissionData.kycTemplateName.includes("W-9")) {
    form = {
      document: submissionData.kycTemplateName,
      name: submissionData.name_as_shown_on_your_income_tax_return_name_is_required_on_this_line_do_not_leave_this_line_blank,
      dateSigned: submissionData.date_signed,
      signedBy: submissionData.signature
        ? submissionData.signature
        : submissionData.name_as_shown_on_your_income_tax_return_name_is_required_on_this_line_do_not_leave_this_line_blank,
    };
  }

  await fetch(url, {
    method: "post",
    body: JSON.stringify(form),
    headers: { "Content-Type": "application/json" },
  });
};

module.exports = {
  signedSPV,
  wFormSigned,
};
