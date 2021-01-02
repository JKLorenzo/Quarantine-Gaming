const { Command } = require('discord.js-commando');
const functions = require('../../modules/functions.js');
const constants = require('../../modules/constants.js');
let app = require('../../modules/app.js');
let general = require('../../modules/general.js');

module.exports = class PlayCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'play',
            group: 'services',
            memberName: 'play',
            description: 'Invite members to play a game.',
            guildOnly: true,
            args: [
                {
                    key: 'role',
                    prompt: "Mention the play role you want to play.",
                    type: 'role',
                    validate: role => {
                        // Link
                        const modules = functions.parseModules(GlobalModules);
                        app = modules.app;
                        general = modules.general;

                        const game_role = app.role(role);
                        if (game_role) {
                            return game_role.hexColor == '#00fffe' && functions.contains(game_role.name, ' ⭐');
                        } else {
                            return false;
                        }
                    }
                },
                {
                    key: 'input',
                    prompt: "[Optional] Enter the number of players you're looking for, including yourself. (Range: 2 - 25; Default: 0)\n\nor\n\n[Optional] Mention the user/users you want to reserve. The mentioned user/users will automatically be added to your bracket without needing them to react.\n\nor\n\nBoth.",
                    type: 'string',
                    default: '0'
                }
            ]
        });
    }

    async run(message, { role, input }) {
        const game_role = app.role(role);
        const member = app.member(message.author);

        const args = input.split(' ');
        let count = 0;
        let reserved = new Array();
        for (const arg of args) {
            if (app.member(arg)) {
                reserved.push(arg);
            } else if (!(functions.contains(arg, '<') || functions.contains(arg, '>')) && functions.toCountingInteger(arg) >= 2) {
                count = functions.toCountingInteger(arg);
            }
        }

        general.gameInvite(game_role, member, count, reserved.join(' '));
        message.say(`Got it! This bracket will be available on the ${app.channel(constants.channels.integrations.game_invites)} channel.`).then(message => message.delete({ timeout: 3600000 }).catch(() => { })).catch(() => { });
    }
};