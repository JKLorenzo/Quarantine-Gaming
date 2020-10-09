const { Command } = require('discord.js-commando');

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
                        let role_id = `${role}`.substring(3, `${role}`.length - 1);
                        let this_role = g_channels.get().guild.roles.cache.find(role => role.id == role_id);
                        if (this_role) {
                            return this_role.hexColor == '#00ffff'
                        } else {
                            return false;
                        }

                    }
                },
                {
                    key: 'count',
                    prompt: "[Optional] Enter the number of players you're looking for, including yourself. (Range: 2 - 25; Default: 0)",
                    type: 'integer',
                    default: 0,
                    validate: count => (count > 1 && count < 26) || count == 0
                },
                {
                    key: 'reserved',
                    prompt: "[Optional] Mention the user/users you want to reserve.",
                    type: 'string',
                    default: ''
                }
            ]
        });
    }

    async run(message, { role, count, reserved }) {
        message.delete({ timeout: 60000 }).catch(error => { });
        let role_id = `${role}`.substring(3, `${role}`.length - 1);
        let this_role = g_channels.get().guild.roles.cache.find(role => role.id == role_id);
        let this_member = g_channels.get().guild.member(message.author);
        g_coordinator.invite(this_role, this_member, count, reserved);
    }
};