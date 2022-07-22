// Find your API tokens here: https://app.docspring.com/api_tokens
const moment = require("moment");
const DocSpring = require("docspring");
const { capitalize, omit } = require("lodash");
const { ObjectId } = require("mongodb");
const { sendSPVDoc } = require("../mailers/spv-doc-mailer");
const { wFormSigned } = require("../zaps/signedDocs");
const { DocSpringApi } = require("./docspringApi");

var config = new DocSpring.Configuration();
config.apiTokenId = process.env.DOC_SPRING_API_ID;
config.apiTokenSecret = process.env.DOC_SPRING_API_SECRET;

let docspring = new DocSpring.Client(config);

const DocSpringAPI = new DocSpringApi(
  process.env.DOC_SPRING_API_ID,
  process.env.DOC_SPRING_API_SECRET
);

const getTemplateData = (input, user, templateId) => {
  const {
    ssn,
    ein,
    title,
    state,
    country,
    pension,
    fullName,
    initials,
    legalName,
    individual,
    ira_account,
    sole_member,
    multi_member,
    home_address,
    investor_type,
    c_corporation,
    s_corporation,
    joint_tenants,
    mailing_address,
    revocable_trust,
    investmentAmount,
    irrevocable_trust,
    tenants_in_commons,
    general_partnership,
    limited_partnership,
    tenants_by_entirety,
    accredited_investor_status,
    secondInvestor,
    is3c7_options_status,
    address,
    cifusStatus,
    realEstateUseage,
  } = input;

  const SIGNATURE_ONLY_TEMPLATE = "tpl_ctrRDXgQdKz5YGg9QK";
  const oldTemplates = [
    "tpl_RrmjKbpFRr7qhKY3dD",
    "tpl_xhqLHTtbGrLnS4tYRS",
    "tpl_Z6jkb55rjqThssk3jG",
    "tpl_ARmHkgKjECPmDT6ad9",
    "tpl_3nKjygaFgz44KyCANJ",
    "tpl_xhqLHTtbGrLnS4tYRS",
    "tpl_RrmjKbpFRr7qhKY3dD",
  ];
  const isTypeIndividual = investor_type === "individual";
  const isTypeEntity = investor_type === "entity";
  const countryWithState =
    country + (country === "United States" ? `, ${state}` : "");
  const nameToUse = isTypeIndividual ? legalName : fullName;
  const communeDeals = ["tpl_hK65xPJdKpgTPyks9H", "tpl_Y6hNCEc6CqzNkqpyPp"];

  const irishAngelsDeals = [
    "tpl_ratHTKYeHh9qcd2eYx",
    "tpl_5tPkcRZYQ6mmpZAsKJ",
    "tpl_XkPZF7xHnKmHgXtfpk",
    "tpl_3mYnSE7HZKn3dDahSA",
    "tpl_N6HL2caRJLaNQrYR9j",
    "tpl_x6JhxyTyZ3fj49XAZg",
    "tpl_EYxzxPx3Lh5dSEaDbM",
    "tpl_RD3Y4ESZzeyqkK5sLG",
    "tpl_hM9Z7kDTRQHQ5eZAj3",
    "tpl_RSMHzMg3bRh5FXexCy",
    "tpl_y2pTERp3ZPnP6yeLKF",
    "tpl_pLCaA3MRhfeSfQYhdn",
    "tpl_9KMF9czg3QRCsYjHTt",
    "tpl_TaFALsk9yKCbKXkqQe",
    "tpl_qHfsr76ZaHLAD5AjZn",
    "tpl_eM6JXmJ4NQb9adTyKd",
    "tpl_FCdLsyKMSe3cmZ9NQX",
    "tpl_NhtdhXPRgq3nd3qHXS",
    "tpl_Z3aePF3GnHKE2Z2gDt",
    "tpl_QXdMeT3D4dedsTfkTx",
    "tpl_GGQxKF9RdXfGbsaxEK",
    "tpl_4RacsKmEam7LmYqnEC",
    "tpl_hT3PfeKe3SxENM2Zxt",
    "tpl_yEe4bnxgmMAyhMCySy",
    "tpl_gxRgP6ax2m6sb9PGjT",
    "tpl_9ereb3zJYd2kY7RkLM",
    "tpl_QfPJCm237trkjEPsay",
    "tpl_c53jCSxbZEq9mdDkCA",
    "tpl_QG3aK6LCEhAzzr63Sb",
  ];

  const kunalDeals = [
    "tpl_FbnCe3L7c9Qj32JHTG",
    "tpl_q42NLbhm5gRT4SKLkf",
    "tpl_yALgSxJfJHpXnXZKcc",
    "tpl_H7DMZHRSTKPGM5ZyLX",
    "tpl_7KMf3AH9y3zZs5GCE9",
    "tpl_pP5F9Z77MJAEqkPf22",
    "tpl_sh7zatD4HjxmKYNNAP",
    "tpl_KhPJ3DeqTYyKRYRqmY",
    "tpl_xrgJR6b3JzarAYDhaz",
    "tpl_nFmH9EdeLQbqq4YdJN",
    "tpl_YJzL65StACfR29Q2Tc",
    "tpl_RPkFTESPMpYPhMJ6eY",
    "tpl_JyxfDpAA3h6f2aqhxh",
    "tpl_qrZ9GtmZCNJZhG5NYX",
    "tpl_fSf2fzNfKPjscCafEg",
  ];

  const techstarDeals = [
    "tpl_sCh9nKL4gtEe4mKCGY",
    "tpl_fSkjPHkrrNSZTb6YnJ",
    "tpl_G2yTY3qtZs3RLMC2fe",
    "tpl_EdhpFQgJGdbnLMCq2j",
  ];

  if (templateId === "tpl_qbHh2KPqMkXaTyZbr7") {
    return {
      InvestorType: capitalize(investor_type),
      MemberName: legalName,
      SubAmount: investmentAmount,
      real_estate_useage: realEstateUseage || "N/A",
      USStateIndividual: isTypeIndividual ? countryWithState : "",
      Title: isTypeIndividual ? "" : title || "",
      USStateEntity: isTypeEntity ? countryWithState : "",
      AccredIndiv: isTypeIndividual
        ? accredited_investor_status || is3c7_options_status
        : "",
      AccredEntity: isTypeIndividual
        ? ""
        : accredited_investor_status || is3c7_options_status,
      Email: user.email,
      FullName: nameToUse,
      Signature: nameToUse,
      "Date Signed": moment(new Date()).format("MM/DD/YYYY"),
      MemberName2:
        isTypeIndividual && secondInvestor
          ? secondInvestor.secondLegalName
          : " ",
      FullName2:
        isTypeIndividual && secondInvestor
          ? secondInvestor.secondLegalName
          : "",
      Signature2:
        isTypeIndividual && secondInvestor
          ? secondInvestor.secondLegalName
          : " ",
      Email2:
        isTypeIndividual && secondInvestor ? secondInvestor.secondEmail : " ",
      // "Date Signed2": !secondInvestor
      //   ? ""
      //   : moment(new Date()).format("MM/DD/YYYY") || " ",
    };
  }

  if (kunalDeals.includes(templateId)) {
    return {
      InvestorType: capitalize(investor_type),
      MemberName: legalName,
      SubAmount: investmentAmount,
      USStateIndividual: isTypeIndividual ? countryWithState : "",
      USStateEntity: isTypeEntity ? countryWithState : "",
      QualifiedPurchaserIndiv: isTypeIndividual ? is3c7_options_status : "",
      QualifiedPurchaserEntity: isTypeIndividual ? "" : is3c7_options_status,
      Email: user.email,
      FullName: nameToUse,
      Signature: nameToUse,
      "Date Signed": moment(new Date()).format("MM/DD/YYYY"),
    };
  }
  if (techstarDeals.includes(templateId)) {
    return {
      InvestorType: capitalize(investor_type),
      MemberName: legalName,
      SubAmount: investmentAmount,
      USStateIndividual: isTypeIndividual ? countryWithState : "",
      Title: isTypeIndividual ? "" : title || "",
      USStateEntity: isTypeEntity ? countryWithState : "",
      AccredIndiv: isTypeIndividual
        ? accredited_investor_status || is3c7_options_status
        : "",
      AccredEntity: isTypeIndividual
        ? ""
        : accredited_investor_status || is3c7_options_status,
      Email: user.email,
      FullName: nameToUse,
      Signature: nameToUse,
      "Date Signed": moment(new Date()).format("MM/DD/YYYY"),
      MemberName2:
        isTypeIndividual && secondInvestor
          ? secondInvestor.secondLegalName
          : " ",
      FullName2:
        isTypeIndividual && secondInvestor
          ? secondInvestor.secondLegalName
          : "",
      Signature2:
        isTypeIndividual && secondInvestor
          ? secondInvestor.secondLegalName
          : " ",
      Email2:
        isTypeIndividual && secondInvestor ? secondInvestor.secondEmail : " ",

      CIFUSDefinition: cifusStatus
        ? `${cifusStatus} as defined under the CFIUS Regulations`
        : " ",
    };
  }

  if (templateId === SIGNATURE_ONLY_TEMPLATE) {
    return {
      signature: nameToUse,
    };
  } else if (oldTemplates.includes(templateId)) {
    return {
      subscriptiondocsOne: capitalize(investor_type),
      subscriptiondocsTwo: legalName,
      investmentAmount: investmentAmount,
      subscriptiondocsThree: isTypeIndividual ? countryWithState : "",
      subscriptiondocsFour: isTypeEntity ? countryWithState : "",
      subscriptiondocsFive: isTypeIndividual ? accredited_investor_status : "",
      subscriptiondocsSix: isTypeIndividual ? "" : accredited_investor_status,
      email: user.email,
      fullName: nameToUse,
      signature: nameToUse,
      memberName: legalName,
      date: moment(new Date()).format("MM/DD/YYYY"),
    };
  } else if (communeDeals.includes(templateId)) {
    return {
      InvestorType: capitalize(investor_type),
      MemberName: legalName,
      SubAmount: investmentAmount,
      USStateIndividual: isTypeIndividual ? countryWithState : "",
      USStateEntity: isTypeEntity ? countryWithState : "",
      AccredIndiv: isTypeIndividual ? accredited_investor_status : "",
      AccredEntity: isTypeIndividual ? "" : accredited_investor_status,
      Email: user.email,
      FullName: nameToUse,
      Signature: nameToUse,
      "Date Signed": moment(new Date()).format("MM/DD/YYYY"),
      Title: title,
    };
  } else if (irishAngelsDeals.includes(templateId)) {
    return {
      InvestorType: capitalize(investor_type) || " ",
      MemberName: isTypeEntity ? legalName : " ",
      SubAmount: investmentAmount || " ",
      USStateIndividual: isTypeIndividual ? countryWithState : "",
      USStateEntity: isTypeEntity ? countryWithState : "",
      Email: user.email || " ",
      FullName: isTypeEntity ? nameToUse : " ",
      EntityName: isTypeEntity ? nameToUse : " ",
      InvestorName: isTypeIndividual ? legalName || " " : legalName || " ",
      IndividualName: isTypeIndividual ? nameToUse : " ",
      Signature: nameToUse,
      EntitySignature: isTypeEntity ? nameToUse : " ",
      IndividualSignature: isTypeIndividual ? nameToUse : " ",
      "Date Signed": moment(new Date()).format("MM/DD/YYYY"),
      Title: isTypeEntity ? title : " ",
      EIN: isTypeEntity ? ein : " ",
      SocialSecurityNumber: isTypeIndividual ? ssn : " ",
      HomeAddress: home_address || " ",
      MailingAddress: mailing_address || " ",
      SoleMember: sole_member || false,
      MultiMember: multi_member || false,
      CCorporation: c_corporation || false,
      SCorporation: s_corporation || false,
      GeneralPartnership: general_partnership || false,
      LimitedPartnership: limited_partnership || false,
      IrrevocableTrust: irrevocable_trust || false,
      RevocableTrust: revocable_trust || false,
      IRAAccount: ira_account || false,
      Pension: pension || false,
      Individual: individual || false,
      JointTenants: joint_tenants || false,
      TenantsByEntirety: tenants_by_entirety || false,
      TenantsInCommon: tenants_in_commons || false,
      Initials: initials || " ",
      IndividualName2:
        isTypeIndividual && secondInvestor
          ? secondInvestor.secondLegalName
          : " ",
      InvestorName2:
        isTypeIndividual && secondInvestor
          ? secondInvestor.secondLegalName
          : " ",
      IndividualSignature2:
        isTypeIndividual && secondInvestor
          ? secondInvestor.secondLegalName
          : " ",
      Signature2:
        isTypeIndividual && secondInvestor
          ? secondInvestor.secondLegalName
          : " ",
      SocialSecurityNumber2:
        isTypeIndividual && secondInvestor
          ? secondInvestor.secondSignerSSN
          : " ",
      Email2:
        isTypeIndividual && secondInvestor ? secondInvestor.secondEmail : " ",
      Initials2:
        isTypeIndividual && secondInvestor
          ? secondInvestor.secondSignerInitials
          : " ",
      InvestorType2: !secondInvestor ? "" : capitalize(investor_type) || " ",
      "Date Signed2": !secondInvestor
        ? ""
        : moment(new Date()).format("MM/DD/YYYY") || " ",
    };
  } else if (
    [
      "tpl_y3GEaLkZMDqhHT6SqE",
      "tpl_zbmQNPrkqXnJmFMD7C",
      "tpl_sCjzLb53RKfSd7ZErJ",
      "tpl_ZAZ2ppLSMkjbRGzzT5",
    ].includes(templateId)
  ) {
    return {
      InvestorType: capitalize(investor_type),
      MemberName: legalName,
      SubAmount: investmentAmount,
      USStateIndividual: isTypeIndividual ? countryWithState : "",
      USStateEntity: isTypeEntity ? countryWithState : "",
      AccredIndiv: isTypeIndividual ? accredited_investor_status : "",
      AccredEntity: isTypeIndividual ? "" : accredited_investor_status,
      Email: user.email,
      FullName: nameToUse,
      Signature: nameToUse,
      Address: address,
      Title: isTypeIndividual ? "" : title || "",
      "Date Signed": moment(new Date()).format("MM/DD/YYYY"),
    };
  } else {
    return {
      InvestorType: capitalize(investor_type),
      MemberName: legalName,
      SubAmount: investmentAmount,
      USStateIndividual: isTypeIndividual ? countryWithState : "",
      Title: isTypeIndividual ? "" : title || "",
      USStateEntity: isTypeEntity ? countryWithState : "",
      AccredIndiv: isTypeIndividual
        ? accredited_investor_status || is3c7_options_status
        : "",
      AccredEntity: isTypeIndividual
        ? ""
        : accredited_investor_status || is3c7_options_status,
      Email: user.email,
      FullName: nameToUse,
      Signature: nameToUse,
      "Date Signed": moment(new Date()).format("MM/DD/YYYY"),
      MemberName2:
        isTypeIndividual && secondInvestor
          ? secondInvestor.secondLegalName
          : " ",
      FullName2:
        isTypeIndividual && secondInvestor
          ? secondInvestor.secondLegalName
          : "",
      Signature2:
        isTypeIndividual && secondInvestor
          ? secondInvestor.secondLegalName
          : " ",
      Email2:
        isTypeIndividual && secondInvestor ? secondInvestor.secondEmail : " ",
      // "Date Signed2": !secondInvestor
      //   ? ""
      //   : moment(new Date()).format("MM/DD/YYYY") || " ",
    };
  }
};

