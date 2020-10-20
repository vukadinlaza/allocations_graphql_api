const { Router } = require('express');
const { ObjectId } = require('mongodb')
const { get } = require('lodash')
const { connect } = require('../../mongo/index')
const convert = require('xml-js');
const S3 = require('aws-sdk/clients/s3')
const fetch = require('node-fetch');
const moment = require('moment')
const { putInvestorDoc } = require('../../uploaders/investor-docs')
const { sendConfirmation } = require('../../mailers/signing-complete')
const s3 = new S3({ apiVersion: '2006-03-01' })

let Bucket = process.env.NODE_ENV === "production" ? "allocations-encrypted" : "allocations-encrypted-test"

module.exports = Router()
  .post('/docusign', async (req, res, next) => {
    try {
      const { rawBody } = req;
      const db = await connect();

      const docusignData = JSON.parse(convert.xml2json(rawBody, { compact: true, spaces: 4 }));
      let lpRecipientStatus = get(docusignData, 'DocuSignEnvelopeInformation.EnvelopeStatus.RecipientStatuses.RecipientStatus', {})
      console.log('BEFORE', lpRecipientStatus)
      if (Array.isArray(lpRecipientStatus)) {
        lpRecipientStatus = get(lpRecipientStatus, '[0]')
      }
      console.log('AFTER', lpRecipientStatus)
      // Gets User data from Docusign body
      const signerEmail = get(lpRecipientStatus, 'Email._text', '')
      const signedAt = get(lpRecipientStatus, 'Signed._text')
      const signerDocusignId = get(lpRecipientStatus, 'RecipientId._text')

      // Gets Document/Envelope data
      const envelopeId = get(docusignData, 'DocuSignEnvelopeInformation.EnvelopeStatus.EnvelopeID._text')
      const documentName = get(docusignData, 'DocuSignEnvelopeInformation.EnvelopeStatus.DocumentStatuses.DocumentStatus.Name._text')
      const documentId = get(docusignData, 'DocuSignEnvelopeInformation.EnvelopeStatus.DocumentStatuses.DocumentStatus.ID._text')


      let fieldData = get(lpRecipientStatus, 'FormData.xfdf.fields.field', [])
      if (!Array.isArray(fieldData)) {
        fieldData = [fieldData]
      }

      const dealFeild = fieldData.find(f => f._attributes.name === 'Deal-ID')
      const emailfield = fieldData.find(f => f._attributes.name === 'userEmail')
      const dealId = get(dealFeild, 'value._text')
      const userEmail = get(emailfield, 'value._text')


      console.log('EMAILS', signerEmail, userEmail)

      let user = await db.users.findOne({ email: signerEmail.toLowerCase() });
      if (!user) {
        if (userEmail) {
          user = await db.users.findOne({ email: userEmail });
        }
        if (!user) {
          return res.status(400).end();
        }
      }
      if (dealId) {
        if (userEmail) {
          user = await db.users.findOne({ email: userEmail });
        }
        let investment = await db.investments.findOne({
          deal_id: ObjectId(dealId),
          user_id: ObjectId(user._id),
        })

        const deal = await db.deals.findOne({ _id: ObjectId(dealId) })
        if (investment === null) {
          investment = await db.investments.insertOne({
            user_id: ObjectId(user._id),
            deal_id: ObjectId(dealId),
            status: 'invited',
            created_at: Date.now(),
            invitied_at: Date.now(),
            oranization: deal.organization,
            amount: 0
          })
          investment._id = investment.insertedId
        }
        const pdf = get(docusignData, 'DocuSignEnvelopeInformation.DocumentPDFs.DocumentPDF.PDFBytes._text')
        const key = `investments/${investment._id}/${documentName}`
        const buf = Buffer.from(pdf, 'base64')


        const obj = {
          Bucket,
          Key: key,
          Body: buf,
          ContentEncoding: 'base64',
          ContentType: "application/pdf",
        }

        const s3Res = await s3.upload(obj).promise()

        investment = await db.investments.findOne({ _id: ObjectId(investment._id) })

        const newStatus = (investment.status === 'wired' || investment.status === 'complete') ? investment.status : 'signed'
        await db.investments.updateMany({
          deal_id: ObjectId(dealId),
          user_id: ObjectId(user._id)
        },
          {
            $set: { status: newStatus },
            $push: { documents: key }
          }
        );
        await sendConfirmation({ deal, to: user.email })
      }

      await db.users.findOneAndUpdate({ _id: ObjectId(user._id) }, { $push: { documents: { signedAt, signerDocusignId, envelopeId, documentName, documentId } } });

      return res.status(200).end();

    } catch (err) {
      console.log(err)
      next(err);
    }
  })
  .post('/verifyinvestor', async (req, res, next) => {
    try {
      const db = await connect();
      const userId = get(req, 'body.eapi_identifier')
      const status = get(req, 'body.status')
      const verifyInvestorId = get(req, 'body.investor_id')
      const requestId = get(req, 'body.verification_request_id')

      if (userId && status === 'accredited') {
        const cerficate = await fetch(`${process.env.VERIFY_INVESTOR_URL}/${requestId}/certificate`, {
          method: 'get',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${process.env.VERIFY_INVESTOR_API_TOKEN}` },
        })

        const expirationDate = moment(Date.now()).add(90, 'days').toDate();;

        const key = `investors/${userId}/accredidation_doc`

        const obj = {
          Bucket,
          Key: key,
          Body: cerficate.body,
          ContentType: "application/pdf"
        }
        await s3.upload(obj).promise()

        await db.users.findOneAndUpdate({ _id: ObjectId(userId) },
          {
            $push: { documents: { documentName: 'Verify Investor Certificate', status, expirationDate, verifyInvestorId, requestId } },
            $set: { accredidation_doc: key, accredidation_status: true },
          });

      }
      if (userId && status === 'not_accredited') {
        await db.users.findOneAndUpdate({ _id: ObjectId(userId) },
          {
            $set: { accredidation_status: false },
          });
      }

      return res.status(200).end();

    } catch (err) {
      console.log(err)
      next(err);
    }
  })
  .post('/slack', async (req, res, next) => {
    try {
      console.log(req.body)
      const { challenge } = req.body
      console.log('FIRESSSS', challenge)

      return res.status(200).json({ challenge });
    }
    catch (err) {
      console.log('SOME ERROR')
      console.log(err)
      next(err);
    }
  })