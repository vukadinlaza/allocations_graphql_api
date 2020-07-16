const docusign = require('docusign-esign')
const apiClient = new docusign.ApiClient();

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
                        {
                            tabLabel: 'CountyOfCitizenship',
                            show: 'true',
                            value: user.country
                        },
                        {
                            anchorString: '\\SSN/ITIN',
                            show: 'true',
                            value: user.ssnOrItin
                        }, 
                        {
                            tabLabel: 'Text-e038e295-a054-47ca-9e27-df6f8d577101',
                            value: 'YEA BUDDY'
                        }
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
    viewRequest.returnUrl = dsReturnUrl + "?state=123";
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

module.exports = {
    makeEnvelopeDef,
    createEnvelope,
    makeRecipientViewRequest,
    createRecipientView,
    getAuthToken
}