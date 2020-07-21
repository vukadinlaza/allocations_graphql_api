'use strict';

let DsJwtAuth = function _DsJwtAuth(req) {
   
    this._debug_prefix = 'DsJwtAuth';
    this.accessToken = false
    this.accountId = false
    this.accountName = false
    this.basePath = false
    this._tokenExpiration = false

    this._debug = true; 

};
module.exports = DsJwtAuth; 

const moment = require('moment')
    , fs = require('fs')
    , docusign = require('docusign-esign')
    , dsConfig = require('../config/docusign').config
    , tokenReplaceMin = 10
    , tokenReplaceMinGet = 30
    , rsaKey = dsConfig.privateRSAKey


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
    const jwtLifeSec = 10 * 60,
        scopes = "signature impersonation",
        dsApi = new docusign.ApiClient();
        console.log('fires from inside getToken 1')
    dsApi.setOAuthBasePath(dsConfig.dsOauthServer.replace('https://', ''));

    console.log('fires from inside getToken 2')
    console.log('vars', dsConfig.dsClientId, dsConfig.impersonatedUserGuid, scopes, rsaKey, jwtLifeSec)

    const results = await dsApi.requestJWTUserToken(dsConfig.dsClientId,
        dsConfig.impersonatedUserGuid, scopes, rsaKey,
        jwtLifeSec);

        console.log('inside getToken 2 with results', results)

    const expiresAt = moment().add(results.body.expires_in, 's').subtract(tokenReplaceMin, 'm');
    this.accessToken = results.body.access_token;
    this._tokenExpiration = expiresAt;
    return {
        accessToken: results.body.access_token,
        tokenExpirationTimestamp: expiresAt
    };
}
