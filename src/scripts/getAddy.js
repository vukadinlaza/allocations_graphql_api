require('dotenv').config();

const { map, find, reduce } = require('lodash');
const { connect } = require('../mongo');
const { users } = require('../../data.js');

(async function closeDeals() {
	try {
		console.log('\n=== Script started ===\n');
		const db = await connect()
		const updatedUsers = await Promise.all(users.map(async u => {
			const user = await db.users.findOne({ email: u.email })
			if (user === null) {
				return u
			}
			const investments = await db.investments.find({ user_id: user._id }).toArray()
			const invs = investments.filter(inv => inv.deal_id)
			const deals = await Promise.all(invs.map(i => {
				return db.deals.findOne({ _id: i.deal_id })
			}))
			const dealNames = deals.map(d => d.company_name).join(', ')
			return {
				...u,
				dealNames: dealNames,
				street_address: user.street_address || 'na',
				city: user.city || 'na',
				state: user.state || 'na',
				zip: user.zip || 'na',
				mail_country: user.mail_country || 'na',
				mail_city: user.mail_city || 'na',
				mail_zip: user.mail_zip || 'na',
				mail_state: user.mail_state || 'na',
				mail_street_address: user.mail_street_address || 'na'
			}

		}))
		console.log(JSON.stringify(updatedUsers))
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