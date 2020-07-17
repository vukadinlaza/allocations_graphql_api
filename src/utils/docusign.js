const docusign = require('docusign-esign')
const apiClient = new docusign.ApiClient();
const {map} = require('lodash')

const basePath = process.env.NODE_ENV === 'production' ? 'https://docusign.net/restapi' : 'https://demo.docusign.net/restapi'
const DsJwtAuth = require('./docusign-auth')

apiClient.setBasePath(basePath);

// Set the DocuSign SDK components to use the apiClient object
docusign.Configuration.default.setDefaultApiClient(apiClient);

let envelopesApi = new docusign.EnvelopesApi(apiClient)

const getAuthToken = async () => {
    const hasToken = await DsJwtAuth.prototype.checkToken()
    if(!hasToken) {
        const token = await DsJwtAuth.prototype.getToken()
        apiClient.addDefaultHeader('Authorization', 'Bearer ' + token.accessToken);
    }
}



const makeEnvelopeDef = ({user, templateId}) => {

    let env = new docusign.EnvelopeDefinition();
    env.emailSubject = 'Please sign this document';
    env.status = 'sent'
    env.compositeTemplates =  [
        {
        serverTemplates: [
            {
            sequence: 1,
            templateId
            }
        ],
        inlineTemplates: [
            {
            sequence: 2,
            recipients: {
                signers: [
                {
                    email: user.email,
                    name: user.signer_full_name || `${user.firstName} ${user.lastName}`,
                    userName: user.signer_full_name || `${user.firstName} ${user.lastName}`,
                    recipientId: '10001',
                    clientUserId: user.email,
                    roleName: 'Signer',
                    routingOrder: '1',
                    tabs: {
                        // Extract to util function => return different tabs based on doc type
                        textTabs: [
                        {
                            tabLabel: 'Full-Name',
                            show: 'true',
                            value: user.signer_full_name || `${user.firstName} ${user.lastName}`
                        },
                        {
                            tabLabel: 'Entity-Name',
                            show: 'true',
                            value: user.investor_type === 'entity' ? user.entity_name : ''
                        },
                        {
                            tabLabel: 'Street-Address',
                            show: 'true',
                            value: user.street_address
                        },
                        {
                            tabLabel: 'City-State-Zip-Province',
                            show: 'true',
                            value: `${user.city}, ${user.state}, ${user.zip}`
                        },
                        {tabLabel: 'Address-Country', value: user.country},
                        {tabLabel: 'SSN-ITIN', value: user.ssn_itin},
                        {tabLabel: 'Date-Of-Birth', value: user.dob},
                        {tabLabel: 'Foreign-Tax-Number', value: user.foreign_tax_number},
                        {tabLabel: 'Mailing-Street-Address', value: user.mail_street_address},
                        {tabLabel: 'Mailing-City-State-Zip-Province', value: `${user.mail_city}, ${user.mail_state}, ${user.mail_zip}`},
                        {tabLabel: 'Mailing-Country', value: user.mail_country},
                        {tabLabel: 'Citizenship-Country', value: user.country},


                        {tabLabel: 'Tax-Treaty-Special-Rates-Conditions-Paragraph', value: user.tax_treaty_rates_conditions},
                        {tabLabel: 'Tax-Treaty-Special-Rates-Conditions-Percent', value: user.claim_percent_withholding},
                        {tabLabel: 'Tax-Treaty-Special-Rates-Conditions-Income-Type', value: user.types_of_income},
                        {tabLabel: 'Tax-Treaty-Special-Rates-Conditions-Extra-Info', value: user.additional_explanation},


                        {tabLabel: 'Exempt-Payee-Code', value: user.exempt_payee_code},
                        {tabLabel: 'Exemption-FATCA-Code', value: user.fatca_code},
                        ]
                    }
                }
                ]
            }
            }
        ]
        }
    ]
  
  
    return env
}

const createEnvelope = async ({envelopeDefinition, accountId}) => {    
    let results = null;
    // Step 2. call Envelopes::create API method
    results = await envelopesApi.createEnvelope(accountId, {envelopeDefinition});
    let envelopeId = results.envelopeId;
    console.log(`Envelope was created. EnvelopeId ${envelopeId}`);
    return {envelopeId}
}


const makeRecipientViewRequest = async ({user, dsPingUrl, dsReturnUrl, envelopeId, accountId}) => {
    let viewRequest = new docusign.RecipientViewRequest();
    const env = await envelopesApi.listRecipients(accountId, envelopeId)

    // Will need to change or update this. 
    viewRequest.returnUrl = dsReturnUrl + `/deals/${user.activeInvestment.org}/${user.activeInvestment.deal_slug}`;
    viewRequest.authenticationMethod = 'email';

    
    // Recipient information must match embedded recipient info
    // we used to create the envelope.
    viewRequest.email = user.email;
    viewRequest.name = user.signer_full_name || `${user.firstName} ${user.lastName}`,
    viewRequest.userName =  user.signer_full_name || `${user.firstName} ${user.lastName}`,
    viewRequest.recipientId = '10001';
    viewRequest.clientUserId = user.email;
    viewRequest.userId = env.signers.find(r => r.email === user.email).userId

    viewRequest.pingFrequency = "600";
    viewRequest.pingUrl = dsPingUrl; 

    return viewRequest
}


const createRecipientView = async ({viewRequest, accountId, envelopeId}) => {
    // Call the CreateRecipientView API
    let results 
    results = await envelopesApi.createRecipientView(accountId, envelopeId, {'recipientViewRequest': viewRequest});

    return ({envelopeId: envelopeId, redirectUrl: results.url})
}


const getKYCTemplateId = ({input}) => {

    console.log(input)
    const isUsCitizen = input.country === 'United States'

    const kycDocuments = [	
    {	
    isUsCitizen: true,	
    formType: 'W-9 Entity',	
    investor_type: 'entity',	
    templateId: '460efb59-b4e9-452b-bc5f-1d8a53114acc'	
    },	
    {	
    isUsCitizen: true, 	
    formType: 'W-9 Individual',	
    investor_type: 'individual',	
    templateId: '460efb59-b4e9-452b-bc5f-1d8a53114acc'	
    },	
    {	
    isUsCitizen: false, 	
    investor_type: 'individual',	
    formType: 'W-8BEN Individual',	
    templateId: 'ae7f91d5-381c-4ca2-ae2e-4161bad232c7'	
    },	 	
    ]

    return kycDocuments.find(doc => {	
        return doc.isUsCitizen === isUsCitizen && doc.investor_type === input.investor_type	
    })
}

const createSignerTabs = ({input}) => {
  const x = [

    {tabLabel: 'Street-Address', label: 'Street Address', slug: 'mail_street_address'},
    {tabLabel: 'Mailing-City-State-Zip-Province', label: 'City', slug: 'mail_city'},
    {tabLabel: 'Mailing-City-State-Zip-Province', label: 'State', slug: 'mail_state'},
    {tabLabel: 'Mailing-City-State-Zip-Province', label: 'Zip', slug: 'mail_zip'},
    {tabLabel: 'Mailing-Country', label: 'Country', slug: 'mail_country'}
  ]

  const tabs = x.map(item => {
      return {
          ...item,
           value: input[item.slug]
      }
  })
  return tabs
}

module.exports = {
    makeEnvelopeDef,
    createEnvelope,
    makeRecipientViewRequest,
    createRecipientView,
    getAuthToken,
    getKYCTemplateId,
}