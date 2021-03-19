require('dotenv').config();

const { map, find, reduce, toNumber } = require('lodash');
const { connect } = require('./src/mongo');
const { ObjectId } = require('mongodb');

const investments = [
	{
		"email": "danielfallon8@gmail.com",
		"amount": "5,000"
	},
	{
		"email": "prdaveo@yahoo.com",
		"amount": "5,000"
	},
	{
		"email": "drpowers22@hotmail.com",
		"amount": "5,000"
	},
	{
		"email": "gajablo@gmail.com",
		"amount": "5,000"
	},
	{
		"email": "hmacnaug@gmail.com",
		"amount": "5,000"
	},
	{
		"email": "jonpeck10@gmail.com",
		"amount": "5,000"
	},
	{
		"email": "lawler801@aol.com",
		"amount": "5,000"
	},
	{
		"email": "shoey@alumni.nd.edu",
		"amount": "5,000"
	},
	{
		"email": "jstahl@stahlcowen.com",
		"amount": "7,500"
	},
	{
		"email": "timmcdermott213@gmail.com",
		"amount": "7,500"
	},
	{
		"email": "gpscanlon@yahoo.com",
		"amount": "10,000"
	},
	{
		"email": "jwolohan@wolohanff.com",
		"amount": "10,000"
	},
	{
		"email": "mforester@crosscheckcompliance.com",
		"amount": "10,000"
	},
	{
		"email": "michaeljwolohan@gmail.com",
		"amount": "10,000"
	},
	{
		"email": "rgstepien@gmail.com",
		"amount": "10,000"
	},
	{
		"email": "tbrennan@pinnaclefinancial.net",
		"amount": "10,000"
	},
	{
		"email": "brianbhegarty@gmail.com",
		"amount": "15,000"
	},
	{
		"email": "bunkercurnes@gmail.com",
		"amount": "50,000"
	},
	{
		"email": "jordancurnes@gmail.com",
		"amount": "50,000"
	}
];

(async function closeDeals() {
	try {
		console.log('\n=== Script started ===\n');
		const db = await connect()
		// Find Deal 
		const deal = await db.deals.findOne({ company_name: 'Poppy' });

		// // Delete invited investments
		const deletedInvestments = await db.investments.deleteMany({ deal_id: ObjectId(deal._id), amount: NaN })

		// // Move wired investments to complete
		// const moveInvestmentsToComplete = await db.investments.updateMany({ deal_id: ObjectId(deal._id), status: 'wired' }, {
		// 	$set: { status: 'complete' }
		// })

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