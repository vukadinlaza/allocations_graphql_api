const docusign = require("docusign-esign");
const apiClient = new docusign.ApiClient();
const moment = require("moment");
const { get } = require("lodash");

const basePath =
  process.env.NODE_ENV === "production"
    ? "https://na3.docusign.net/restapi"
    : "https://demo.docusign.net/restapi";
const DsJwtAuth = require("./docusign-auth");

apiClient.setBasePath(basePath);

// Set the DocuSign SDK components to use the apiClient object
docusign.Configuration.default.setDefaultApiClient(apiClient);

let envelopesApi = new docusign.EnvelopesApi(apiClient);
let templatesApi = new docusign.TemplatesApi(apiClient);

const getAuthToken = async () => {
  const hasToken = await DsJwtAuth.prototype.checkToken();
  if (!hasToken) {
    const token = await DsJwtAuth.prototype.getToken();
    apiClient.addDefaultHeader("Authorization", "Bearer " + token.accessToken);
    return token.accessToken;
  }
};

const makeEnvelopeDef = ({ user, templateId, formName }) => {
  const formatSSN = () => {
    const isW9 = formName.includes("W-9");

    if (!user.ssn_itin) return [];
    if (!isW9) {
      return [{ tabLabel: "SSN-ITIN", value: user.ssn_itin }];
    }

    return user.ssn_itin
      .replace(/[^0-9]/g, "")
      .split("")
      .slice(0, 9)
      .map((letter, index) => {
        return {
          tabLabel: `SSN-${index + 1}`,
          value: letter,
        };
      });
  };
  const formatEIN = () => {
    const isW9 = formName.includes("W-9");

    if (!user.ein) return [];
    if (!isW9) {
      return [{ tabLabel: "EIN", value: user.ein }];
    }

    return user.ein
      .replace(/[^0-9]/g, "")
      .split("")
      .slice(0, 9)
      .map((letter, index) => {
        return {
          tabLabel: `EIN-${index + 1}`,
          value: letter,
        };
      });
  };

  const getMailingAddressTabs = () => {
    if (user.usePermAddressAsMailing) {
      return [];
    }
    const mailingTabs = [
      {
        tabLabel: "Mailing-Street-Address",
        value: get(user, "mail_street_address", ""),
      },
      {
        tabLabel: "Mailing-City-State-Zip-Province",
        value: `${get(user, "mail_city", "")}, ${get(
          user,
          "mail_state",
          ""
        )}, ${get(user, "mail_zip", "")}`,
      },
      { tabLabel: "Mailing-Country", value: get(user, "mail_country", "") },
    ];
    return mailingTabs;
  };

  let env = new docusign.EnvelopeDefinition();
  env.emailSubject = "Please sign this document";
  env.status = "sent";
  env.compositeTemplates = [
    {
      serverTemplates: [
        {
          sequence: 1,
          templateId,
        },
      ],
      inlineTemplates: [
        {
          sequence: 2,
          recipients: {
            signers: [
              {
                email: user.email,
                name:
                  user.signer_full_name || `${user.firstName} ${user.lastName}`,
                userName:
                  user.signer_full_name || `${user.firstName} ${user.lastName}`,
                recipientId: "10001",
                clientUserId: user.email,
                roleName: "Signer",
                routingOrder: "1",
                tabs: {
                  // Extract to util function => return different tabs based on doc type
                  textTabs: [
                    {
                      tabLabel: "Full-Name",
                      show: "true",
                      value:
                        user.signer_full_name ||
                        `${user.firstName} ${user.lastName}`,
                    },
                    {
                      tabLabel: "Entity-Name",
                      show: "true",
                      value:
                        user.investor_type === "entity" ? user.entity_name : "",
                    },
                    {
                      tabLabel: "Street-Address",
                      show: "true",
                      value: user.street_address,
                    },
                    {
                      tabLabel: "City-State-Zip-Province",
                      show: "true",
                      value: `${user.city}, ${user.state}, ${user.zip}`,
                    },
                    { tabLabel: "Address-Country", value: user.country },
                    ...formatSSN(),
                    ...formatEIN(),
                    {
                      tabLabel: "Date-Of-Birth",
                      value: moment(user.dob).format("MM/DD/YYYY"),
                    },
                    {
                      tabLabel: "Foreign-Tax-Number",
                      value: user.foreign_tax_number,
                    },
                    { tabLabel: "Citizenship-Country", value: user.country },
                    {
                      tabLabel: "Organization-Name",
                      value: user.organization_name,
                    },
                    ...getMailingAddressTabs(),
                    {
                      tabLabel: "Tax-Treaty-Special-Rates-Conditions-Paragraph",
                      value: user.tax_treaty_rates_conditions,
                    },
                    {
                      tabLabel: "Tax-Treaty-Special-Rates-Conditions-Percent",
                      value: user.claim_percent_withholding,
                    },
                    {
                      tabLabel:
                        "Tax-Treaty-Special-Rates-Conditions-Income-Type",
                      value: user.types_of_income,
                    },
                    {
                      tabLabel:
                        "Tax-Treaty-Special-Rates-Conditions-Extra-Info",
                      value: user.additional_explanation,
                    },
                    {
                      tabLabel: "Exempt-Payee-Code",
                      value: user.exempt_payee_code,
                    },
                    {
                      tabLabel: "Exemption-FATCA-Code",
                      value: user.fatca_code,
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  ];

  return env;
};

const createEnvelope = async ({ envelopeDefinition, accountId }) => {
  let results = null;
  // Step 2. call Envelopes::create API method
  results = await envelopesApi.createEnvelope(accountId, {
    envelopeDefinition,
  });
  let envelopeId = results.envelopeId;
  return { envelopeId };
};

const makeRecipientViewRequest = async ({
  user,
  dsPingUrl,
  envelopeId,
  accountId,
}) => {
  let viewRequest = new docusign.RecipientViewRequest();
  const env = await envelopesApi.listRecipients(accountId, envelopeId);

  // Will need to change or update this.
  viewRequest.returnUrl = "https://allocations.com/thank-you";
  viewRequest.authenticationMethod = "email";

  // Recipient information must match embedded recipient info
  // we used to create the envelope.
  viewRequest.email = user.email;
  viewRequest.name =
    user.signer_full_name || `${user.firstName} ${user.lastName}`;
  viewRequest.userName =
    user.signer_full_name || `${user.firstName} ${user.lastName}`;
  viewRequest.recipientId = "10001";
  viewRequest.clientUserId = user.email;
  viewRequest.userId = env.signers.find((r) => r.email === user.email).userId;
  viewRequest.pingFrequency = "600";
  viewRequest.pingUrl = dsPingUrl;

  return viewRequest;
};

const createRecipientView = async ({ viewRequest, accountId, envelopeId }) => {
  // Call the CreateRecipientView API
  let results;
  results = await envelopesApi.createRecipientView(accountId, envelopeId, {
    recipientViewRequest: viewRequest,
  });

  return { envelopeId: envelopeId, redirectUrl: results.url };
};

const getKYCTemplateId = async ({ input, accountId }) => {
  const isUsCitizen = input.country === "United States";
  const templates = await templatesApi.listTemplates(accountId);

  if (input.documentType === "Provision Of Services") {
    const envData = templates.envelopeTemplates.find((t) =>
      t.name.includes(input.documentType)
    );
    return {
      templateId: envData.templateId,
      formType: "Provision Of Services",
    };
  }

  const kycDocuments = [
    {
      isUsCitizen: true,
      formType: "W-9 Entity",
      investor_type: "entity",
      templateId: templates.envelopeTemplates.find((t) =>
        t.name.includes("W-9-Embedded")
      ).templateId,
    },
    {
      isUsCitizen: true,
      formType: "W-9 Individual",
      investor_type: "individual",
      templateId: templates.envelopeTemplates.find((t) =>
        t.name.includes("W-9-Embedded")
      ).templateId,
    },
    {
      isUsCitizen: false,
      investor_type: "individual",
      formType: "W-8BEN Individual",
      templateId: templates.envelopeTemplates.find((t) =>
        t.name.includes("W-8BEN-Embedded")
      ).templateId,
    },
    {
      isUsCitizen: false,
      investor_type: "entity",
      formType: "W-8BEN Entity",
      templateId: templates.envelopeTemplates.find((t) =>
        t.name.includes("W-8BEN-E-Embedded")
      ).templateId,
    },
  ];

  return kycDocuments.find((doc) => {
    return (
      doc.isUsCitizen === isUsCitizen &&
      doc.investor_type === input.investor_type
    );
  });
};

module.exports = {
  makeEnvelopeDef,
  createEnvelope,
  makeRecipientViewRequest,
  createRecipientView,
  getAuthToken,
  getKYCTemplateId,
};
