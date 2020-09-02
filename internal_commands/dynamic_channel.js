const { MessageEmbed } = require('discord.js');
let client;
const vr_prefix = 'Play ';
async function updateGuild() {
    // Transfer members from generic voice rooms to dynamic voice rooms
    for (let this_channel of g_interface.get('guild').channels.cache.array()) {
        if (this_channel.type == 'voice' && this_channel.name.startsWith('Voice Room')) {
            if (this_channel.members.size > 1) {
                // Get baseline activity
                let baseline_role;
                for (let this_member of this_channel.members.array()) {
                    let member_roles = new Array();
                    if (!baseline_role) {
                        for (let this_role of this_member.roles.cache.array()) {
                            if (this_role.name.startsWith('Play')) {
                                member_roles.push(this_role);
                            }
                        }
                        if (member_roles.length == 1) {
                            baseline_role = member_roles.pop();
                        }
                    }
                }
                if (baseline_role) {
                    // Check if all members have the same activity
                    let same_acitivities = true;
                    for (let this_member of this_channel.members.array()) {
                        if (same_acitivities && !this_member.roles.cache.find(role => role == baseline_role)) {
                            same_acitivities = false;
                        }
                    }
                    // Check if all members are playing more than 5 minutes
                    let are_playing = true;
                    for (let this_member of this_channel.members.array()) {
                        for (let this_activity of this_member.presence.activities) {
                            if (this_activity.name == baseline_role.name.substring(vr_prefix.length)) {
                                let today = new Date();
                                let diffMins = Math.round((today - this_activity.createdAt) / 60000); // minutes
                                if (diffMins < 5) {
                                    are_playing = false;
                                }
                            }
                        }
                    }

                    if (same_acitivities && are_playing) {
                        // Create
                        await g_interface.get('guild').channels.create(baseline_role.name, {
                            type: 'voice',
                            topic: `Voice room dedicated for ${baseline_role.name.substring(vr_prefix.length)} players.`,
                            reason: `${baseline_role.name.substring(vr_prefix.length)} is being played by members in a voice room.`,
                            parent: g_interface.get('guild').channels.cache.find(channel => channel.name.toLowerCase() == 'dedicated voice channels').id,
                            permissionOverwrites: [
                                {
                                    id: g_interface.get('guild').roles.everyone.id,
                                    deny: ["CONNECT"]
                                },
                                {
                                    id: g_interface.get('guild').roles.cache.find(role => role.name.toLowerCase() == 'music bots').id,
                                    allow: ["CONNECT"]
                                },
                                {
                                    id: baseline_role.id,
                                    allow: ["CONNECT"]
                                }
                            ]
                        }).then(async channel => {
                            // Transfer
                            for (let this_member of this_channel.members.array()) {
                                await this_member.voice.setChannel(channel).catch(console.error);
                            }
                        }).catch(console.error);
                    }
                }
            }
        }
    }

    setTimeout(async function () {
        // Repeat
        updateGuild();
    }, 30000)
}

// External Functions Region
const init = function (this_client) {
    // Set the commando client instance
    client = this_client;
    updateGuild();
}

// Interface Module Functions
module.exports = {
    init
}