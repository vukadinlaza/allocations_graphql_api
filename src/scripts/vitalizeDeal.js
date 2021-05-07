require('dotenv').config();

const { map, find, reduce, groupBy, flatten, flattenDeep } = require('lodash');
const { connect } = require('../mongo');
const { ObjectId } = require('mongodb');

(async function closeDeals() {
	try {
		console.log('\n=== Script started ===\n');
		const db = await connect()


		const orgSlugs = ['irishangels', 'vitalize']

		const deals = await Promise.all(orgSlugs.map(async org => {
			const o = await db.organizations.findOne({ slug: org })
			console.log(o)
			if (org === null) {
				return
			}
			const deals = await db.deals.find({ organization: ObjectId(o._id) }).toArray()
			console.log(deals)
			return deals
		}))

		console.log(flattenDeep(deals).length)


		console.log(JSON.stringify(flattenDeep(deals)))
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