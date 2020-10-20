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