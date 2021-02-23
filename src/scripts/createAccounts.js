require('dotenv').config();

const { map, find, reduce, pick } = require('lodash');
const { connect } = require('../mongo');
const { ObjectId } = require('mongodb');

(async function closeDeals() {
	try {
		console.log('\n=== Script started ===\n');
		const db = await connect()
		const users = await db.users.find().toArray();
		await Promise.all(users.map(async u => {
			console.log(u)
			// Create an account for EACH USER
			const res = await db.accounts.insertOne({ rootAdmin: ObjectId(u._id) })
			const createdAcct = res.ops[0]

			// Create the primary entity for the USER
			const options = ['investor_type', 'country', 'state', 'first_name', 'last_name', 'entity_name', 'signer_full_name', 'accredited_investor_status', 'email', 'accountId']
			const data = pick(u, options)
			const createdRootEntity = await db.entities.insertOne({ ...data, isPrimaryEntity: true, accountId: ObjectId(createdAcct._id), user: ObjectId(u._id) })

			// Add the Account ID to the USER
			return db.users.updateOne({ _id: u._id }, { $set: { account: ObjectId(createdAcct._id) } })
		}))

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