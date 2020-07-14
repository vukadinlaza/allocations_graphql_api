const docusign = require('docusign-esign')
const apiClient = new docusign.ApiClient();

const basePath = 'https://demo.docusign.net/restapi'

apiClient.setBasePath(basePath);
apiClient.addDefaultHeader('Authorization', 'Bearer ' + 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IjY4MTg1ZmYxLTRlNTEtNGNlOS1hZjFjLTY4OTgxMjIwMzMxNyJ9.eyJUb2tlblR5cGUiOjUsIklzc3VlSW5zdGFudCI6MTU5NDY4NjMxMiwiZXhwIjoxNTk0NzE1MTEyLCJVc2VySWQiOiJmOWQ4OWI4Yi0wMWFmLTQ0ZDMtYjY0ZS1lNzRlYTJlMzVmZTYiLCJzaXRlaWQiOjEsInNjcCI6WyJzaWduYXR1cmUiLCJjbGljay5tYW5hZ2UiLCJvcmdhbml6YXRpb25fcmVhZCIsInJvb21fZm9ybXMiLCJncm91cF9yZWFkIiwicGVybWlzc2lvbl9yZWFkIiwidXNlcl9yZWFkIiwidXNlcl93cml0ZSIsImFjY291bnRfcmVhZCIsImRvbWFpbl9yZWFkIiwiaWRlbnRpdHlfcHJvdmlkZXJfcmVhZCIsImR0ci5yb29tcy5yZWFkIiwiZHRyLnJvb21zLndyaXRlIiwiZHRyLmRvY3VtZW50cy5yZWFkIiwiZHRyLmRvY3VtZW50cy53cml0ZSIsImR0ci5wcm9maWxlLnJlYWQiLCJkdHIucHJvZmlsZS53cml0ZSIsImR0ci5jb21wYW55LnJlYWQiLCJkdHIuY29tcGFueS53cml0ZSJdLCJhdWQiOiJmMGYyN2YwZS04NTdkLTRhNzEtYTRkYS0zMmNlY2FlM2E5NzgiLCJhenAiOiJmMGYyN2YwZS04NTdkLTRhNzEtYTRkYS0zMmNlY2FlM2E5NzgiLCJpc3MiOiJodHRwczovL2FjY291bnQtZC5kb2N1c2lnbi5jb20vIiwic3ViIjoiZjlkODliOGItMDFhZi00NGQzLWI2NGUtZTc0ZWEyZTM1ZmU2IiwiYXV0aF90aW1lIjoxNTk0Njg1NzMxLCJwd2lkIjoiMDNiNmE3YmYtMmFjYS00N2ZkLTkyOWQtZjEwM2FhM2Q0YTJlIn0.New8lVO85dDb0rK4jIf0u0Pb4go21-QIS_VwCbwOopmKN_cNJPTwBAhON39D2V_GAH6p2_21FbECZhghCbfJpZSpwBb4k44eYAfPZL-60psXuW6RE6PAxHRWiuRMXFMMs5LyVXKTvj5psWHj4lVep0pr6xQudu0I99NCWX7AuELKrIhQGho5hXH4lxdf-8EFqwX4hfTh6YiXrHaiIQ9loxzwl7ztR__CO7SLpseWryRURIm9y4876JL9a47ghKaMyOZD96IBMqThCWMD_Sqg5iTTw54YQ4kXRtQHqWKWl5TLTWpBHSTGS6GPdHXZj8LVR5HRJ7XDD3ARWW2X6_yy3A');
// Set the DocuSign SDK components to use the apiClient object
docusign.Configuration.default.setDefaultApiClient(apiClient);



let envelopesApi = new docusign.EnvelopesApi(apiClient)




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
                    name: user.first_name,
                    userName: user.first_name + user.last_name,
                    recipientId: user.email,
                    clientUserId: user.email,
                    roleName: 'Technician',
                    routingOrder: '1',
                    tabs: {
                    signHereTabs: [{
                        anchorString: 'React',
                        anchorYOffset: '10',
                        anchorUnits: 'pixels',
                        anchorXOffset: '20'
                    }]
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
    const preList =  await envelopesApi.listRecipients(accountId, envelopeId)
    const recipientId = preList.signers.length + 2

    const newSigner = {
                    email: user.email,
                    name: user.first_name,
                    userName: user.first_name + user.last_name,
                    recipientId: recipientId,
                    clientUserId: user.email,
                    roleName: 'new new',
                    tabs: {
                    signHereTabs: [{
                        anchorString: 'React',
                        anchorYOffset: '10',
                        anchorUnits: 'pixels',
                        anchorXOffset: '20'
                    }]
                    }
                }
    const x = {
        recipients: { signers: [newSigner]}
    }


    const updatedEnv = await envelopesApi.createRecipient(accountId, envelopeId, x)

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
    viewRequest.name = user.first_name
    viewRequest.userName = user.first_name + user.last_name;
    viewRequest.recipientId = recipientId
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
    results = await envelopesApi.createRecipientView(accountId, envelopeId, {'recipientViewRequest': viewRequest});

    console.log('THIS ONE', results)
    return ({envelopeId: envelopeId, redirectUrl: results.url})
}

module.exports = {
    makeEnvelopeDef,
    createEnvelope,
    makeRecipientViewRequest,
    createRecipientView
}