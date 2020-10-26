require('dotenv').config();

const { map, find, reduce } = require('lodash');
const { connect } = require('../mongo');

(async function closeDeals() {
	try {
		console.log('\n=== Script started ===\n');
		const db = await connect()
		const closedDeals = await db.deals.find({ status: 'closed' }).toArray()
		const updatedInvestments = await Promise.all(closedDeals.map(deal => {
			return db.investments.updateMany({ deal_id: deal._id }, { $set: { status: 'complete' } })

		}))
		console.log(updatedInvestments)
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