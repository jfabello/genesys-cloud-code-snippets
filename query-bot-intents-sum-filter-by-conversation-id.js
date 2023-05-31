// Import required modules
const constants = require("./constants.js");
const regexes = require("./regexes.js");
const helperFuncs = require("./helper-functions.js");
const logToConsole = require("@jfabello/logtoconsole").getInstance(4);
const gcPlatformClient = require("purecloud-platform-client-v2");

// Change this constants to modify the query
const QUERY_START_DATE_ISO_STRING = new Date(Date.now() - constants.DAY_IN_MS * 90).toISOString(); // 90 days ago
const QUERY_END_DATE_ISO_STRING = new Date().toISOString(); // Right now
const QUERY_TIME_ZONE = "America/Bogota";

// Runs the query bot aggregates function
queryBotAggregates();

// Genesys Cloud query bot aggregates function
async function queryBotAggregates() {
	// Check the command line arguments
	if (process.argv.length !== 3) {
		logToConsole.error(`Expected one conversation ID as argument, got ${process.argv.length < 3 ? 0 : process.argv.length - 2}`);
		return false;
	}

	if (regexes.UUID_REGEX.test(process.argv[2]) === false) {
		logToConsole.error(`"${process.argv[2]}" is an invalid conversation ID`);
		return false;
	}

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

	const botAggregatesQueryBody = {
		interval: QUERY_START_DATE_ISO_STRING + "/" + QUERY_END_DATE_ISO_STRING,
		timeZone: QUERY_TIME_ZONE,
		metrics: ["oBotIntent"],
		groupBy: ["conversationId", "botIntent"],
		filter: {
			type: "and",
			predicates: [
				{
					dimension: "conversationId",
					operator: "matches",
					value: process.argv[2]
				}
			]
		}
	};

	logToConsole.info("Bot aggregates query body:");
	console.dir(botAggregatesQueryBody, {depth: Infinity, maxArrayLength: Infinity});
	console.log();

	let botAggregatesQueryResults = {};

	try {
		botAggregatesQueryResults = await analyticsApi.postAnalyticsBotsAggregatesQuery(botAggregatesQueryBody);
	} catch (gcError) {
		logToConsole.error("An error occurred while querying the bot aggreggates.");
		logToConsole.debug("Genesys Cloud returned error object:\n%O", gcError);
		return false;
	}

	logToConsole.info("Bot aggregates query response:");
	console.dir(botAggregatesQueryResults, {depth: Infinity, maxArrayLength: Infinity});
	console.log();


	if ("results" in botAggregatesQueryResults === false) {
		logToConsole.warning("No bot aggregates returned.");
		return false;
	}

	const botAggregatesConversations = new Map();

	for (const result of botAggregatesQueryResults.results) {
		if ("botIntent" in result.group === false) continue;
		if ("conversationId" in result.group === false) continue;

		if (botAggregatesConversations.has(result.group.conversationId) === false) {
			botAggregatesConversations.set(result.group.conversationId, new Map());
		}

		const conversation = botAggregatesConversations.get(result.group.conversationId);

		if (conversation.has(result.group.botIntent) === false) {
			conversation.set(result.group.botIntent, 0);
		}

		if ("data" in result === false) continue;

		for (const data of result.data) {
			if ("metrics" in data === false) continue;
			for (const metric of data.metrics) {
				if ("stats" in metric === false) continue;
				if ("sum" in metric.stats === false) continue;
				conversation.set(result.group.botIntent, conversation.get(result.group.botIntent) + metric.stats.sum);
			}
		}
	}

	for (const [conversationId, conversationIntents] of botAggregatesConversations) {
		console.log(`Conversation ID: ${conversationId}`);
		const intentsArray = [];
		for (const [intent, sum] of conversationIntents) {
			intentsArray.push({ intent, sum: sum });
		}
		console.table(intentsArray);
		console.log();
	}

	return true;
}
