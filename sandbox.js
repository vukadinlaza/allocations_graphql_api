require('dotenv').config();

const { map, find, reduce, toNumber, groupBy } = require('lodash');
const { connect } = require('./src/mongo');
const { ObjectId } = require('mongodb');


(async function closeDeals() {
	try {
		console.log('\n=== Script started ===\n');
		const db = await connect()

		const investments = await db.investments.find({}).toArray()
		const filteredInvs = investments.filter(inv => {
			return (inv.documents || []).join('').toLowerCase().includes('mulherin')
		})

		console.log(groupBy(filteredInvs, 'user_id'))

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