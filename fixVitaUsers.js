require('dotenv').config();

const { map, find, reduce } = require('lodash');
const { connect } = require('./src/mongo');
const users = require('./vitNewUsers.js');
const { ObjectId } = require('mongodb');
// New Org ID
const newOrgId = ObjectId("5f3acaabbe98920023f9dfd3");
const prodNewOrgId = ObjectId("5f903e7164eb9a0023189ca2");
// Old Org ID
const oldOrgId = ObjectId("5fbd721108842798407e6fe4");
const prodOldOrgId = ObjectId("5fbd76bab0b6789b81743b3d");

(async function closeDeals() {
	try {
		console.log('\n=== Script started ===\n');
		const db = await connect()
		const deals = await db.deals.updateMany({ organization: prodOldOrgId }, {
			$set: { organization: prodNewOrgId }
		});
		const investments = await db.investments.updateMany({ organization: prodOldOrgId }, { $set: { organization: prodNewOrgId } });


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