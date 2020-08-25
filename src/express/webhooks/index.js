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

      const docusignData = JSON.parse(convert.xml2json(rawBody, { compact: true, spaces: 4 }));

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
      if (!Array.isArray(fieldData)) {
        fieldData = [fieldData]
      }

      const dealFeild = fieldData.find(f => f._attributes.name === 'Deal-ID')
      const emailfield = fieldData.find(f => f._attributes.name === 'userEmail')
      const dealId = get(dealFeild, 'value._text')
      const userEmail = get(emailfield, 'value._text')

      let user = await db.users.findOne({ email: signerEmail });

      if (!user) {
        return res.status(400).end();
      }

      if (dealId) {
        if (userEmail) {
          user = await db.users.findOne({ email: userEmail });
        }
        const investment = await db.investments.findOne({
          deal_id: ObjectId(dealId),
          user_id: ObjectId(user._id),
        })
        console.log('1')
        const pdf = get(docusignData, 'DocuSignEnvelopeInformation.DocumentPDFs.DocumentPDF.PDFBytes._text')
        const s3Path = `investments/${investment._id}/${documentName}`
        console.log('2', s3path)

        const obj = {
          Bucket,
          Key,
          Body: pdf,
          ContentType: "application/pdf",
        }
        const s3res = await s3.upload(obj)

        console.log(s3path, 9009)

        await db.investments.updateMany({
          deal_id: ObjectId(dealId),
          user_id: ObjectId(user._id),
          status: {
            $in: ['invited', 'onboarded', 'pledged']
          }
        },
          { $set: { status: 'signed' } })
      }

      await db.users.findOneAndUpdate({ _id: ObjectId(user._id) }, { $push: { documents: { signedAt, signerDocusignId, envelopeId, documentName, documentId } } });

      return res.status(200).end();

    } catch (err) {
      console.log(error)
      next(err);
    }
  });