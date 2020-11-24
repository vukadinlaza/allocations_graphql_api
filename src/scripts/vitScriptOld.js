require('dotenv').config();
const { connect } = require('../mongo');

const { map, find, reduce, flatten, groupBy, isNumber, toNumber } = require('lodash');
const { oldData } = require('./old.js');
const { oldMain } = require('./oldMain.js');
const deals = [

	"FIELD1___Member",
	"FIELD2___Last",
	"FIELD3___First",
	"FIELD4___Lookup Name",
	"FIELD5___Member Type",
	"FIELD6___Investing As",
	"FIELD7___E-mail",
	"FIELD8___Phone",
	"2013___Techstars Chicago",
	"2013___rivs",
	"2015___rivs (Follow on)",
	"2013___Row One",
	"2013___1debit (Chime)",
	"2014___Eyelation",
	"2014___Tradingview",
	"2013___Vapogenix",
	"2014___Rentlytics",
	"2014___Vennli",
	"2016___Vennli (Follow on)",
	"2014___UpCity",
	"2014___Rivet Radio",
	"2014___Coolfire Solutions",
	"2015___Neoantigenics",
	"2015___Page Vault",
	"2016___Page Vault (Follow on)",
	"2015___CargoSense",
	"2016___CargoSense (Follow on)",
	"2015___LHM",
	"2015___Appcast",
	"2015___Akouba Credit",
	"2016___NanDio",
	"2016___Blue Triangle Tech",
	"2016___Vagabond Vending",
	"2016___ShotTracker",
	"2016___Emu",
	"2016___Catalyst",
	"2016___Superstar",
	"2016___Blue Triangles Tech (Follow on)",
	"2016___RIVS (Follow on 2)",
	"2016___Coolfire (Follow On)",
	"2017___Eat Pak'd",
	"2017___Kidizen",
	"2017___ZipFit",
	"2017___GroupSense",
	"2017___Micro-LAM",
	"2017___Superstar Games (Follow on)",
	"2017___Emu (Follow-on)",
	"2017___TechStars Follow-on",
	"2017___ShotTracker (Follow-on)",
	"2017___Sightbox",
	"2017___Vagabond Vending (Follow-on)",
	"2017___BTT (Second Follow-on)",
	"2017___Babyscripts",
	"2017___Appcast (Follow-on)",
	"2017___Eat Pakd (Follow-on)",
	"2017___Catalyst Ortho (Follow-on)",
	"2017___Ash & Erie",
	"2017___Wolf & Shepherd",
	"2018___AgenDx / NanDio (Follow-on)",
	"2018___MarginEdge",
	"2018___ZipFit \n(Follow-on)",
	"2018___ShotTracker (Follow-on #2)",
	"2018___Elevate K-12",
	"2018___myCOI",
	"2018___Caretaker Medical",
	"2018___The Mom Project",
	"2018___Coolfire (Follow-on #2)",
	"2018___Vagabond Vending (Follow-on #2)",
	"2018___The Renewal Workshop",
	"2018___PageVault (Follow-on #2)",
	"2018___Emu (Follow-on #2)",
	"2018___Pattern89",
	"2018___Genomenon",
	"2018___Nurture Life",
	"2018___BTT (Third Follow-on)",
	"2018___The Mom Project (Follow-on)",
	"2018___MarginEdge (Follow-on)",
	"2019___Ash & Erie (Follow-on)",
	"2019___Retrium",
	"2019___AbiliTech",
	"2019___Elevate K-12",
	"2019___Revive",
	"2019___Wolf & Shepherd",
	"2019___SimplifyASC",
	"2019___Gatsby",
	"2019___Infinite Composites Technologies",
	"2019___Conservation Labs",
	"2019___Carpe",
	"2019___MarginEdge (Follow-on 2)",
	"2019___Enklu",
	"2019___Hallow",
	"2019___Snooz",
	"2019___Popwallet",
	"2019___Blue Triangle Technologies (Follow-on 4)",
	"2019___Micro-LAM (Follow-on)",
	"2019___GroupSense (Follow-on)",
	"2020___AllVoices",
	"2020___Interior Define",
	"2020___CareTaker (Follow-on)",
	"2020___Revive\n(Follow-on)",
	"2020___BasePaws",
	"2020___Alembic",
	"2020___Soona",
	"2020___Fanbank (FB)",
	"2020___ClearFlame",
	"2020___Ayoba-Yo",
	"2020___The Mom Project (Follow-on)",
	"2020___Genomenon (Follow-on)",
	"2020___Pattern89 (Follow-on)",
	"2020___Wolf & Shepherd (Follow-on)",
	"2020___Psyonic",
	"2020___Zero Grocery",
	"2020___Malomo",
	"2020___Conservation Labs (Follow-on)",
	"2020___Elevate K-12 (Follow-on)",
	"2020___Fulcrum",
	"2020___Enklu Common (secondary)",
	"2020___Thousand Fell",
	"2020___MarginEdge (Follow-on)",
	"2020___Enklu (Follow-on)",
	"FIELD121___To add deal, insert column between this & previous column",
	"FIELD122___Total",
	"FIELD123___Number",
	"FIELD124___Quarter Resigned",
	"FIELD125___reason",
	"FIELD126___Removed from Gust?",
	"FIELD127___Date Removed from Gust",
	"FIELD128___Notes"

];
(async function seedVitData() {
	try {
		console.log('\n=== Script started ===\n');
		const db = await connect()
		const orgToDeal = await db.organizations.findOne({ name: 'Vitalize' })
		let count = 0
		const mappedDeals = map((deals), deal => {
			count = count + 1
			return {
				index: count - 1,
				deal: deal.split('___')[1]
			}
		})
		function uuid() {
			return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
		}

		const users = map(oldMain, (obj, i) => {
			return {
				last_name: obj['FIELD3'],
				first_name: obj['FIELD2'],
				fullName: obj['FIELD1'],
				investingAs: obj['FIELD6'],
				investor_type: '',
				email: obj['FIELD7'],
				source: 'vitalize'
			}
		}).filter(u => u.email !== 'E-mail')

		const uniq = users.filter((v, i, a) => a.findIndex(t => (t.email === v.email)) === i)
		const createdUsers = await Promise.all(uniq.map(async user => {
			if (!user.email.includes('@')) return false
			const aU = await db.users.findOne({ email: user.email });
			if (aU !== null) return false;
			const u = await db.users.insertOne({ ...user })
			return u.ops[0]
		}))
		console.log('created Users', createdUsers.filter(u => u.email).length)

		const investments = oldData.map((dealData) => {
			const email = dealData[6].split('____')[1]
			const investments = dealData.map((field, index) => {
				const dealName = mappedDeals.find(d => d.index === index)
				return {
					dealName: dealName.deal,
					email,
					amount: field.split('____')[1]
				}
			})
			return investments
		});

		const flatInv = flatten(investments).filter(inv => inv.email && inv.amount).map(inv => ({ ...inv, amount: toNumber(inv.amount.replace(/,/g, '')) })).filter(inv => isNumber(inv.amount) && !isNaN(inv.amount) && inv.amount > 0)
		const groupedInvs = groupBy(flatInv, 'dealName')
		const createdInvs = await Promise.all(map(groupedInvs, async investments => {
			const invDeal = await db.deals.findOne({ company_name: investments[0].dealName })
			if (invDeal === null) return [];
			const invs = await Promise.all(investments.map(async inv => {
				const invUser = await db.users.findOne({ email: inv.email })
				if (!invUser) return false
				const createdInv = await db.investments.insertOne({ amount: inv.amount, user_id: invUser._id, deal_id: invDeal._id, organization: orgToDeal._id, status: 'complete' })
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