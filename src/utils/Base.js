import fs from 'fs';
import path from 'path';
import gis from 'g-i-s';
import humanizeDuration from 'humanize-duration';
import probe from 'probe-image-size';
import constants from './Constants.js';
import ErrorTicketManager from './ErrorTicketManager.js';
import ProcessQueue from './ProcessQueue.js';
import { Color } from '../types/Base.js';

/**
 * Waits for the given amount of time.
 * @param {number} timeout Time in miliseconds.
 * @returns {Promise<null>}
 */
export function sleep(timeout) {
	return new Promise(resolve => setTimeout(resolve, timeout));
}

/**
 * Parses html character symbols to their string variant.
 * @param {String} html
 */
export function parseHTML(html) {
	return String(html).replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"');
}

/**
 * Filters out symbols used to signify a mentioned object.
 * @param {String} mention The mentioned object.
 * @returns {String} Mentioned ID
 */
export function parseMention(mention) {
	return String(mention).replace(/\W/g, '');
}

/**
 *
 * @param {String} string1
 * @param {String} string2
 * @returns {Number} Ranges from 0 - 100
 */
export function getPercentSimilarity(string1, string2) {
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
			if (i == 0) {
				costs[j] = j;
			} else if (j > 0) {
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
export function compareDate(date) {
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

export function compareArray(array1, array2) {
	const a = [], difference = [];
	for (let i = 0; i < array1.length; i++) {
		a[array1[i]] = true;
	}
	for (let i = 0; i < array2.length; i++) {
		if (a[array2[i]]) {
			delete a[array2[i]];
		} else {
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
export function contains(base, part) {
	let parts = new Array();
	if (part instanceof Array) {
		parts = [...part];
	} else {
		parts.push(part);
	}
	for (const this_part of parts) {
		if (base.indexOf(this_part) !== -1) return true;
	}
	return false;
}

/**
 * Search for an image using Google Image Search.
 * @param {String} name
 * @param {{ratio: Number, minWidth: Number, minHeight: Number}} options
 * @returns {Promise<String>}
 */
export function searchImage(name, options) {
	return new Promise((resolve, reject) => {
		gis(name, async (error, results) => {
			if (error) reject(error);
			if (!Array.isArray(results)) resolve('');
			for (const result of results) {
				if (!result || !result.url) continue;
				const probe_result = await probe(result.url, { timeout: 10000 }).catch(e => void e);
				if (!probe_result) continue;
				const width = parseInt(probe_result.width);
				if (options.minWidth && width < options.minWidth) continue;
				const height = parseInt(probe_result.height);
				if (options.minHeight && height < options.minHeight) continue;
				const ratio = width / height;
				if (options.ratio && (ratio > options.ratio + 0.2 || ratio < options.ratio - 0.2)) continue;
				resolve(result.url);
			}
			resolve('');
		});
	});
}

/**
 * Generates a random color.
 * @param {{min?: number, max?: number}} options
 * @returns {Color}
 */
export function generateColor(options = {}) {
	options.min = options.min ?? 0;
	options.max = options.max ?? 255;

	function randomize() {
		const randomNumber = Math.random();
		const min_max = options.max - options.min;
		return Math.floor((randomNumber * min_max) + options.min);
	}

	return new Color({
		red: randomize(),
		green: randomize(),
		blue: randomize(),
	});
}

/**
 * Checks if an object is a promise.
 * @param {*} p
 * @returns {boolean}
 */
export function isPromise(p) {
	return p && Object.prototype.toString.call(p) === '[object Promise]';
}

/**
 * Gets all the file directories contained in the parent directory.
 * @param {String} dirPath
 * @param {String[]} arrayOfFiles
 * @returns
 */
export function getAllFiles(dirPath, arrayOfFiles = []) {
	const files = fs.readdirSync(dirPath);
	files.forEach(function(file) {
		if (fs.statSync(dirPath + '/' + file).isDirectory()) {
			arrayOfFiles = getAllFiles(dirPath + '/' + file, arrayOfFiles);
		} else {
			arrayOfFiles.push(path.join(dirPath, '/', file));
		}
	});
	return arrayOfFiles;
}

export {
	ProcessQueue,
	ErrorTicketManager,
	constants,
};