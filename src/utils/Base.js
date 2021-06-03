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
 * @param {string} html The html to parse
 * @returns {string}
 */
export function parseHTML(html) {
  return String(html)
    .replace('&amp;', '&')
    .replace('&lt;', '<')
    .replace('&gt;', '>')
    .replace('&quot;', '"');
}

/**
 * Filters out symbols used to signify a mentioned object.
 * @param {string} mention The mentioned object.
 * @returns {string} Mentioned ID
 */
export function parseMention(mention) {
  return String(mention).replace(/\W/g, '');
}

/**
 * Gets the similarity percentage
 * @param {string} string1 The first string to compare
 * @param {string} string2 The second string to compare
 * @returns {number} Ranges from 0 - 100
 */
export function getPercentSimilarity(string1, string2) {
  let longer_string = string1;
  let shorter_string = string2;

  if (string1.length < string2.length) {
    longer_string = string2;
    shorter_string = string1;
  }

  if (longer_string.length === 0 || shorter_string.length === 0) return 0;

  const costs = [];
  for (let i = 0; i <= longer_string.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= shorter_string.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (longer_string.charAt(i - 1) !== shorter_string.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[shorter_string.length] = lastValue;
  }

  return (
    100 *
    ((longer_string.length - costs[shorter_string.length]) /
      longer_string.length)
  );
}

/**
 * Gets the date difference
 * @param {Date} date The date to compare
 * @typedef {Object} DateDifference
 * @property {number} days
 * @property {number} hours
 * @property {number} minutes
 * @property {number} totalMinutes
 * @property {string} estimate
 * @returns {DateDifference}
 */
export function compareDate(date) {
  const today = new Date();
  const diffMs = today - date;
  const days = Math.floor(diffMs / 86400000);
  const hours = Math.floor((diffMs % 86400000) / 3600000);
  const minutes = Math.round(((diffMs % 86400000) % 3600000) / 60000);
  return {
    days: days,
    hours: hours,
    minutes: minutes,
    totalMinutes: Math.round(diffMs / 60000),
    estimate: humanizeDuration(diffMs, { largest: 1, round: true }),
  };
}

/**
 * Returns an array of unique elements
 * @param {string[]} array1 An array of string
 * @param {string[]} array2 An array of string
 * @returns {string[]}
 */
export function compareArray(array1, array2) {
  const a = [],
    difference = [];
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
 * @param {string} base The base string
 * @param {string | string[]} part The string to check from the base string
 * @returns {boolean}
 */
export function contains(base, part) {
  let parts = [];
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
 * @param {string} name The keyword to search for
 * @param {{ratio: number, minWidth: number, minHeight: number}} options The image options
 * @returns {Promise<string>}
 */
export function searchImage(name, options) {
  return new Promise((resolve, reject) => {
    gis(name, async (error, results) => {
      if (error) reject(error);
      if (!Array.isArray(results)) resolve();
      for (const result of results) {
        if (!result || !result.url) continue;
        /*  eslint-disable no-empty-function */
        const probe_result = await probe(result.url, {
          timeout: 10000,
          retries: 3,
        }).catch(() => {});
        if (!probe_result) continue;
        const width = parseInt(probe_result.width);
        if (options.minWidth && width < options.minWidth) continue;
        const height = parseInt(probe_result.height);
        if (options.minHeight && height < options.minHeight) continue;
        const ratio = width / height;
        if (
          options.ratio &&
          (ratio > options.ratio + 0.2 || ratio < options.ratio - 0.2)
        ) {
          continue;
        }
        resolve(result.url);
      }
      resolve();
    });
  });
}

/**
 * Generates a random color.
 * @param {Options} options The options for generation
 * @typedef {Object} Options
 * @property {number} [min]
 * @property {number} [max]
 * @returns {Color}
 */
export function generateColor(options = {}) {
  options.min = options.min ?? 0;
  options.max = options.max ?? 255;

  function randomize() {
    const randomNumber = Math.random();
    const min_max = options.max - options.min;
    return Math.floor(randomNumber * min_max + options.min);
  }

  return new Color({
    red: randomize(),
    green: randomize(),
    blue: randomize(),
  });
}

/**
 * Checks if an object is a promise.
 * @param {*} object Checks if this object is a promise
 * @returns {boolean}
 */
export function isPromise(object) {
  return (
    object && Object.prototype.toString.call(object) === '[object Promise]'
  );
}

/**
 * Gets all the file directories contained in the parent directory.
 * @param {string} dirPath The base path of where the files will be fetched
 * @param {String[]} [arrayOfFiles] The file paths
 * @returns {string[]}
 */
export function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach(file => {
    if (fs.statSync(`${dirPath}/${file}`).isDirectory()) {
      arrayOfFiles = getAllFiles(`${dirPath}/${file}`, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, '/', file));
    }
  });
  return arrayOfFiles;
}

export { ProcessQueue, ErrorTicketManager, constants };
