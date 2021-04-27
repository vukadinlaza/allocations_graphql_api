// Find your API tokens here: https://app.docspring.com/api_tokens
require('dotenv').config();
const moment = require('moment')

const DocSpring = require('docspring');
const { capitalize, toNumber, omit } = require('lodash');
const { ObjectId } = require('mongodb');

var config = new DocSpring.Configuration()
config.apiTokenId = process.env.DOC_SPRING_API_ID
config.apiTokenSecret = process.env.DOC_SPRING_API_SECRET
docspring = new DocSpring.Client(config)

const getTemplate = ({ db, payload, user, templateId }) => {
	console.log('PAYLOAD', payload, parseFloat(payload.investmentAmount.replace(/,/g, '')))
	return docspring.getTemplate(templateId, function (error, template) {
		if (error) throw error
		const key = `investments/${payload.investmentId}/${template.name.replace(/\s+/g, "_")}.pdf`
		return generateDocSpringPDF({ db, user, input: payload, key, templateId, templateName: template.name.replace(/\s+/g, "_") }).then(() => {
			return db.investments.updateOne({ _id: ObjectId(payload.investmentId) }, {
				$set: { status: 'signed', amount: parseFloat(payload.investmentAmount.replace(/,/g, '')) },
				$addToSet: { documents: key }
			}).then(() => {
				const signingpacket = {
					userEmail: user.email,
					userId: user._id,
					authMethod: 'in-session',
					signedAt: new Date(),
					clientIp: payload.clientIp,
					investmentId: ObjectId(payload.investmentId),
					submissionData: {
						...payload, userEmail: user.email,
						userId: user._id,
					}
				}
				return db.signingpackets.insertOne({ ...signingpacket })
			})
		})

	})
}


const generateDocSpringPDF = ({ db, user, input, templateName, templateId }) => {
	let data = {
		subscriptiondocsOne: capitalize(input.investor_type),
		subscriptiondocsTwo: input.legalName,
		// Format with currency stuff
		investmentAmount: input.investmentAmount,
		subscriptiondocsThree: input.investor_type === 'individual' ? input.country + (input.country === 'United States' ? `, ${input.state}` : '') : '',
		subscriptiondocsFour: input.investor_type === 'entity' ? input.country + (input.country === 'United States' ? `, ${input.state}` : '') : '',
		subscriptiondocsFive: input.investor_type === 'individual' ? input.accredited_investor_status : '',
		subscriptiondocsSix: input.investor_type === 'individual' ? '' : input.accredited_investor_status,
		email: user.email,
		fullName: input.investor_type === 'individual' ? input.legalName : input.fullName,
		signature: input.investor_type === 'individual' ? input.legalName : input.fullName,
		memberName: input.legalName,
		date: moment(new Date()).format('MM/DD/YYYY')
	}

	if (templateId === 'tpl_ctrRDXgQdKz5YGg9QK') {
		data = {
			signature: input.investor_type === 'individual' ? input.legalName : input.fullName,
		}
	}
	var submission_data = {
		editable: false,
		data: data,
		metadata: {
			user_id: user._id,
			investmentId: input.investmentId,
			templateName: templateName
		},
		field_overrides: {
			// title: {
			// 	required: false,
			// },
		},
	}
	const res = docspring.generatePDF(templateId, submission_data, function (
		error,
		response
	) {
		if (error) {
			console.log(response, error)
			throw error
		}
		var submission = response.submission

		db.investments.updateOne({ _id: ObjectId(input.investmentId) }, {
			$set: { 'submissionData.submissionId': submission.id },
		})
		return submission
	})
	return Promise.resolve(res)
}

const createTaxDocument = ({ payload, user, db }) => {
	const sig = payload.kycTemplateName === 'W-9' ? payload.name_as_shown_on_your_income_tax_return_name_is_required_on_this_line_do_not_leave_this_line_blank : payload.signature
	const data = omit({ ...payload, signature: sig }, ['kycTemplateId', 'kycTemplateName', 'tax_classification', 'isDemo']);
	console.log('DATA')
	var submission_data = {
		editable: false,
		data: data,
		metadata: {
			user_id: user._id,
			templateName: payload.kycTemplateName
		},
		field_overrides: {
		},
		test: process.env.NODE_ENV === 'production' ? false : true,
		wait: true,
	}
	const res = new Promise((resolve, reject) => {
		docspring.generatePDF(payload.kycTemplateId, submission_data, function (
			error,
			response
		) {
			if (error) {
				console.log(error)
				// throw error
			}
			var submission = response.submission
			console.log('submission', submission)
			const docObj = { documentName: payload.kycTemplateName, submissionId: submission.id, docspringPermDownloadLink: submission.permanent_download_url }
			db.users.updateOne({ _id: ObjectId(user._id) }, {
				$push: { documents: docObj },
			})
			return resolve(submission)
		})
	})
	return Promise.resolve(res)
}

const getInvestmentPreview = ({ input, user }) => {
	let data = {
		subscriptiondocsOne: capitalize(input.investor_type),
		subscriptiondocsTwo: input.legalName,
		// Format with currency stuff
		investmentAmount: input.investmentAmount,
		subscriptiondocsThree: input.investor_type === 'individual' ? input.country + (input.country === 'United States' ? `, ${input.state}` : '') : '',
		subscriptiondocsFour: input.investor_type === 'entity' ? input.country + (input.country === 'United States' ? `, ${input.state}` : '') : '',
		subscriptiondocsFive: input.investor_type === 'individual' ? input.accredited_investor_status : '',
		subscriptiondocsSix: input.investor_type === 'individual' ? '' : input.accredited_investor_status,
		email: user.email,
		fullName: input.investor_type === 'individual' ? input.legalName : input.fullName,
		signature: input.investor_type === 'individual' ? input.legalName : input.fullName,
		memberName: input.legalName,
		date: moment(new Date()).format('MM/DD/YYYY')
	};
	var submission_data = {
		editable: false,
		data: data,
		metadata: {
			preview: true
		},
		field_overrides: {
		},
		test: process.env.NODE_ENV === 'production' ? false : true,
		wait: true,
	}
	const res = new Promise((resolve, reject) => {
		docspring.generatePDF(input.docSpringTemplateId, submission_data, function (
			error,
			response
		) {
			if (error) {
				console.log(error)
				// throw error
			}
			var submission = response.submission
			return resolve(submission)
		})
	})
	return Promise.resolve(res)
}




module.exports = { generateDocSpringPDF, getTemplate, createTaxDocument, getInvestmentPreview }
