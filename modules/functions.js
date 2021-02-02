const gis = require('g-i-s');

/**
 * Waits for the given amount of time.
 * @param {number} timeout Time in miliseconds.
 * @returns {Promise<null>} A Promise
 */
module.exports.sleep = (timeout) => {
    return new Promise(resolve => setTimeout(resolve, timeout));
};

/**
 * Creates an object with the given properties.
 * @param {String} properties The properties of an object seperated by spaces.
 * @returns {Object} Object with properties
 */
module.exports.createStructure = (properties) => {
    const property = properties.split(' ');
    const count = properties.length;
    function constructor() {
        for (let i = 0; i < count; i++) {
            this[property[i]] = arguments[i];
        }
    }
    return constructor;
}

/**
 * Gets the elapsed time of the given date.
 * @param {Date} date The date object to use.
 * @returns The time in days, hours, and minutes
 */
module.exports.compareDate = (date) => {
    const today = new Date();
    const diffMs = (today - date);
    return {
        days: Math.floor(diffMs / 86400000),
        hours: Math.floor((diffMs % 86400000) / 3600000),
        minutes: Math.round(((diffMs % 86400000) % 3600000) / 60000)
    };
}

/**
 * Gets the difference between 2 arrays.
 * @param {Array} array1 First array.
 * @param {Array} array2 Second array.
 * @returns {Array} The array difference
 */
module.exports.compareArray = (array1, array2) => {
    let a = [], difference = [];
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
    for (let k in a) {
        difference.push(k);
    }
    return difference;
}

/**
 * Gets the similarity percentage of two strings.
 * @param {*} string1 First string.
 * @param {*} string2 Second string.
 * @returns {Number} String similarity percentage
 */
module.exports.compareString = (string1, string2) => {
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
            if (i == 0)
                costs[j] = j;
            else {
                if (j > 0) {
                    let newValue = costs[j - 1];
                    if (longer_string.charAt(i - 1) != shorter_string.charAt(j - 1)) {
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    }
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0) costs[shorter_string.length] = lastValue;
    }

    return 100 * ((longer_string.length - costs[shorter_string.length]) / longer_string.length);
}

/**
 * Filters out non-Alphanumeric characters on a string.
 * @param {String} string String to filter.
 * @returns {String} Alphanumeric string
 */
module.exports.toAlphanumericString = (string) => {
    return String(string).replace(/[^a-zA-Z0-9 ]/gi, '')
}

/**
 * Parses a string to a positive integer.
 * @param {String} string String to parse.
 * @returns {Number} Positive integer
 */
module.exports.toCountingInteger = (string) => {
    const parsed = parseInt(string, 10);
    if (isNaN(parsed)) return 0;
    return parsed;
}

/**
 * Parses HTML entities to their string literals.
 * @param {String} html The HTML to parse.
 * @returns {String} Formatted String
 */
module.exports.parseHTML = (html) => {
    return String(html).replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"');
}

/**
 * Filters out symbols used to signify a mentioned object.
 * @param {String} mention The mentioned object.
 * @returns {String} Mentioned ID
 */
module.exports.parseMention = (mention) => {
    return String(mention).replace(/\W/g, '');
}

/**
 * Checks if the base string contains the part string.
 * @param {String} base The string where we search.
 * @param {String | Array<String>} part The string to search for.
 * @returns {Boolean} boolean
 */
module.exports.contains = (base, part) => {
    switch (typeof (part)) {
        case 'string':
            return String(base).toLowerCase().indexOf(String(part).toLowerCase()) !== -1;
        case 'object':
            for (const this_part of part) {
                if (String(base).toLowerCase().indexOf(String(this_part).toLowerCase()) !== -1)
                    return true;
            }
    }
    return false;
}

/**
 * Gets the favicon of a webpage.
 * @param {String} hostname The hostname of the webpage.
 * @returns {String} The url to the webpage's favicon
 */
module.exports.fetchIcon = (hostname) => {
    if (this.contains(hostname, 'reddit')) {
        return 'https://image.flaticon.com/icons/png/512/355/355990.png';
    } else if (this.contains(hostname, 'steam')) {
        return 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Steam_icon_logo.svg/1024px-Steam_icon_logo.svg.png';
    } else if (this.contains(hostname, 'epicgames')) {
        return 'https://cdn2.unrealengine.com/EpicGames%2Fno-exist-576x576-5c7c5c6c4edc402cbd0d369cf7dd2662206b4657.png';
    } else if (this.contains(hostname, 'gog')) {
        return 'https://static.techspot.com/images2/downloads/topdownload/2016/12/gog.png';
    } else if (this.contains(hostname, 'playstation')) {
        return 'https://lh3.ggpht.com/pYDuCWSs7TIopjHX_i89et1C6zyk82iRZKAiWe8yJt5KNXp-B2ZuK7KHydkpaQmAnV0=w300';
    } else if (this.contains(hostname, 'xbox')) {
        return 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/i/0428cd5e-b1ca-4c7c-8d6a-0b263465bfe0/d4hcb91-d614c470-8051-43ef-ab75-18100a527bd1.png';
    } else if (this.contains(hostname, 'ubisoft')) {
        return 'https://vignette.wikia.nocookie.net/ichc-channel/images/e/e2/Ubisoft_round_icon_by_slamiticon-d66j9vs.png/revision/latest/scale-to-width-down/220?cb=20160328232011';
    } else if (this.contains(hostname, 'microsoft')) {
        return 'https://cdn0.iconfinder.com/data/icons/shift-free/32/Microsoft-512.png';
    } else if (this.contains(hostname, 'discord')) {
        return 'https://i1.pngguru.com/preview/373/977/320/discord-for-macos-white-and-blue-logo-art.jpg';
    } else {
        return `http://www.google.com/s2/favicons?domain=${hostname}`;
    }
}

/**
 * Search for images using Google Image Search.
 * @param {String} title The search term to search for.
 * @returns {Promise<Array<String>>} A Promised Array of Image URLs
 */
module.exports.fetchImage = (title) => {
    return new Promise((resolve, reject) => {
        try {
            gis(title, (error, results) => {
                if (error)
                    reject(error);
                else
                    resolve(results);
            });
        } catch (error) {
            reject(error);
        }
    });
}