const updateInvestment = async (
  datasources,
  db,
  investmentStatus,
  payload,
  newDocsArray
) => {
  const updatedInvestmentData = {
    status: investmentStatus === "invited" ? "signed" : investmentStatus,
    amount: parseFloat(payload.investmentAmount.replace(/,/g, "")),
    documents: newDocsArray,
  };

  await db.investments.updateOne(
    { _id: ObjectId(payload.investmentId) },
    { $set: updatedInvestmentData }
  );
};

const addPacket = async (db, user, payload) => {
  const signingpacket = {
    userEmail: user.email,
    userId: user._id,
    authMethod: "in-session",
    signedAt: new Date(),
    clientIp: payload.clientIp,
    investmentId: ObjectId(payload.investmentId),
    submissionData: {
      ...payload,
      userEmail: user.email,
      userId: user._id,
    },
  };
  await db.signingpackets.insertOne({ ...signingpacket });
};

const updateSubmissionData = async (response, db, investmentId) => {
  await db.investments.updateOne(
    { _id: ObjectId(investmentId) },
    {
      $set: { "submissionData.submissionId": response.id },
    }
  );
  return response;
};

const updateUserDocuments = async (
  response,
  db,
  templateName,
  userId,
  payload
) => {
  const { id, permanentDownloadUrl } = response;
  const docObj = {
    documentName: templateName,
    submissionId: id,
    docspringPermDownloadLink: permanentDownloadUrl,
  };

  await db.users.updateOne(
    { _id: ObjectId(userId) },
    {
      $push: { documents: docObj },
    }
  );

  wFormSigned(payload);

  return new Promise((res) => {
    return res(response);
  });
};

