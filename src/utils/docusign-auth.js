// dsJwtAuth.js

/**
 * @file
 * This file handles the JWT authentication with DocuSign.
 * It also looks up the user's account and base_url
 * via the OAuth::userInfo method.
 * See https://developers.docusign.com/esign-rest-api/guides/authentication/user-info-endpoints userInfo method.
 * @author DocuSign
 */


'use strict';
let DsJwtAuth = function _DsJwtAuth(req) {
    // private globals
    this._debug_prefix = 'DsJwtAuth';
    this.accessToken = false
    this.accountId = false
    this.accountName = false
    this.basePath = false
    this._tokenExpiration = false

    // For production use, you'd want to store the refresh token in non-volatile storage since it is
    // good for 30 days. You'd probably want to encrypt it too.
    this._debug = true;  // ### DEBUG ### setting

};
module.exports = DsJwtAuth;  // SET EXPORTS for the module.

const moment = require('moment')
    , fs = require('fs')
    , docusign = require('docusign-esign')
    , dsConfig = require('../config/docusign').config
    , tokenReplaceMin = 10 // The accessToken must expire at least this number of
    , tokenReplaceMinGet = 30
    , rsaKey = dsConfig.privateRSAKey
/**
 * This is the key method for the object.
 * It should be called before any API call to DocuSign.
 * It checks that the existing access accessToken can be used.
 * If the existing accessToken is expired or doesn't exist, then
 * a new accessToken will be obtained from DocuSign by using
 * the JWT flow.
 *
 * This is an async function so call it with await.
 *
 * SIDE EFFECT: Sets the access accessToken that the SDK will use.
 * SIDE EFFECT: If the accountId et al is not set, then this method will
 *              also get the user's information
 * @function
 */
DsJwtAuth.prototype.checkToken = function _checkToken(bufferMin = tokenReplaceMinGet) {
    let noToken = !this.accessToken || !this._tokenExpiration
        , now = moment()
        , needToken = noToken || moment(this._tokenExpiration).subtract(
            bufferMin, 'm').isBefore(now)
        ;
    if (this._debug) {
        if (noToken) {this._debug_log('checkToken: Starting up--need a token')}
        if (needToken && !noToken) {this._debug_log('checkToken: Replacing old token')}
        if (!needToken) {this._debug_log('checkToken: Using current token')}
    }

    return (!needToken)
}

/**
 * Async function to obtain a accessToken via JWT grant
 *
 * RETURNS {accessToken, tokenExpirationTimestamp}
 *
 * We need a new accessToken. We will use the DocuSign SDK's function.
 */
DsJwtAuth.prototype.getToken = async function _getToken() {
    // Data used
    // dsConfig.dsClientId
    // dsConfig.impersonatedUserGuid
    // dsConfig.privateKey
    // dsConfig.dsOauthServer
    const jwtLifeSec = 10 * 60, // requested lifetime for the JWT is 10 min
        scopes = "signature", // impersonation scope is implied due to use of JWT grant
        dsApi = new docusign.ApiClient();
    dsApi.setOAuthBasePath(dsConfig.dsOauthServer.replace('https://', '')); // it should be domain only.

    const results = await dsApi.requestJWTUserToken(dsConfig.dsClientId,
        dsConfig.impersonatedUserGuid, scopes, rsaKey,
        jwtLifeSec);

    const expiresAt = moment().add(results.body.expires_in, 's').subtract(tokenReplaceMin, 'm');
    this.accessToken = results.body.access_token;
    this._tokenExpiration = expiresAt;
    return {
        accessToken: results.body.access_token,
        tokenExpirationTimestamp: expiresAt
    };
}
