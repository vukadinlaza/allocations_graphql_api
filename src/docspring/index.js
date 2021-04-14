// Find your API tokens here: https://app.docspring.com/api_tokens
require('dotenv').config();
const moment = require('moment')

const DocSpring = require('docspring');
const { capitalize, toNumber } = require('lodash');
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
		return generateDocSpringPDF({ user, input: payload, key, templateId, templateName: template.name.replace(/\s+/g, "_") }).then(() => {
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


const generateDocSpringPDF = ({ user, input, templateName, templateId }) => {
	console.log('INPUT', input)
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
		wait: true,
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
		console.log('Download your PDF at:', submission.download_url)
		return submission
	})
	return Promise.resolve(res)
}


module.exports = { generateDocSpringPDF, getTemplate }
