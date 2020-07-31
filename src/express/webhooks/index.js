const { Router } = require('express');
const { ObjectId } = require('mongodb')
const { get } = require('lodash')
const { connect } = require('../../mongo/index')
const convert = require('xml-js');

module.exports = Router()
  .post('/docusign', async (req, res, next) => {
    try {
    const { rawBody } = req;
    const db = await connect();

    const docusignData = JSON.parse(convert.xml2json(rawBody, {compact: true, spaces: 4}));
    
    const signerDocusignData = get(docusignData, 'DocuSignEnvelopeInformation.EnvelopeStatus.RecipientStatuses', {})
    // Gets User data from Docusign body
    const signerEmail = get(signerDocusignData, 'RecipientStatus.Email._text')
    const signedAt = get(signerDocusignData, 'RecipientStatus.Signed._text')
    const signerDocusignId = get(signerDocusignData, 'RecipientStatus.RecipientId._text')

    // Gets Document/Envelope data
    const envelopeId = get(docusignData, 'DocuSignEnvelopeInformation.EnvelopeStatus.EnvelopeID._text')
    const documentName = get(docusignData, 'DocuSignEnvelopeInformation.EnvelopeStatus.DocumentStatuses.DocumentStatus.Name._text')
    const documentId = get(docusignData, 'DocuSignEnvelopeInformation.EnvelopeStatus.DocumentStatuses.DocumentStatus.ID._text')


    let fieldData = get(signerDocusignData, 'RecipientStatus.FormData.xfdf.fields.field', [])    
    if(!Array.isArray(fieldData)) {
      fieldData = [fieldData]
    }

    const dealFeild = fieldData.find(f => f._attributes.name === 'Deal-ID')
    const dealId = get(dealFeild, 'value._text')

    console.log('deal id', dealId)

    const user = await db.users.findOne({email: signerEmail});
    console.log('user id', user._id)


    if(!user) {
      return res.status(400).end();  
    }

    const investment = db.investments.findOne{deal_id: ObjectId(dealId), user_id: user._id}
    console.log('investment', investment._id)

    if(!investment) {
      return res.status(400).end();
    }

    if(dealId) {
      await db.investments.findOneAndUpdate({_id: investment._id}, {$set: {status: 'signed'}})
    }

    await db.users.findOneAndUpdate({_id: user._id}, { $push: {documents: {signedAt, signerDocusignId, envelopeId, documentName, documentId}}});

    return res.status(200).end();

    } catch (err) {
        next(err);
    }
  });