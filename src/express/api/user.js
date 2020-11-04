const { Router } = require('express');
const { get, pick } = require('lodash')
const { connect } = require('../../mongo/index')

const apiKeys = ['5fa2d72131ed7b7bc4666fe5']
module.exports = Router()
	.post('/:API_KEY', async (req, res, next) => {

		try {
			if (!apiKeys.includes(req.params.API_KEY)) {
				return res.status(400).send({
					status: 400,
					error: 'Invalid API key'
				})
			}
			const payload = pick(req.body, ['email', 'first_name', 'last_name', 'investor_type', 'entity_name'])

			if (!req.body.email) {
				return res.status(400).send({
					status: 400,
					error: 'Please provide an email address to create a user'
				})
			}
			const db = await connect();
			const user = await db.users.findOne({ email: req.body.email })
			if (user) {
				return res.status(400).send({
					status: 400,
					error: 'user already exists : { email: "test@test.com" }'
				})
			}
			const createdUser = await db.users.insertOne({ ...payload, created_at: Date.now() })
			createdUser.ops[0]

			return res.status(200).send(createdUser.ops[0])
		} catch (e) {
			throw new Error(e)
		}
	})
	.patch('/:API_KEY', async (req, res, next) => {
		try {
			if (!apiKeys.includes(req.params.API_KEY)) {
				return res.status(400).send({
					status: 400,
					error: 'Invalid API key'
				})
			}

			const payload = pick(req.body, ['email', 'first_name', 'last_name', 'investor_type', 'entity_name'])

			const db = await connect();

			const user = await db.users.findOne({ email: req.body.email })
			if (!user) {
				return res.status(404).send({
					status: 404,
					error: 'User matching the provided email not found'
				})
			}

			await db.users.updateOne({ email: req.body.email }, { $set: { ...payload } })
			const updatedUser = await db.users.findOne({ email: req.body.email })
			return res.status(200).send(updatedUser)
		}
		catch (e) {
			throw new Error(e)
		}
	})