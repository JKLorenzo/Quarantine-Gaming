const gis = require('g-i-s');

const sleep = function (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const setActivity = function (text) {
    // Set the bot's activity
    g_client.user.setActivity(text, {
        type: 'LISTENING'
    }).catch(error => {
        g_interface.on_error({
            name: 'setActivity -> .setActivity(text)',
            location: 'functions.js',
            error: error
        });
    });
}

const string_similarity = function (s1, s2) {
    let longer = s1;
    let shorter = s2;
    if (s1.length < s2.length) {
        longer = s2;
        shorter = s1;
    }
    let longerLength = longer.length;
    if (longerLength == 0) {
        return 100;
    }

    let costs = new Array();
    for (let i = 0; i <= longer.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= shorter.length; j++) {
            if (i == 0)
                costs[j] = j;
            else {
                if (j > 0) {
                    let newValue = costs[j - 1];
                    if (longer.charAt(i - 1) != shorter.charAt(j - 1)) {
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    }
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0) costs[shorter.length] = lastValue;
    }

    return 100 * ((longerLength - costs[shorter.length]) / longerLength);
}

const array_difference = function (a1, a2) {
    let a = [], diff = [];
    for (let i = 0; i < a1.length; i++) {
        a[a1[i]] = true;
    }
    for (let i = 0; i < a2.length; i++) {
        if (a[a2[i]]) {
            delete a[a2[i]];
        } else {
            a[a2[i]] = true;
        }
    }
    for (let k in a) {
        diff.push(k);
    }
    return diff;
}

const string_to_int = function (string) {
    const parsed = parseInt(string, 10);
    if (isNaN(parsed)) return 0;
    return parsed;
}

let invites_list = new Array();
const getInviter = async function () {
    let invite_changes = new Array();
    await g_channels.get().guild.fetchInvites().then(invites => {
        for (let invite of invites) {
            let the_invite = invites_list.find(this_invite => this_invite.code == invite[1].code);
            if (!the_invite) {
                // Add to list
                invites_list.push(invite[1]);
                // Add to changes
                if (invite[1].uses > 0) {
                    invite_changes.push(invite[1]);
                }
            } else if (the_invite.uses != invite[1].uses) {
                // Add to changes
                invite_changes.push(invite[1]);
                // Replace
                invites_list.splice(invites_list.indexOf(the_invite), 1, invite[1]);
            }
        }
    }).catch(error => {
        g_interface.on_error({
            name: 'getInviter -> .fetchInvites()',
            location: 'functions.js',
            error: error
        });
    });
    return invite_changes;
}

const htmlEntities = function (str) {
    return String(str).replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"');
}

const getIcon = function (hostname) {
    function contains(word) {
        return hostname.toLowerCase().indexOf(word) !== -1;
    }
    let icon_url = '';
    if (contains('reddit')) {
        icon_url = 'https://image.flaticon.com/icons/png/512/355/355990.png';
    } else if (contains('steam')) {
        icon_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Steam_icon_logo.svg/1024px-Steam_icon_logo.svg.png';
    } else if (contains('epicgames')) {
        icon_url = 'https://cdn2.unrealengine.com/EpicGames%2Fno-exist-576x576-5c7c5c6c4edc402cbd0d369cf7dd2662206b4657.png';
    } else if (contains('gog')) {
        icon_url = 'https://static.techspot.com/images2/downloads/topdownload/2016/12/gog.png';
    } else if (contains('playstation')) {
        icon_url = 'https://lh3.ggpht.com/pYDuCWSs7TIopjHX_i89et1C6zyk82iRZKAiWe8yJt5KNXp-B2ZuK7KHydkpaQmAnV0=w300';
    } else if (contains('xbox')) {
        icon_url = 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/i/0428cd5e-b1ca-4c7c-8d6a-0b263465bfe0/d4hcb91-d614c470-8051-43ef-ab75-18100a527bd1.png';
    } else if (contains('ubisoft')) {
        icon_url = 'https://vignette.wikia.nocookie.net/ichc-channel/images/e/e2/Ubisoft_round_icon_by_slamiticon-d66j9vs.png/revision/latest/scale-to-width-down/220?cb=20160328232011';
    } else if (contains('microsoft')) {
        icon_url = 'https://cdn0.iconfinder.com/data/icons/shift-free/32/Microsoft-512.png';
    } else if (contains('discord')) {
        icon_url = 'https://i1.pngguru.com/preview/373/977/320/discord-for-macos-white-and-blue-logo-art.jpg';
    } else {
        icon_url = `http://www.google.com/s2/favicons?domain=${hostname}`;
    }
    return icon_url;
}
const image_search = function (name) {
    return new Promise(function (resolve, reject) {
        gis(name, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        })
    })
}

module.exports = {
    sleep,
    setActivity,
    string_similarity,
    array_difference,
    string_to_int,
    getInviter,
    htmlEntities,
    getIcon,
    image_search
}