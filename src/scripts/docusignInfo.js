const fetch = require('node-fetch')
<<<<<<< HEAD
const axios = require("axios");

var fs = require('fs');

const accountId = '5ff4424d-446e-45ab-a456-3382543498de';
const token = 'eyJ0eXAiOiJNVCIsImFsZyI6IlJTMjU2Iiwia2lkIjoiOGFlYzFjZjQtYmE4NS00MDM5LWE1MmItYzVhODAxMjA3N2EyIn0.AQoAAAABAAUABwCAtO37r7nYSAgAgByyXbi52EgCAAjGhXmQqoNMgHJ0kAYNObgVAAMAAAAYAAEAAAAFAAAADQAkAAAAODU0NjFmZTAtYTlkOC00YjVmLWI4ZjMtN2Y1ZWFhOTM5OGQxIgAkAAAAODU0NjFmZTAtYTlkOC00YjVmLWI4ZjMtN2Y1ZWFhOTM5OGQxEgABAAAABgAAAGp3dF9iciMAJAAAADg1NDYxZmUwLWE5ZDgtNGI1Zi1iOGYzLTdmNWVhYTkzOThkMQ.hfKX1ToyGn-CQjxzWyn_iq5c21siHT6lKX_W4nLm18VBXKGX9qXqFMixplZa_YaF0EupO7ssbE7eerJbongbJvqhUcE7OyOKz506sqlJpidxz0I1Nnbglrgj-c6w4LbJC01VE_JhLsax5pFv11NhF8MZom9Tfi3LkQ_kKTDIQ0IXqFrB1v-SVsg36lLywb5bwCeD0Y_sbEy7jv2w6hZf_iMNfVHnGWcNDX7ivvjryJSCInOhtaupBHU81H1IbIBhQz3WbuElaNF5Tk0LDoRDL97o6Vmck0OujauMM4NduOEzPn9WW9oNDPhel65z7AFy2wfw_AKXFSCn7LKqtQd0hg';
=======
var fs = require('fs');

const token = 'eyJ0eXAiOiJNVCIsImFsZyI6IlJTMjU2Iiwia2lkIjoiNjgxODVmZjEtNGU1MS00Y2U5LWFmMWMtNjg5ODEyMjAzMzE3In0.AQoAAAABAAUABwCAzyR4kbnYSAgAgDfp2Zm52EgCAIub2PmvAdNEtk7nTqLjX-YVAAEAAAAYAAEAAAAFAAAADQAkAAAAM2ViNWE5YzQtNDkwMC00YTE3LWFkMGYtOGU2MmVkNzU5NzM1IgAkAAAAM2ViNWE5YzQtNDkwMC00YTE3LWFkMGYtOGU2MmVkNzU5NzM1EgABAAAABgAAAGp3dF9iciMAJAAAADNlYjVhOWM0LTQ5MDAtNGExNy1hZDBmLThlNjJlZDc1OTczNQ.IdGXqpo-NNZPl4eYbmHz6sSaF4W3Q0Zww2golhV9sZ76BL9dhKLSl0mdxFyVPzLASz5c9lhRJIBK1bHozlUUbMQjbQnc84uEHdQFjPUJ0wk18zYrMqU6EwLVew4OiGDCcnHZentlxfg5loJ9IjH0F3QiSo8XGuE70vTNdzz-g0QDrWCYJzcQ0sDdKvVhwljXGmHCrMA0Fl1UA6SRPvT2PADKAOUlI2Jw_PKxAtRiOaWMrc9QG2472EFQq8H9JXz2jQKxyksdRS3pw0w5ecbkhUu1DRYstcd241tgJPHlMIuS5uIh9fTECBEonCwmO4YjNbFBltITO3uU9OXXLgJoIA';
const accountId = '26630525-c754-47e0-a821-a9ca4134ac03';
const templateId = '75c20064-b240-42f0-9805-4ecd989ff7c8';
>>>>>>> ffc6c3fd66223e042d3f0a0d6245574eda4b1e56
(async function getDocusignData() {
	try {
		console.log('\n=== Script started ===\n');

<<<<<<< HEAD
		const envelopes = await axios.get(`https://na3.docusign.net/restapi/v2.1/accounts/${accountId}/envelopes?from_date=2020-01-01&search_text=Please+sign+this+document`, {
=======
		const envelopes = await fetch(`https://demo.docusign.net/restapi/v2.1/accounts/${accountId}/envelopes?from_date=2020-01-01`, {
>>>>>>> ffc6c3fd66223e042d3f0a0d6245574eda4b1e56
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`, // API key
				// 'Content-Type': 'application/json', // we will recive a json object
			},
		}).then(res => res.data)
		console.log('envs', envelopes)
		const envs = envelopes.envelopes.map(e => e.envelopeId)
		console.log('LENGTH', envs.length)
		const subsection = envs.slice(395, 470)

		const envData = await Promise.all(subsection.map((id) => {
			try {
				return axios.get(`https://na3.docusign.net/restapi/v2.1/accounts/${accountId}/envelopes/${id}?include=recipients,tabs`, {
					method: 'GET',
					headers: {
						Authorization: `Bearer ${token}`, // API key
						// 'Content-Type': 'application/json', // we will recive a json object
					},
				}).then(res => res.data)
			} catch (error) {
				console.log(error)
				return {}
			}

		}))
		const massagedData = envData.map(data => {
			return {
				tabs: data.recipients.signers[0].tabs.textTabs,
				email: data.recipients.signers[0].email,
				name: data.recipients.signers[0].name,
				firstName: data.recipients.signers[0].firstName || 'na',
				lastName: data.recipients.signers[0].lastName || 'na'
			}
		})
		console.log(massagedData.length)

		const finalForm = massagedData.map(data => {
			const SSN = data.tabs.filter(t => t.tabLabel.includes('SSN')).map(t => t.value).join('') || 'na'
			const TIN = data.tabs.filter(t => t.tabLabel.includes('TIN')).map(t => t.value).join('') || 'na'
			const EIN = data.tabs.filter(t => t.tabLabel.includes('EIN')).map(t => t.value).join('') || 'na'
			const SSNITIN = data.tabs.filter(t => t.tabLabel.includes('SSN-ITIN')).map(t => t.value).join('') || 'na'
			const foreignTaxNumber = data.tabs.filter(t => t.tabLabel.includes('Foreign-Tax-Number')).map(t => t.value).join('') || 'na'
			const GIIN = data.tabs.filter(t => t.tabLabel.includes('Text 438e921d-af64-4451-80e2-7243b3ab53c4')).map(t => t.value).join('') || 'na'
			const foreignTIN = data.tabs.filter(t => t.tabLabel.includes('Text 8b6bcfdd-afeb-4b54-8abb-49e895432f61')).map(t => t.value).join('') || 'na'
			const EntityName = data.tabs.filter(t => t.tabLabel.includes('Entity-Name')).map(t => t.value).join('') || 'na'
			return {
				SSN,
				TIN,
				EIN,
				SSNITIN,
				GIIN,
				foreignTIN,
				foreignTaxNumber,
				email: data.email,
				firstName: data.firstName,
				lastName: data.lastName,
				name: data.name,
				EntityName
			}
		})
		console.log(JSON.stringify(finalForm))

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