const generateDocSpringPDF = async (
  db,
  deal,
  user,
  input,
  templateName,
  timeStamp,
  templateId
) => {
  let data = getTemplateData(input, user, templateId);
  console.log("REAL SUBMISSION DATA", data);

  var submission_data = {
    editable: false,
    data: data,
    metadata: {
      user_id: user._id,
      investmentId: input.investmentId,
      templateName: templateName,
      timeStamp: timeStamp,
    },
    field_overrides: {
      // title: {
      // 	required: false,
      // },
    },
    test: process.env.NODE_ENV === "production" ? false : true,
    wait: true,
  };

  const response = await DocSpringAPI.generatePDF(templateId, submission_data);
  if (response.status !== "success")
    return {
      status: response.status,
    };

  const { name } = await db
    .collection("organizations")
    .findOne({ _id: ObjectId(deal.organization) });

  const emailData = {
    pdfDownloadUrl: response.downloadUrl,
    email: user.email,
    deal,
    orgName: name,
  };

  sendSPVDoc(emailData);
  updateSubmissionData(response, db, input.investmentId);
  return response.permanentDownloadUrl;
};

const createTaxDocument = async ({ payload, user, db }) => {
  const { kycTemplateName, kycTemplateId } = payload;
  const sig =
    kycTemplateName === "W-9"
      ? payload.name_as_shown_on_your_income_tax_return_name_is_required_on_this_line_do_not_leave_this_line_blank
      : payload.signature;
  const keysToOmit = [
    "kycTemplateId",
    "kycTemplateName",
    "tax_classification",
    "isDemo",
  ];
  const data = omit({ ...payload, signature: sig }, keysToOmit);

  var submission_data = {
    editable: false,
    data: data,
    metadata: {
      user_id: user._id,
      templateName: kycTemplateName,
    },
    field_overrides: {},
    test: process.env.NODE_ENV === "production" ? false : true,
    wait: true,
  };

  const response = await DocSpringAPI.generatePDF(
    kycTemplateId,
    submission_data
  );
  if (response.status !== "success") return;
  return await updateUserDocuments(
    response,
    db,
    kycTemplateName,
    user._id,
    payload
  );
};

