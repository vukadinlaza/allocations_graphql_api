require('dotenv').config();

const slackEventsAPI = require('@slack/events-api');
const { WebClient } = require('@slack/client');
const { keyBy, omit, mapValues } = require('lodash');
/**
 * Transform a Slack link into a Slack message attachment.
 *
 * @param {Object} link - Slack link
 * @param {string} link.url - The URL of the link
 *
 * @returns {Promise.<Object>} An object described by the Slack message attachment structure. In
 * addition to the properties described in the API documentation, an additional `url` property is
 * defined so the source of the attachment is captured.
 * See: https://api.slack.com/docs/message-attachments
 */

// Initialize a Slack Event Adapter for easy use of the Events API
// See: https://github.com/slackapi/node-slack-events-api
const slackEvents = slackEventsAPI.createEventAdapter(process.env.SLACK_VERIFICATION_TOKEN);

// Initialize a Web Client
const slack = new WebClient(process.env.SLACK_CLIENT_TOKEN);

// Handle the event from the Slack Events API
slackEvents.on('link_shared', async (event) => {

	console.log(event)
	// Call a helper that transforms the URL into a promise for an attachment suitable for Slack
	// Promise.all(event.links.map(link => link))
	// 	// Transform the array of attachments to an unfurls object keyed by URL
	// 	.then(attachments => keyBy(attachments, 'url'))
	// 	.then(unfurls => mapValues(unfurls, attachment => omit(attachment, 'url')))
	// 	// Invoke the Slack Web API to append the attachment
	// 	.then(unfurls => slack.chat.unfurl(event.message_ts, event.channel, unfurls))
	// 	.catch(console.error);
});

// Handle errors
const slackEventsErrorCodes = slackEventsAPI.errorCodes;
slackEvents.on('error', (error) => {
	if (error.code === slackEventsErrorCodes.TOKEN_VERIFICATION_FAILURE) {
		console.warn(`An unverified request was sent to the Slack events request URL: ${error.body}`);
	} else {
		console.error(error);
	}
});

module.exports = {
	slackEvents
}