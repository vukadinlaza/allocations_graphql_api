require('dotenv').config();

const { map, find, reduce, groupBy } = require('lodash');
const { connect } = require('../mongo');
const { ObjectId } = require('mongodb');

(async function closeDeals() {
	try {
		console.log('\n=== Script started ===\n');
		const db = await connect()
		const investments = await db.investments.find({}).toArray()

		const invsByUsers = groupBy(investments, 'user_id')
		const x = await Promise.all(map(invsByUsers, async (user, key, collection) => {
			const total = user.reduce((acc, item) => {

				return acc + Number(item.amount || 0) || 0
			}, 0)
			const u = await db.users.findOne({ _id: ObjectId(key) }) || {}

			const d = await Promise.all(user.map(async inv => {
				const deal = await db.deals.findOne({ _id: ObjectId(inv.deal_id) }) || {}
				return deal.company_name || 'no company name'
			}))
			const deals = [...new Set(d)]

			return {
				userid: key,
				totalInvested: total,
				email: u.email || 'no email',
				deals: deals.join(', ')

			}
		}))

		console.log(JSON.stringify(x))
		console.log(`\n=== Success! Updating Investment Status===\n`);
		process.exit(0);
	} catch (err) {
		console.log(
			`\n=== ERROR! Updating Investment Status \n`,
			err
		);
		process.exit(1);
	}
})();