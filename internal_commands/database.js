const { MessageEmbed } = require('discord.js');

let client, notifications = new Array();

// Initialize module
const init = async function (this_client) {
    client = this_client;
}
// Notification Region
const pushNotification = async function (notification) {
    notifications.push(notification);
}
const hasRecords = function (notification) {
    try {
        let similarity_threshold = 70, highest_similarity = 0;
        for (let this_notification of notifications) {
            let this_similarity = similarity(this_notification.title, notification.title);
            if (this_similarity >= similarity_threshold) {
                return true;
            } else if (this_similarity >= highest_similarity) {
                highest_similarity = this_similarity;
            }
        }
        return highest_similarity >= similarity_threshold;

        function similarity(s1, s2) {
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
    } catch (error) {
        let embed = new MessageEmbed()
            .setAuthor(`Has Records`)
            .setTitle(`Database.js Error`)
            .setDescription(`An error occured while performing hasRecords function on database.js.`)
            .addField('Error Message', error)
            .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Antu_dialog-error.svg/1024px-Antu_dialog-error.svg.png')
            .setColor('#FF0000');

        g_interface.log(embed);
        console.log(`An error occured while performing hasRecords function on database.js.`);
        console.log(`\n${error}\n`);
    }
}

// Database Module Functions
module.exports = {
    init,
    pushNotification,
    hasRecords
}