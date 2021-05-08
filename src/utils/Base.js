const fs = require('fs');
const path = require('path');
const gis = require('g-i-s');
const probe = require('probe-image-size');
const fetch = require('node-fetch');
const humanizeDuration = require('humanize-duration');
const ProcessQueue = require('./ProcessQueue.js');
const ErrorTicketManager = require('./ErrorTicketManager.js');
const constants = require('./Constants.js');
const { Color } = require('../types/Base.js');

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
	return {
		days: days,
		hours: hours,
		minutes: minutes,
		totalMinutes: Math.round(diffMs / 60000),
		estimate: humanizeDuration(diffMs, { largest: 2, conjunction: ' and ', round: true }),
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
 * @returns {Promise<{large: String, small: String}>}
 */
function fetchImage(title) {
	return new Promise(resolve => {
		gis(title, async (error, results) => {
			const data = { large: '', small: '' };
			if (!error) {
				for (const image of results) {
					const response = await fetch(image.url).catch(e => void e);
					if (response && response.ok) {
						const probe_result = await probe(image.url, { timeout: 10000 }).catch(e => void e);
						if (probe_result) {
							const width = parseInt(probe_result.width);
							const height = parseInt(probe_result.height);
							const ratio = width / height;
							if (width >= 200 && height >= 200 && ratio >= 1.7) {
								if(!data.large) data.large = probe_result.url;
							}
							if (width >= 50 && height >= 50 && ratio >= 0.8 && ratio <= 1.2) {
								if(!data.small) data.small = probe_result.url;
							}
							if (data.small && data.large) break;
						}
					}
				}
			}
			resolve(data);
		});
	});
}

/**
 * Generates a random color.
 * @param {{min: number, max: number}} options
 * @returns {Color}
 */
function generateColor(options = { min: 0, max: 255 }) {
	return new Color({
		red: Math.floor(Math.random() * (options.max - options.min) + options.min),
		green: Math.floor(Math.random() * (options.max - options.min) + options.min),
		blue: Math.floor(Math.random() * (options.max - options.min) + options.min),
	});
}

/**
 * Checks if an object is a promise.
 * @param {*} p
 * @returns {boolean}
 */
function isPromise(p) {
	return p && Object.prototype.toString.call(p) === '[object Promise]';
}

/**
 * Gets all the file directories contained in the parent directory.
 * @param {String} dirPath
 * @param {String[]} arrayOfFiles
 * @returns
 */
function getAllFiles(dirPath, arrayOfFiles = []) {
	const files = fs.readdirSync(dirPath);
	files.forEach(function(file) {
		if (fs.statSync(dirPath + '/' + file).isDirectory()) {
			arrayOfFiles = getAllFiles(dirPath + '/' + file, arrayOfFiles);
		}
		else {
			arrayOfFiles.push(path.join(dirPath, '/', file));
		}
	});
	return arrayOfFiles;
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
	isPromise,
	generateColor,
	getAllFiles,
};