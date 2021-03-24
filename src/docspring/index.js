// Find your API tokens here: https://app.docspring.com/api_tokens
require('dotenv').config();
const moment = require('moment')

const DocSpring = require('docspring');
const { capitalize } = require('lodash');

var config = new DocSpring.Configuration()
config.apiTokenId = process.env.DOC_SPRING_API_ID
config.apiTokenSecret = process.env.DOC_SPRING_API_SECRET
docspring = new DocSpring.Client(config)




const generateDocSpringPDF = async ({ user, input }) => {
	let link = null
	var template_id = 'tpl_3nKjygaFgz44KyCANJ'


	const data = {
		subscriptiondocsOne: capitalize(input.investor_type),
		subscriptiondocsTwo: capitalize(input.legalName),
		investmentAmount: input.investmentAmount,
		subscriptiondocsThree: input.country + ', ' + (input.state || ''),
		subscriptiondocsFour: input.country,
		subscriptiondocsFive: input.investor_type === 'individual' ? input.accredited_investor_status : '',
		subscriptiondocsSix: input.investor_type !== 'individual' ? input.accredited_investor_status : '',
		email: user.email,
		fullName: input.fullName,
		signature: input.fullName,
		memberName: input.fullName,
		date: moment(new Date()).format('MM/DD/YYYY')
	}
	var submission_data = {
		editable: false,
		data: data,
		metadata: {
			user_id: user._id,
			investment: input.investmentId,
		},
		field_overrides: {
			// title: {
			// 	required: false,
			// },
		},
		wait: true,
	}
	const submission = await docspring.generatePDF(template_id, submission_data, function (
		error,
		response
	) {
		if (error) {
			console.log(response, error)
			throw error
		}
		var submission = response.submission
		console.log('Download your PDF at:', submission.download_url)
		return submission
	})
	return submission
}


const updateInvestmentWithPDF = async ({ data, db, key = 'no key yet' }) => {
	await db.updateOne({ _id: data.investmentId }, {
		$set: { status: 'signed' },
		$addToSet: { documents: key }
	})
}

module.exports = { generateDocSpringPDF, updateInvestmentWithPDF }
