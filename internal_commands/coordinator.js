const { MessageEmbed } = require('discord.js');

let client, coordinator_queue = new Array(), is_processing = false;

// Initialize module
const init = function (this_client) {
    client = this_client;
}

const queue = function (data) {
    coordinator_queue.push(data);

    if (!is_processing) {
        beginProcess();
    }
}

async function beginProcess() {
    is_processing = true;
    while (coordinator_queue.length > 0) {
        let this_data = coordinator_queue.shift();
        let status = this_data.status;
        let message = this_data.message;
        let member = this_data.member;
        let embed = message.embeds[0];

        let players = [];
        let max = embed.fields.length;
        let cur = 0;
        let has_caps = false;

        switch (status) {
            case 1:
                let inserted = false;
                for (let field of embed.fields) {
                    if (field.value != '\u200b') {
                        players.push(field.value);
                        cur++;
                        if (field.value.indexOf(member.id) !== -1) {
                            inserted = true;
                        }
                    }
                }

                embed = embed.spliceFields(0, max);
                if (embed.description.indexOf('is looking for') !== -1) {
                    has_caps = true;
                    for (let i = 1; i <= max; i++) {
                        if (i <= cur) {
                            embed.addField(`Player ${i}:`, players[i - 1]);
                        } else {
                            if (!inserted) {
                                embed.addField(`Player ${i}:`, member.toString());
                                players.push(member.toString());
                                inserted = true;
                            } else {
                                embed.addField(`Player ${i}:`, '\u200b');
                            }
                        }
                    }
                } else {
                    let i = 1;
                    for (i = 1; i <= cur; i++) {
                        embed.addField(`Player ${i}:`, players[i - 1]);
                    }
                    if (!inserted) {
                        embed.addField(`Player ${i}:`, member.toString());
                    }
                }
                break;
            case 0:
                for (let field of embed.fields) {
                    if (field.value && field.value != '\u200b' && !(field.value.indexOf(member.id) !== -1)) {
                        players.push(field.value);
                    }
                }

                embed = embed.spliceFields(0, max);
                if (embed.description.indexOf('is looking for') !== -1) {
                    has_caps = true;
                    for (let i = 1; i <= max; i++) {
                        if (i <= players.length) {
                            embed.addField(`Player ${i}:`, players[i - 1]);
                        } else {
                            embed.addField(`Player ${i}:`, '\u200b');
                        }
                    }
                } else {
                    for (let i = 1; i <= players.length; i++) {
                        embed.addField(`Player ${i}:`, players[i - 1]);
                    }
                }
                break;
        }
        if (status && has_caps && max == cur) {
            embed.setFooter('Closed. This bracket is now full.');
        }
        await message.edit(embed).then(async message => {
            if (status && has_caps && max == players.length) {
                await message.reactions.removeAll().catch(console.error);
                let inviter_id = players[0].substring(2, players[0].length - 1);
                let inviter = g_interface.get('guild').members.cache.find(member => member.id == inviter_id);
                if (inviter) {
                    g_interface.dm(inviter, `Your ${embed.title} bracket is now full.\n\n**Members:**\n${players.splice(1).join('\n')}`);
                }
            }
        }).catch(error => {
            g_interface.on_error({
                name: 'beginProcess -> .edit()',
                location: 'coordinator.js',
                error: error
            });
        });
    }
    is_processing = false;
}

// Database Module Functions
module.exports = {
    init,
    queue
}