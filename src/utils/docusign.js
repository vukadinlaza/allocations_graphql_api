const docusign = require('docusign-esign')
const apiClient = new docusign.ApiClient();

const basePath = 'https://demo.docusign.net/restapi'
const DsJwtAuth = require('./docusign-auth')

apiClient.setBasePath(basePath);

// Set the DocuSign SDK components to use the apiClient object
docusign.Configuration.default.setDefaultApiClient(apiClient);

let envelopesApi = new docusign.EnvelopesApi(apiClient)

const getAuthToken = async () => {
    const hasToken = await DsJwtAuth.prototype.checkToken()
    const token = await DsJwtAuth.prototype.getToken()
    console.log(token)
    apiClient.addDefaultHeader('Authorization', 'Bearer ' + token.accessToken);
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
                    name: user.first_name || user.signer_full_name,
                    userName: user.first_name || user.signer_full_name,
                    recipientId: '10001',
                    clientUserId: user.email,
                    roleName: 'Signer',
                    routingOrder: '1',
                    tabs: {
                        signHereTabs: [{
                            anchorString: 'React',
                            anchorYOffset: '10',
                            anchorUnits: 'pixels',
                            anchorXOffset: '20'
                        }],
                        textTabs: [{
                            tabLabel: 'Text-1685d421-1287-49cb-87ac-da3b868846fc',
                            show: 'true',
                            value: user.email,
                        },
                        {
                            tabLabel: '\\*firstName',
                            show: 'true',
                            value: user.firstName || user.signer_full_name,
                        },
                        {
                            tabLabel: '\\*lastName',
                            show: 'true',
                            value: user.lastName || user.signer_full_name,

                        },
                        {
                            tabLabel: '\\*country', 
                            show: 'true',
                            value: user.country || ''
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
    // Exceptions will be caught by the calling function
    results = await envelopesApi.createEnvelope(accountId, {envelopeDefinition});

    let envelopeId = results.envelopeId;
    console.log(`Envelope was created. EnvelopeId ${envelopeId}`);

    return {envelopeId}

}


const makeRecipientViewRequest = async ({user, dsPingUrl, dsReturnUrl, envelopeId, accountId}) => {
    // Data for this method
    // args.dsReturnUrl 
    // args.signerEmail 
    // args.signerName 
    // args.signerClientId
    // args.dsPingUrl 

    let viewRequest = new docusign.RecipientViewRequest();
    const env = await envelopesApi.listRecipients(accountId, envelopeId)

    // Set the url where you want the recipient to go once they are done signing
    // should typically be a callback route somewhere in your app.
    // The query parameter is included as an example of how
    // to save/recover state information during the redirect to
    // the DocuSign signing ceremony. It's usually better to use
    // the session mechanism of your web framework. Query parameters
    // can be changed/spoofed very easily.
    viewRequest.returnUrl = dsReturnUrl + "?state=123";
    viewRequest.authenticationMethod = 'email';
    // Recipient information must match embedded recipient info
    // we used to create the envelope.

    viewRequest.email = user.email;
    viewRequest.name = user.first_name || user.signer_full_name,
    viewRequest.userName =  user.first_name || user.signer_full_name,
    viewRequest.recipientId = '10001';
    viewRequest.clientUserId = user.email;
    viewRequest.userId = env.signers.find(r => r.email === user.email).userId

    viewRequest.pingFrequency = "600";
    viewRequest.pingUrl = dsPingUrl; 

    return viewRequest
}


const createRecipientView = async ({viewRequest, accountId, envelopeId}) => {
    // Call the CreateRecipientView API
    // Exceptions will be caught by the calling function
    let results 
    console.log('VIEW', viewRequest)
    results = await envelopesApi.createRecipientView(accountId, envelopeId, {'recipientViewRequest': viewRequest});

    console.log('THIS ONE', results)
    return ({envelopeId: envelopeId, redirectUrl: results.url})
}

module.exports = {
    makeEnvelopeDef,
    createEnvelope,
    makeRecipientViewRequest,
    createRecipientView,
    getAuthToken
}