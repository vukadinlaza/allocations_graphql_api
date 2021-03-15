const { Router } = require('express');
const { get, pick } = require('lodash')
const { connect } = require('../../mongo/index')

const apiKeys = [{ key: '12345' }]

module.exports = Router()
	.post('/', async (req, res, next) => {
		try {
			const { dealSlug, organizationSlug, API_KEY } = req.body;

			const key = apiKeys.find(k => k.key === API_KEY)
			if (!key) {
				return res.status(400).send({
					status: 400,
					error: 'Invalid API key'
				})
			}

			const db = await connect();

			const organization = await db.organizations.findOne({ slug: organizationSlug })
			const deal = await db.deals.findOne({ slug: dealSlug, organization: organization._id })

			return res.status(200).send(deal)

		} catch (e) {
			throw new Error(e)
		}
	})
