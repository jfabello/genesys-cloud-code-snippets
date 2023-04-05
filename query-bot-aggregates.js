// Import required modules
const logToConsole = require("@jfabello/logtoconsole").getInstance(4);
const gcPlatformClient = require("purecloud-platform-client-v2");

// Private constants
// Change this constants to modify the query
const DAY_IN_MS = 1000 * 60 * 60 * 24;
const QUERY_START_DATE_ISO_STRING = new Date(Date.now() - DAY_IN_MS * 10).toISOString(); // 10 days ago
const QUERY_END_DATE_ISO_STRING = new Date().toISOString(); // Right now
const QUERY_GRANULARITY = "P1D"; // 1 day
const QUERY_TIME_ZONE =  "America/Bogota"

// Regexes
const UUID_REGEX = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/;

// Runs the query bot aggregates function
queryBotAggregates();

// Genesys Cloud query bot aggregates function

async function queryBotAggregates() {
	// Check the Genesys Cloud client ID argument

	if ("GENESYS_CLOUD_CLIENT_ID" in process.env === false) {
		let message = "Genesys Cloud client ID environment variable is not set.";
		logToConsole.error(message);
		throw new ReferenceError(message);
	}

	const gcClientId = process.env["GENESYS_CLOUD_CLIENT_ID"];

	if (typeof gcClientId !== "string") {
		let message = `Genesys Cloud client ID environment variable type "${typeof gcClientId}" is invalid, it should be a string.`;
		logToConsole.error(message);
		throw new TypeError(message);
	}

	if (UUID_REGEX.test(gcClientId) === false) {
		let message = "Genesys Cloud client ID environment variable is not a valid UUID. Check for leading and trailing whitespace characters.";
		logToConsole.error(message);
		throw new TypeError(message);
	}

	// Check the Genesys Cloud client secret argument

	if ("GENESYS_CLOUD_CLIENT_SECRET" in process.env === false) {
		let message = "Genesys Cloud client secret environment variable is not set.";
		logToConsole.error(message);
		throw new ReferenceError(message);
	}

	const gcClientSecret = process.env["GENESYS_CLOUD_CLIENT_SECRET"];

	if (typeof gcClientSecret !== "string") {
		let message = `Genesys Cloud client secret environment variable type "${typeof gcClientSecret}" is invalid, it should be a string.`;
		logToConsole.error(message);
		throw new TypeError(message);
	}

	// Check that the Genesys Cloud region is a valid region

	if ("GENESYS_CLOUD_REGION" in process.env === false) {
		let message = "Genesys Cloud region environment variable is not set.";
		logToConsole.error(message);
		throw new ReferenceError(message);
	}

	const gcRegion = process.env["GENESYS_CLOUD_REGION"];

	if (typeof gcRegion !== "string") {
		let message = `Genesys Cloud region environment variable type "${typeof gcClientSecret}" is invalid, it should be a string.`;
		logToConsole.error(message);
		throw new TypeError(message);
	}

	if (gcRegion in gcPlatformClient.PureCloudRegionHosts === false) {
		let message = `Genesys cloud region environment variable "${options.gcRegion}" is invalid.`;
		logToConsole.error(message);
		throw new RangeError(message);
	}

	// Get the Genesys Cloud Platform client instance
	const gcClientInstance = gcPlatformClient.ApiClient.instance;

	// Set the Genesys Cloud region
	gcClientInstance.setEnvironment(gcPlatformClient.PureCloudRegionHosts[gcRegion]);

	// Genesys Cloud login
	try {
		await gcClientInstance.loginClientCredentialsGrant(gcClientId, gcClientSecret);
	} catch (gcError) {
		let message = "An error ocurred while authenticating to Genesys Cloud.";
		logToConsole.error(message);
		logToConsole.debug("Genesys Cloud returned error object:\n%O", gcError);
		let error = new Error(message);
		error.gcError = gcError;
		throw error;
	}

	// Create API instances
	const analyticsApi = new gcPlatformClient.AnalyticsApi();

	let queryBotAggregatesBody = {
		interval: QUERY_START_DATE_ISO_STRING + "/" + QUERY_END_DATE_ISO_STRING,
		granularity: QUERY_GRANULARITY,
		timeZone: QUERY_TIME_ZONE,
		metrics: ["nBotSessionTurns", "nBotSessions", "oBotIntent", "oBotSessionQuery", "oBotSessionQuerySelfServed", "oBotSessionTurn", "oBotSlot", "tBotDisconnect", "tBotExit", "tBotRecognitionFailure", "tBotSession"],
		groupBy: ["botIntent"],
		filter: {
			type: "and",
			predicates: [
				{
					dimension: "botProvider",
					value: "GOOGLE"
				},
				{
					dimension: "mediaType",
					value: "MESSAGING"
				}
			]
		}
	};

	let queryBotAggregatesResults = {};

	try {
		queryBotAggregatesResults = await analyticsApi.postAnalyticsBotsAggregatesQuery(queryBotAggregatesBody);
	} catch (gcError) {
		let message = `An error occurred while querying the bot aggreggates.`;
		logToConsole.error(message);
		logToConsole.debug("Genesys Cloud returned error object:\n%O", gcError);
		let error = new Error(message);
		error.gcError = gcError;
		throw error;
	}

	console.dir(queryBotAggregatesResults, { depth: null, maxArrayLength: null });

	console.log(`Number of returned results: ${queryBotAggregatesResults.results.length}`);

	return true;
}
