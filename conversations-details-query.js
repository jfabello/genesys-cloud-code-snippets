// Import required modules
const constants = require("./constants.js");
const helperFuncs = require("./helper-functions.js");
const logToConsole = require("@jfabello/logtoconsole").getInstance(4);
const gcPlatformClient = require("purecloud-platform-client-v2");

// Change this constants to modify the query
const QUERY_START_DATE_ISO_STRING = new Date(Date.now() - constants.DAY_IN_MS * 7).toISOString(); // 7 days ago
const QUERY_END_DATE_ISO_STRING = new Date().toISOString(); // Right now

// Runs the conversations details query function
conversationsDetailsQuery();

// Genesys Cloud conversations details query function
async function conversationsDetailsQuery() {
	// Check the Genesys Cloud environment variables
	try {
		helperFuncs.checkGenesysCloudEnvVars();
	} catch (error) {
		logToConsole.error(error.message);
		return false;
	}

	// Genesys Cloud client and region constants
	const gcClientId = process.env["GENESYS_CLOUD_CLIENT_ID"];
	const gcClientSecret = process.env["GENESYS_CLOUD_CLIENT_SECRET"];
	const gcRegion = process.env["GENESYS_CLOUD_REGION"];

	// Get the Genesys Cloud Platform client instance
	const gcClientInstance = gcPlatformClient.ApiClient.instance;

	// Set the Genesys Cloud region
	gcClientInstance.setEnvironment(gcPlatformClient.PureCloudRegionHosts[gcRegion]);

	// Genesys Cloud login
	try {
		await gcClientInstance.loginClientCredentialsGrant(gcClientId, gcClientSecret);
	} catch (gcError) {
		logToConsole.error("An error ocurred while authenticating to Genesys Cloud.");
		logToConsole.debug("Genesys Cloud returned error object:\n%O", gcError);
		return false;
	}

	// Create API instances
	const analyticsApi = new gcPlatformClient.AnalyticsApi();

	const conversationsDetailsQueryBody = {
		interval: QUERY_START_DATE_ISO_STRING + "/" + QUERY_END_DATE_ISO_STRING,
		paging: {
			pageSize: 100,
			pageNumber: 0
		}
	};

	let conversationsDetailsQueryResults = {
		conversations: [],
		totalHits: 0
	};

	do {
		let conversationsDetailsQueryResultsPage = {};

		conversationsDetailsQueryBody.paging.pageNumber = conversationsDetailsQueryBody.paging.pageNumber + 1;

		try {
			conversationsDetailsQueryResultsPage = await analyticsApi.postAnalyticsConversationsDetailsQuery(conversationsDetailsQueryBody);
		} catch (gcError) {
			logToConsole.error("An error occurred while querying the convresations details.");
			logToConsole.debug("Genesys Cloud returned error object:\n%O", gcError);
		}

		if ("conversations" in conversationsDetailsQueryResultsPage === false) {
			logToConsole.warning("No conversations details returned.");
			return false;
		}

		conversationsDetailsQueryResults.conversations.push(...conversationsDetailsQueryResultsPage.conversations);
		conversationsDetailsQueryResults.totalHits = conversationsDetailsQueryResultsPage.totalHits;
	} while (conversationsDetailsQueryBody.paging.pageNumber * conversationsDetailsQueryBody.paging.pageSize < conversationsDetailsQueryResults.totalHits);

	for (const conversation of conversationsDetailsQueryResults.conversations) {
		console.log(`Conversation ID: ${conversation.conversationId}`);
		console.log(`Conversation start timestamp: ${conversation.conversationStart}`);

		if ("conversationEnd" in conversation === true) {
			console.log(`Conversation end timestamp: ${conversation.conversationEnd}`);
		} else {
			console.log(`Conversation end timestamp: Not ended`);
		}

		if ("evaluations" in conversation === true) {
			console.log("Has evaluations: Yes");
		} else {
			console.log("Has evaluations: No");
		}

		if ("surveys" in conversation === true) {
			console.log("Has surveys: Yes");
		} else {
			console.log("Has surveys: No");
		}

		if ("participants" in conversation === true) {
			const participants = [];

			for (const participant of conversation.participants) {
				const participantData = {};

				participantData.id = participant.participantId;

				if ("participantName" in participant === true) {
					participantData.name = participant.participantName;
				} else {
					participantData.name = "Not available";
				}

				if ("purpose" in participant === true) {
					participantData.purpose = participant.purpose;
				} else {
					participantData.purpose = "Not available";
				}

				participants.push(participantData);
			}

			if (participants.length > 0) {
				console.table(participants);
			}
		}

		console.log();
	}

	return true;
}
