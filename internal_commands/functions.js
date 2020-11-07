const sleep = function (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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

module.exports = {
    sleep,
    string_similarity,
    array_difference,
    string_to_int,
    getInviter
}