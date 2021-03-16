const { Router } = require('express');
const { get, pick } = require('lodash')
const { connect } = require('../../mongo/index')

const apiKeys = [{ key: '12345' }]

module.exports = Router()
	.post('/', async (req, res, next) => {
		try {
			const { dealSlug, organizationSlug = 'allocations', API_KEY } = req.body;

			const key = apiKeys.find(k => k.key === API_KEY)
			if (!key) {
				return res.send({
					status: 400,
					error: 'Invalid API key'
				})
			}

			const db = await connect();
			const organization = await db.organizations.findOne({ slug: organizationSlug })

			if(organization !== null && organization._id) {
				console.log('in if sending deal')
				const deal = await db.deals.findOne({ slug: dealSlug, organization: organization._id })
				console.log('deal', deal)

				return res.send(deal)
			} else {
				console.log('in else??? sending 200')
				return res.sendStatus(200)
			}
		} catch (e) {
			throw new Error(e)
		}
	})
