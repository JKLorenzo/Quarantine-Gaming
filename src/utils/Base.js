const gis = require('g-i-s');
const ProcessQueue = require('./ProcessQueue.js');
const ErrorTicketManager = require('./ErrorTicketManager.js');
const constants = require('./Constants.js');

/**
 * Waits for the given amount of time.
 * @param {number} timeout Time in miliseconds.
 * @returns {Promise<null>}
 */
function sleep(timeout) {
	return new Promise(resolve => setTimeout(resolve, timeout));
}

/**
 * Parses html character symbols to their string variant.
 * @param {String} html
 */
function parseHTML(html) {
	return String(html).replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"');
}

/**
 * Filters out symbols used to signify a mentioned object.
 * @param {String} mention The mentioned object.
 * @returns {String} Mentioned ID
 */
function parseMention(mention) {
	return String(mention).replace(/\W/g, '');
}

/**
 *
 * @param {String} string1
 * @param {String} string2
 * @returns {Number} Ranges from 0 - 100
 */
function getPercentSimilarity(string1, string2) {
	let longer_string = string1;
	let shorter_string = string2;

	if (string1.length < string2.length) {
		longer_string = string2;
		shorter_string = string1;
	}

	if (longer_string.length == 0 || shorter_string.length == 0) return 0;

	const costs = new Array();
	for (let i = 0; i <= longer_string.length; i++) {
		let lastValue = i;
		for (let j = 0; j <= shorter_string.length; j++) {
			if (i == 0) {costs[j] = j;}
			else if (j > 0) {
				let newValue = costs[j - 1];
				if (longer_string.charAt(i - 1) != shorter_string.charAt(j - 1)) {
					newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
				}
				costs[j - 1] = lastValue;
				lastValue = newValue;
			}
		}
		if (i > 0) costs[shorter_string.length] = lastValue;
	}

	return 100 * ((longer_string.length - costs[shorter_string.length]) / longer_string.length);
}

/**
 *
 * @param {Date} date
 * @returns
 */
function compareDate(date) {
	const today = new Date();
	const diffMs = (today - date);
	const days = Math.floor(diffMs / 86400000);
	const hours = Math.floor((diffMs % 86400000) / 3600000);
	const minutes = Math.round(((diffMs % 86400000) % 3600000) / 60000);
	let estimated = 'a few seconds ago';
	if (days > 0) {
		estimated = days + ` day${days > 1 ? 's' : ''} ago`;
	}
	else if (hours > 0) {
		estimated = hours + ` hour${hours > 1 ? 's' : ''} ago`;
	}
	else if (minutes > 0) {
		estimated = minutes + ` minute${minutes > 1 ? 's' : ''} ago`;
	}
	return {
		days: days,
		hours: hours,
		minutes: minutes,
		totalMinutes: Math.round(diffMs / 60000),
		estimate: estimated,
	};
}

function compareArray(array1, array2) {
	const a = [], difference = [];
	for (let i = 0; i < array1.length; i++) {
		a[array1[i]] = true;
	}
	for (let i = 0; i < array2.length; i++) {
		if (a[array2[i]]) {
			delete a[array2[i]];
		}
		else {
			a[array2[i]] = true;
		}
	}
	for (const k in a) {
		difference.push(k);
	}
	return difference;
}

/**
 * Checks if the base string contains the part string (Case Sensitive).
 * @param {String} base
 * @param {String | String[]} part
 */
function contains(base, part) {
	let parts = new Array();
	if (part instanceof Array) {
		parts = [...part];
	}
	else {
		parts.push(part);
	}
	for (const this_part of parts) {
		if (base.indexOf(this_part) !== -1) return true;
	}
	return false;
}

/**
 * Search for images using Google Image Search.
 * @param {String} title
 * @returns {Promise<{url: String, width: Number, height: Number}[]>}
 */
function fetchImage(title) {
	return new Promise(resolve => {
		gis(title, (error, results) => {
			if (error) {
				console.error(`BaseUtil(fetchImage): ${error}`);
				resolve(new Array());
			}
			resolve(results);
		});
	});
}

module.exports = {
	ProcessQueue,
	ErrorTicketManager,
	constants,
	sleep,
	parseHTML,
	parseMention,
	getPercentSimilarity,
	compareDate,
	compareArray,
	contains,
	fetchImage,
};