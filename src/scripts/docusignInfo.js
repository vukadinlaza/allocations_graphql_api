const fetch = require('node-fetch')
var fs = require('fs');

const token = 'eyJ0eXAiOiJNVCIsImFsZyI6IlJTMjU2Iiwia2lkIjoiNjgxODVmZjEtNGU1MS00Y2U5LWFmMWMtNjg5ODEyMjAzMzE3In0.AQoAAAABAAUABwCAzyR4kbnYSAgAgDfp2Zm52EgCAIub2PmvAdNEtk7nTqLjX-YVAAEAAAAYAAEAAAAFAAAADQAkAAAAM2ViNWE5YzQtNDkwMC00YTE3LWFkMGYtOGU2MmVkNzU5NzM1IgAkAAAAM2ViNWE5YzQtNDkwMC00YTE3LWFkMGYtOGU2MmVkNzU5NzM1EgABAAAABgAAAGp3dF9iciMAJAAAADNlYjVhOWM0LTQ5MDAtNGExNy1hZDBmLThlNjJlZDc1OTczNQ.IdGXqpo-NNZPl4eYbmHz6sSaF4W3Q0Zww2golhV9sZ76BL9dhKLSl0mdxFyVPzLASz5c9lhRJIBK1bHozlUUbMQjbQnc84uEHdQFjPUJ0wk18zYrMqU6EwLVew4OiGDCcnHZentlxfg5loJ9IjH0F3QiSo8XGuE70vTNdzz-g0QDrWCYJzcQ0sDdKvVhwljXGmHCrMA0Fl1UA6SRPvT2PADKAOUlI2Jw_PKxAtRiOaWMrc9QG2472EFQq8H9JXz2jQKxyksdRS3pw0w5ecbkhUu1DRYstcd241tgJPHlMIuS5uIh9fTECBEonCwmO4YjNbFBltITO3uU9OXXLgJoIA';
const accountId = '26630525-c754-47e0-a821-a9ca4134ac03';
const templateId = '75c20064-b240-42f0-9805-4ecd989ff7c8';
(async function getDocusignData() {
	try {
		console.log('\n=== Script started ===\n');

		const envelopes = await fetch(`https://demo.docusign.net/restapi/v2.1/accounts/${accountId}/envelopes?from_date=2020-01-01`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`, // API key
				// 'Content-Type': 'application/json', // we will recive a json object
			},
		}).then(res => res.json())
		// console.log(envelopes)
		const envs = envelopes.envelopes.map(e => e.envelopeId)
		// console.log(envs)

		const envData = await Promise.all(envs.map(async (id) => {
			const envData = await fetch(`https://demo.docusign.net/restapi/v2.1/accounts/${accountId}/envelopes/${id}?include=recipients,tabs`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`, // API key
					// 'Content-Type': 'application/json', // we will recive a json object
				},
			}).then(res => res.json())
			return envData
		}))
		const massagedData = envData.map(data => {
			return {
				tabs: data.recipients.signers[0].tabs.textTabs,
				email: data.recipients.signers[0].email
			}
		})
		console.log(massagedData)

		const finalForm = massagedData.map(data => {
			const SSN = data.tabs.filter(t => t.tabLabel.includes('SSN')).map(t => t.value).join('') || 'na'
			const TIN = data.tabs.filter(t => t.tabLabel.includes('TIN')).map(t => t.value).join('') || 'na'
			const EIN = data.tabs.filter(t => t.tabLabel.includes('EIN')).map(t => t.value).join('') || 'na'
			const SSNITIN = data.tabs.filter(t => t.tabLabel.includes('SSN-ITIN')).map(t => t.value).join('') || 'na'
			const foreignTaxNumber = data.tabs.filter(t => t.tabLabel.includes('Foreign-Tax-Number')).map(t => t.value).join('') || 'na'
			const GIIN = data.tabs.filter(t => t.tabLabel.includes('Text 438e921d-af64-4451-80e2-7243b3ab53c4')).map(t => t.value).join('') || 'na'
			const foreignTIN = data.tabs.filter(t => t.tabLabel.includes('Text 8b6bcfdd-afeb-4b54-8abb-49e895432f61')).map(t => t.value).join('') || 'na'

			return {
				SSN,
				TIN,
				EIN,
				SSNITIN,
				GIIN,
				foreignTIN,
				foreignTaxNumber,
				email: data.email
			}
		})

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