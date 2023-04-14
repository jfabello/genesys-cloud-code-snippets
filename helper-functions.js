const regexes = require("./regexes.js");
const gcPlatformClient = require("purecloud-platform-client-v2");

function checkGenesysCloudEnvVars() {

	// Check the Genesys Cloud client ID argument

	if ("GENESYS_CLOUD_CLIENT_ID" in process.env === false) {
		let message = "Genesys Cloud client ID environment variable is not set.";
		throw new ReferenceError(message);
	}

	const gcClientId = process.env["GENESYS_CLOUD_CLIENT_ID"];

	if (typeof gcClientId !== "string") {
		let message = `Genesys Cloud client ID environment variable type "${typeof gcClientId}" is invalid, it should be a string.`;
		throw new TypeError(message);
	}

	if (regexes.UUID_REGEX.test(gcClientId) === false) {
		let message = "Genesys Cloud client ID environment variable is not a valid UUID. Check for leading and trailing whitespace characters.";
		throw new TypeError(message);
	}

	// Check the Genesys Cloud client secret argument

	if ("GENESYS_CLOUD_CLIENT_SECRET" in process.env === false) {
		let message = "Genesys Cloud client secret environment variable is not set.";
		throw new ReferenceError(message);
	}

	const gcClientSecret = process.env["GENESYS_CLOUD_CLIENT_SECRET"];

	if (typeof gcClientSecret !== "string") {
		let message = `Genesys Cloud client secret environment variable type "${typeof gcClientSecret}" is invalid, it should be a string.`;
		throw new TypeError(message);
	}

	// Check that the Genesys Cloud region is a valid region

	if ("GENESYS_CLOUD_REGION" in process.env === false) {
		let message = "Genesys Cloud region environment variable is not set.";
		throw new ReferenceError(message);
	}

	const gcRegion = process.env["GENESYS_CLOUD_REGION"];

	if (typeof gcRegion !== "string") {
		let message = `Genesys Cloud region environment variable type "${typeof gcClientSecret}" is invalid, it should be a string.`;
		throw new TypeError(message);
	}

	if (gcRegion in gcPlatformClient.PureCloudRegionHosts === false) {
		let message = `Genesys cloud region environment variable "${options.gcRegion}" is invalid.`;
		logToConsole.error(message);
		throw new RangeError(message);
	}

	return true;
}

module.exports = { checkGenesysCloudEnvVars };
