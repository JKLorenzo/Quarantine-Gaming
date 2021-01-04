const gis = require('g-i-s');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function createManager(timeout) {
    return {
        processID: 0,
        currentID: 0,

        queue: function () {
            const id = this.processID++;
            return new Promise(async resolve => {
                while (id != this.currentID) await sleep(1000);
                resolve();
            });
        },
        finish: function () {
            setTimeout(() => {
                this.currentID++;
            }, timeout);
        }
    };
}

module.exports = {
    sleep: sleep,
    createStructure: function (properties) {
        const property = properties.split(' ');
        const count = properties.length;
        function constructor() {
            for (let i = 0; i < count; i++) {
                this[property[i]] = arguments[i];
            }
        }
        return constructor;
    },
    createManager: createManager,
    compareDate: function (date) {
        const today = new Date();
        const diffMs = (today - date);
        return {
            days: Math.floor(diffMs / 86400000),
            hours: Math.floor((diffMs % 86400000) / 3600000),
            minutes: Math.round(((diffMs % 86400000) % 3600000) / 60000)
        };
    },
    compareArray: function (array1, array2) {
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
    },
    compareString: function (string1, string2) {
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
    },
    toAlphanumericString: function (string) {
        return String(string).replace(/[^a-z0-9]/gi, '')
    },
    toCountingInteger: function (string) {
        const parsed = parseInt(string, 10);
        if (isNaN(parsed)) return 0;
        return parsed;
    },
    parseHTML: function (string) {
        return String(string).replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"');
    },
    parseModules: function (t_GlobalModules) {
        const modules = t_GlobalModules();
        return {
            app: modules.app,
            channel_manager: modules.channel_manager,
            database: modules.database,
            error_manager: modules.error_manager,
            general: modules.general,
            message_manager: modules.message_manager,
            reaction_manager: modules.reaction_manager,
            role_manager: modules.role_manager,
            speech: modules.speech
        }
    },
    parseMention: function (string) {
        return String(string).replace(/\W/g, '');
    },
    contains: function (whole_string, part_string) {
        return String(whole_string).toLowerCase().indexOf(String(part_string).toLowerCase()) !== -1;
    },
    fetchIcon: function (hostname) {
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
    },
    fetchImage: function (title) {
        return new Promise((resolve, reject) => {
            gis(title, (error, results) => {
                if (error)
                    reject(error);
                else
                    resolve(results);
            });
        });
    }
}