const getInvestmentPreview = ({ input, user }) => {
  const timeStamp = Date.now();
  const { docSpringTemplateId } = input;
  let data = getTemplateData(input, user, docSpringTemplateId);
  var submission_data = {
    editable: false,
    data: data,
    metadata: {
      user_id: user._id,
      templateName: docSpringTemplateId,
      timeStamp: timeStamp,
      preview: true,
    },
    field_overrides: {},
    test: process.env.NODE_ENV === "production" ? false : true,
    wait: true,
  };

  return new Promise((resolve, reject) => {
    docspring.generatePDF(
      docSpringTemplateId,
      submission_data,
      (error, response) => {
        if (error) reject(error);
        else resolve(response.submission);
      }
    );
  });
};

const getTemplate = async ({
  datasources,
  db,
  deal,
  payload,
  user,
  templateId,
  investmentDocs = [],
  investmentStatus,
}) => {
  const response = await DocSpringAPI.getTemplate(templateId);
  if (response.status !== "success") return;

  const timeStamp = Date.now();
  const adjTemplateName = response.name
    .replace(/[^a-zA-Z0-9 _-]/g, "") // removes unwanted special characters
    .replace(/\s\s+/g, "")
    .replace(/ /g, "_"); // removes extra spaces

  const key = `investments/${payload.investmentId}/${timeStamp}-${adjTemplateName}.pdf`;

  const oldDocs = investmentDocs.filter(
    (doc) => !doc.includes(adjTemplateName)
  );
  const newDocsArray = [...oldDocs, key];
  const permanentDownloadUrl = await generateDocSpringPDF(
    db,
    deal,
    user,
    payload,
    adjTemplateName,
    timeStamp,
    templateId
  );
  updateInvestment(datasources, db, investmentStatus, payload, newDocsArray);
  addPacket(db, user, payload);

  return permanentDownloadUrl;
};

