const settings = 
{
  "dsClientId": `${process.env.DOCUSIGN_ACCOUNT_ID}`,
  "dsClientSecret": `${process.env.DOCUSIGN_PRIVATE_KEY}`,
  "appUrl": "http://localhost:3000",
  "production": false,
  "debug": true,
  "sessionSecret": "12345",
  "allowSilentAuthentication": true,
  "targetAccountId": false,
  "impersonatedUserGuid": `${process.env.DS_USER_GUID}`,
  "documentation": null,
  "multiSourceChooser": false
}
const jwt =   
{
  "dsJWTClientId": "${process.env.DOCUSIGN_CLIENT_ID}",
  "impersonatedUserGuid": `${process.env.DS_USER_GUID}`
}
const dsOauthServer = 'https://account-d.docusign.com';

settings.dsClientId = process.env.DOCUSIGN_CLIENT_ID || settings.dsClientId;
settings.appUrl = process.env.DS_APP_URL || settings.appUrl;
settings.dsJWTClientId = process.env.DS_JWT_CLIENT_ID || jwt.dsJWTClientId;
settings.privateRSAKey = process.env.DOCUSIGN_CLIENT_PRIVATE_KEY.replace(/\\n/gm, '\n') || ''
settings.impersonatedUserGuid =  process.env.DS_IMPERSONATED_USER_GUID || jwt.impersonatedUserGuid;

exports.config = {
  dsOauthServer,
  ...settings
};