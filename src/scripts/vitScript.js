require('dotenv').config();
const { connect } = require('../mongo');
const { ObjectId } = require('mongodb')

const { map, find, reduce, flatten, groupBy, isNumber, toNumber, startCase, toLower } = require('lodash');
const { data } = require('./vit');
const { descriptions } = require('./desciptions')
const deals = [
	"IrishAngels Member Database = Adapted for Allocations - Member",
	"FIELD2 - Last",
	"FIELD3 - First",
	"FIELD4 - Lookup Name",
	"FIELD5 - Member Type",
	"FIELD6 - Investing As",
	"FIELD7 - E-mail",
	"FIELD8 - Address",
	"FIELD9 - City",
	"FIELD10 - State",
	"FIELD11 - Zip",
	"FIELD12 - Country",
	"2013 - Techstars Chicago",
	"2013 - rivs",
	"2015 - rivs (Follow on)",
	"2013 - Row One",
	"2013 - 1debit (Chime)",
	"2014 - Eyelation",
	"2014 - Tradingview",
	"2013 - Vapogenix",
	"2014 - Rentlytics",
	"2014 - Vennli",
	"2016 - Vennli (Follow on)",
	"2014 - UpCity",
	"2014 - Rivet Radio",
	"2014 - Coolfire Solutions",
	"2015 - Neoantigenics",
	"2015 - Page Vault",
	"2016 - Page Vault (Follow on)",
	"2015 - CargoSense",
	"2016 - CargoSense (Follow on)",
	"2015 - LHM",
	"2015 - Appcast",
	"2015 - Akouba Credit",
	"2016 - NanDio",
	"2016 - Blue Triangle Tech",
	"2016 - Vagabond Vending",
	"2016 - ShotTracker",
	"2016 - Emu",
	"2016 - Catalyst",
	"2016 - Superstar",
	"2016 - Blue Triangles Tech (Follow on)",
	"2016 - RIVS (Follow on 2)",
	"2016 - Coolfire (Follow On)",
	"2017 - Eat Pak'd",
	"2017 - Kidizen",
	"2017 - ZipFit",
	"2017 - GroupSense",
	"2017 - Micro-LAM",
	"2017 - Superstar Games (Follow on)",
	"2017 - Emu (Follow-on)",
	"2017 - TechStars Follow-on",
	"2017 - ShotTracker (Follow-on)",
	"2017 - Sightbox",
	"2017 - Vagabond Vending (Follow-on)",
	"2017 - BTT (Second Follow-on)",
	"2017 - Babyscripts",
	"2017 - Appcast (Follow-on)",
	"2017 - Eat Pakd (Follow-on)",
	"2017 - Catalyst Ortho (Follow-on)",
	"2017 - Ash & Erie",
	"2017 - Wolf & Shepherd",
	"2018 - AgenDx / NanDio (Follow-on)",
	"2018 - MarginEdge",
	"2018 - ZipFit \n(Follow-on)",
	"2018 - ShotTracker (Follow-on #2)",
	"2018 - Elevate K-12",
	"2018 - myCOI",
	"2018 - Caretaker Medical",
	"2018 - The Mom Project",
	"2018 - Coolfire (Follow-on #2)",
	"2018 - Vagabond Vending (Follow-on #2)",
	"2018 - The Renewal Workshop",
	"2018 - PageVault (Follow-on #2)",
	"2018 - Emu (Follow-on #2)",
	"2018 - Pattern89",
	"2018 - Genomenon",
	"2018 - Nurture Life",
	"2018 - BTT (Third Follow-on)",
	"2018 - The Mom Project (Follow-on)",
	"2018 - MarginEdge (Follow-on)",
	"2019 - Ash & Erie (Follow-on)",
	"2019 - Retrium",
	"2019 - AbiliTech",
	"2019 - Elevate K-12 (Follow on)",
	"2019 - Revive",
	"2019 - Wolf & Shepherd (Follow on)",
	"2019 - SimplifyASC",
	"2019 - Gatsby",
	"2019 - Infinite Composites Technologies",
	"2019 - Conservation Labs",
	"2019 - Carpe",
	"2019 - MarginEdge (Follow-on 2)",
	"2019 - Enklu",
	"2019 - Hallow",
	"2019 - Snooz",
	"2019 - Popwallet",
	"2019 - Blue Triangle Technologies (Follow-on 4)",
	"2019 - Micro-LAM (Follow-on)",
	"2019 - GroupSense (Follow-on)",
	"2020 - AllVoices",
	"2020 - Interior Define",
	"2020 - CareTaker (Follow-on)",
	"2020 - Revive\n(Follow-on)",
	"2020 - BasePaws",
	"2020 - Alembic",
	"2020 - Soona",
	"2020 - Fanbank (FB)",
	"2020 - ClearFlame",
	"2020 - Ayoba-Yo",
	"2020 - The Mom Project (Follow-on 2)",
	"2020 - Genomenon (Follow-on)",
	"2020 - Pattern89 (Follow-on)",
	"2020 - Wolf & Shepherd (Follow-on 2)",
	"2020 - Psyonic",
	"2020 - Zero Grocery",
	"2020 - Malomo",
	"2020 - Conservation Labs (Follow-on)",
	"2020 - Elevate K-12 (Follow-on 2)",
	"2020 - Fulcrum",
	"2020 - Enklu Common (secondary)",
	"2020 - Thousand Fell",
	"2020 - MarginEdge (Follow-on 3)",
	"2020 - Enklu (Follow-on)",
	"FIELD125 - To add deal, insert column between this & previous column",
	"FIELD126 - Total",
	"FIELD127 - Number",
	"FIELD128 - ",
	"FIELD129 - 2013 Payment Date",
	"FIELD130 - 2013 Dues Amount Paid",
	"FIELD131 - ",
	"FIELD132 - 2014 Dues Date of QB Deposit",
	"FIELD133 - 2014 Dues Check#",
	"FIELD134 - 2014 Dues Amt Paid",
	"FIELD135 - QB Pmt Cnfm Sent?",
	"FIELD136 - ",
	"FIELD137 - 2015 Date of Deposit",
	"FIELD138 - 2015 Dues Check#",
	"FIELD139 - 2015 Dues Amt Paid",
	"FIELD140 - QB Pmt Cnfm Sent?",
	"FIELD141 - ",
	"FIELD142 - 2016 Date of Deposit",
	"FIELD143 - 2016 Dues Check#",
	"FIELD144 - 2016 Dues Amt Paid",
	"FIELD145 - QB Pmt Cnfm Sent?",
	"FIELD146 - ",
	"FIELD147 - 2017 Date of Deposit",
	"FIELD148 - 2017 Dues Check#",
	"FIELD149 - 2017 Dues Amt Paid",
	"FIELD150 - QB Pmt Cnfm Sent?",
	"FIELD151 - ",
	"FIELD152 - 2018 Date of Deposit",
	"FIELD153 - 2018 Dues Check#",
	"FIELD154 - 2018 Dues Amt Paid",
	"FIELD155 - QB Pmt Cnfm Sent?",
	"FIELD156 - ",
	"FIELD157 - ",
	"FIELD158 - ",
	"FIELD159 - ",
	"FIELD160 - ",
	"FIELD161 - ",
	"FIELD162 - ",
	"FIELD163 - ",
	"FIELD164 - "
];
const { xx } = require('./deals');
(async function seedVitData() {
	try {
		console.log('\n=== Script started ===\n');
		const db = await connect()
		// const orgToDeal = await db.organizations.findOne({ name: 'Vitalize' })
		// await db.organizations.deleteMany({
		// 	name: 'Vitalize'
		// })
		// await db.users.deleteMany({ source: 'vitalize' })
		// await db.deals.deleteMany({ organization: orgToDeal._id })
		// await db.investments.deleteMany({ organization: orgToDeal._id })



		const createdOrg = await db.organizations.insertOne({
			name: 'Vitalize',
			slug: 'vitalize',
			approved: true,
			created_at: Date.now()
		})
		const org = createdOrg.ops[0]
		console.log('org', org)
		let count = 0
		const mappedDeals = map((deals), deal => {
			const name = deal.split(' - ')[1]
			const info = descriptions.find(d => d.Company.toLowerCase().includes(name.split(' ')[0].toLowerCase())) || {}
			count = count + 1
			return {
				index: count - 1,
				deal: deal.split(' - ')[1],
				memo: startCase(toLower(info['One-Liner'] || '')),
				description: startCase(toLower(info['Truncated'] || ''))
			}
		})
		function slugify(str) {
			return str.toLowerCase().replace(' ', '-')
		}
		const createdDeals = await Promise.all(mappedDeals.map(async deal => {
			if (deal.index <= 11) return null
			if (deal.index >= 124) return null
			if (!deal.deal) return null
			const res = await db.deals.insertOne({
				organization: org._id,
				company_name: deal.deal,
				slug: slugify(deal.deal),
				company_description: deal.description,
				memo: deal.memo,
				status: 'closed',
				dealParams: {
					wireDeadline: '01/01/2020'
				}
			})
			const createdDeal = res.ops[0]
			return createdDeal
		}))
		console.log('created DEALs', createdDeals.filter(d => d !== null).length)
		function uuid() {
			return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
		}
		const users = map(data, (obj, i) => {
			return {
				last_name: obj['FIELD2'],
				first_name: obj['FIELD3'],
				fullName: obj['FIELD4'],
				investingAs: obj['FIELD6'] === '' ? obj['FIELD7'] === '' ? ['FIELD3'] : obj['FIELD7'] : obj['FIELD6'],
				investor_type: '',
				email: obj['FIELD7'] || `${uuid()}support@allocations.com`,
				street: obj['FIELD8'] + ', ' + obj['FIELD9'],
				state: obj['FIELD10'],
				zip: obj['FIELD11'],
				country: obj['FIELD12'],
				source: 'vitalize'
			}
		}).filter(u => u.email !== 'E-mail')


		const createdUsers = await Promise.all(users.map(async user => {
			if (!user.email) return null
			const u = await db.users.insertOne({ ...user })
			return u.ops[0]
		}))
		console.log('created Users', createdUsers.filter(u => u !== null).length)

		const investments = xx.map((dealData) => {
			const email = dealData[6].split('_______')[1]
			const investments = dealData.map((field, index) => {
				const dealName = mappedDeals.find(d => d.index === index)
				return {
					dealName: dealName.deal,
					email,
					amount: field.split('_______')[1]
				}
			})
			return investments
		})
		const flatInv = flatten(investments).filter(inv => inv.email && inv.amount).map(inv => ({ ...inv, amount: toNumber(inv.amount.replace(/,/g, '')) })).filter(inv => isNumber(inv.amount) && !isNaN(inv.amount) && inv.amount > 0)
		const groupedInvs = groupBy(flatInv, 'dealName')
		const createdInvs = await Promise.all(map(groupedInvs, async investments => {
			const invDeal = await db.deals.findOne({ company_name: investments[0].dealName })
			if (invDeal === null) return [];
			const invs = await Promise.all(investments.map(async inv => {
				const invUser = await db.users.findOne({ email: inv.email })
				const createdInv = await db.investments.insertOne({ amount: inv.amount, user_id: invUser._id, deal_id: invDeal._id, organization: org._id, status: 'complete' })
				return createdInv.ops[0]
			}))
			return invs
		}))
		console.log('createdInvs', flatten(createdInvs).length)

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