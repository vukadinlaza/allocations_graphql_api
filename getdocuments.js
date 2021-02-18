// You would need to obtain an accessToken using your chosen auth flow 
require('dotenv').config();
const axios = require("axios");
const { map, find, reduce } = require('lodash');
var fs = require('fs');
const docusign = require('docusign-esign')
const basePath = process.env.NODE_ENV === 'production' ? 'https://na3.docusign.net/restapi' : 'https://demo.docusign.net/restapi'
const accessTokenStaging = 'eyJ0eXAiOiJNVCIsImFsZyI6IlJTMjU2Iiwia2lkIjoiNjgxODVmZjEtNGU1MS00Y2U5LWFmMWMtNjg5ODEyMjAzMzE3In0.AQoAAAABAAUABwAARTFOY9PYSAgAAK31r2vT2EgCAIub2PmvAdNEtk7nTqLjX-YVAAEAAAAYAAEAAAAFAAAADQAkAAAAM2ViNWE5YzQtNDkwMC00YTE3LWFkMGYtOGU2MmVkNzU5NzM1IgAkAAAAM2ViNWE5YzQtNDkwMC00YTE3LWFkMGYtOGU2MmVkNzU5NzM1EgABAAAABgAAAGp3dF9iciMAJAAAADNlYjVhOWM0LTQ5MDAtNGExNy1hZDBmLThlNjJlZDc1OTczNQ.NTCVg2FRwP747YWpFtvQrXnwW8nkwKF-ThxuBv2uclghTck2Zk0poIUuWvXHGMTJsLX-zsBlPVyAM5kWvOE7jh8ieLM2xrBLVchnjqyyHtxL34oXNxD5FbDSUsPkg50jhBImroYGFEG5HvmJOPcbdMfrFdkcAgJ1MwOn7Sg1hUVMJD-fBJHE4_p9fG4QrbtWFaFUczz4xQmxZ8ua0f45qDoluOgMEqLGas_QHfCKM-urQA9jiUvn4YpmY_NASevTStq7d1itHZi6NRViGDc-JLLnTBQl9wbMcteE8zTBy1wr7St4nYNH-V-YXRDzqJb_nriO8wnlo3oy0Z5yIdZHjg'
const accessToken = 'eyJ0eXAiOiJNVCIsImFsZyI6IlJTMjU2Iiwia2lkIjoiOGFlYzFjZjQtYmE4NS00MDM5LWE1MmItYzVhODAxMjA3N2EyIn0.AQoAAAABAAUABwCA6oMQatPYSAgAgFJIcnLT2EgCAAjGhXmQqoNMgHJ0kAYNObgVAAMAAAAYAAEAAAAFAAAADQAkAAAAODU0NjFmZTAtYTlkOC00YjVmLWI4ZjMtN2Y1ZWFhOTM5OGQxIgAkAAAAODU0NjFmZTAtYTlkOC00YjVmLWI4ZjMtN2Y1ZWFhOTM5OGQxEgABAAAABgAAAGp3dF9iciMAJAAAADg1NDYxZmUwLWE5ZDgtNGI1Zi1iOGYzLTdmNWVhYTkzOThkMQ.R0Q3S6wNoqE4SWcIR1uaFen8pf2iXEY_Fbe2no5gJHJYVEpHI53ESLCSUrfIuJqxldfeYUXgIcXBvWnkfKUbi4YVSjOF7CIUeCGJSQbDN9zPrZPuFvG0ISEzm5MwgOqDopJBqWDkW06_SzW_7SCqq7_bYJJm0kszC1LbmuZKvlBOsw2_1D3kV1ORQDWP3qqy8UkJr76uF_mwMlGzjTjN3dcm-fNifl7cpuKZsiUh6EwtXSI3vHl4nywpc5CbOkqfWoQlhFlt2gIow6C8OkeVmFCMG7yl37WlCYksLFi5YNPLYeIOHfE2niDEW_YgcQ5qaozjcG1Wwt1mXRfkXKtmSA'

let dsApiClient = new docusign.ApiClient();
dsApiClient.setBasePath('https://na3.docusign.net/restapi');
dsApiClient.addDefaultHeader('Authorization', 'Bearer ' + accessToken);

let envelopesApi = new docusign.EnvelopesApi(dsApiClient);
let FoldersApi = new docusign.FoldersApi(dsApiClient);
var envelopeId; // envelopeId that you are working on
const accountIdProd = '5ff4424d-446e-45ab-a456-3382543498de';
const accountIdStaging = '26630525-c754-47e0-a821-a9ca4134ac03';




(async function closeDeals() {
	try {
		console.log('\n=== Script started ===\n');
		// const envelopes = await envelopesApi.listStatus(accountIdStaging, {})
		// const foldersRes = await FoldersApi.search(accountIdStaging, 'completed')
		// const envIds = foldersRes.folderItems.map()
		const envelopesRes = await axios.get(`https://na3.docusign.net/restapi/v2.1/accounts/${accountIdProd}/envelopes?from_date=2020-01-01&search_text=Poppy&include=recipients`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${accessToken}`, // API key
				// 'Content-Type': 'application/json', // we will recive a json object
			},
		}).then(res => res.data)
		const envIds = envelopesRes.envelopes.map(e => {
			return { id: e.envelopeId, name: e.recipients.signers[0].name, status: e.recipients.signers[0].status }
		}).filter(e => e.status === 'completed')
		console.log(envIds.length)
		await Promise.all(envIds.map(async env => {
			let results2 = await envelopesApi.getDocument(accountIdProd, env.id, 'combined', null);
			await fs.writeFileSync(`./vitalizeDocs/poppy/${env.name.replace(/\s./g, '-')}.pdf`, results2, 'binary')

			return Promise.resolve()

		}))
		process.exit(0);
	} catch (err) {
		console.log(
			`\n=== ERROR! Updating Investment Status \n`,
			err
		);
		process.exit(1);
	}
})();


// let envelopesApi = new docusign.EnvelopesApi(dsApiClient)
// 	, results = null;

// // EnvelopeDocuments::get.
// // Exceptions will be caught by the calling function
// results = await envelopesApi.getDocument(
// 	args.accountId, args.envelopeDocuments.envelopeId, args.documentId, null);

// let docItem = args.envelopeDocuments.documents.find(item => item.documentId === args.documentId)
// 	, docName = docItem.name
// 	, hasPDFsuffix = docName.substr(docName.length - 4).toUpperCase() === '.PDF'
// 	, pdfFile = hasPDFsuffix
// 	;
// // Add .pdf if it's a content or summary doc and doesn't already end in .pdf
// if ((docItem.type === "content" || docItem.type === "summary") && !hasPDFsuffix) {
// 	docName += ".pdf";
// 	pdfFile = true;
// }
// // Add .zip as appropriate
// if (docItem.type === "zip") {
// 	docName += ".zip"
// }

// // Return the file information
// // See https://stackoverflow.com/a/30625085/64904
// let mimetype;
// if (pdfFile) {
// 	mimetype = 'application/pdf'
// } else if (docItem.type === 'zip') {
// 	mimetype = 'application/zip'
// } else {
// 	mimetype = 'application/octet-stream'
// }

// return ({ mimetype: mimetype, docName: docName, fileBytes: results });
// }