const createCapitalAccountDoc = ({ payload }) => {
  var submission_data = {
    editable: false,
    data: payload,
    field_overrides: {},
    test: process.env.NODE_ENV === "production" ? false : true,
    wait: true,
  };

  return new Promise((resolve, reject) => {
    docspring.generatePDF(
      "tpl_X2jPRnxTt57kTF7jFP",
      submission_data,
      (error, response) => {
        if (error) reject(error);
        else resolve(response.submission);
      }
    );
  });
};

/**
 * create dynamic wire instructions based on banking provider, return key for upload to aws
 */
const createInvestmentWireInstructions = ({
  providerName,
  investmentId,
  investorName,
  spvName,
  referenceNumber,
}) => {
  //map containing template information per banking provider
  const providerMap = {
    "New Directions": {
      template_name: "Allocations_New_Directions_Wire_Instructions",
      template_id: "tpl_3q73TzjRrYGDYzK6De",
    },
  };
  const templateData = providerMap[providerName];

  const timeStamp = Date.now();
  const submission_data = {
    editable: false,
    data: {
      "Reference Number": referenceNumber,
      "Investor Name": investorName,
      "SPV Name": spvName,
    },
    metadata: {
      timeStamp,
      investmentId,
      templateName: templateData.template_name,
    },
    field_overrides: {},
    test: process.env.NODE_ENV === "production" ? false : true,
    wait: true,
  };

  const key = `investments/${investmentId}/${timeStamp}-${templateData.template_name}.pdf`;

  return new Promise((resolve, reject) => {
    docspring.generatePDF(
      templateData.template_id,
      submission_data,
      (error) => {
        if (error) reject(error);
        else resolve(key);
      }
    );
  });
};

module.exports = {
  generateDocSpringPDF,
  createTaxDocument,
  getInvestmentPreview,
  getTemplate,
  createCapitalAccountDoc,
  createInvestmentWireInstructions,
};
