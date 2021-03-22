require('dotenv').config();

const { map, find, reduce, toNumber } = require('lodash');
const { connect } = require('./src/mongo');
const { ObjectId } = require('mongodb');


(async function closeDeals() {
	try {
		console.log('\n=== Script started ===\n');
		const db = await connect()
		// Find Deal 
		// const deal = await db.deals.findOne({ company_name: 'Poppy' });

		// // Delete invited investments
		// const deletedInvestments = await db.investments.deleteMany({ deal_id: ObjectId(deal._id), amount: NaN })

		// // Move wired investments to complete
		// const moveInvestmentsToComplete = await db.investments.updateMany({ deal_id: ObjectId(deal._id), status: 'wired' }, {
		// 	$set: { status: 'complete' }
		// })



		// await db.users.deleteMany({ _id: ObjectId("5fbd76bbb0b6789b81743c16") })
		const res = await db.investments.updateMany({ user_id: ObjectId("5fbd8c9f45c930002351968f") }, { $set: { status: 'complete' } })


		console.log(res)



		// const createdInvestments = []
		// const failed = []

		// const x = await Promise.all(investments.map(async inv => {
		// 	const user = await db.users.findOne({ email: inv.email })
		// 	if (user === null) {
		// 		pushed.push(inv)
		// 		return
		// 	}
		// 	return db.investments.insertOne({
		// 		deal_id: ObjectId(deal._id),
		// 		user_id: ObjectId(user._id),
		// 		organization: ObjectId(deal.organization),
		// 		amount: Number(inv.amount),
		// 		invited_at: Date.now(),
		// 		created_at: Date.now(),
		// 		status: 'wired'
		// 	})

		// }))

		// console.log(failed)



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