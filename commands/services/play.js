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
                    key: 'input',
                    prompt: "[Optional] Enter the number of players you're looking for, including yourself. (Range: 2 - 25; Default: 0)\n\nor\n\n[Optional] Mention the user/users you want to reserve. The mentioned user/users will automatically be added to your bracket without needing them to react.\n\nor\n\nBoth.",
                    type: 'string',
                    default: '0'
                }
            ]
        });
    }

    async run(message, { role, input }) {
        message.delete({ timeout: 3600000 }).catch(error => { });
        const role_id = `${role}`.substring(3, `${role}`.length - 1);
        const this_role = g_channels.get().guild.roles.cache.find(role => role.id == role_id);
        const this_member = g_channels.get().guild.member(message.author);
        function parse(string) {
            const parsed = parseInt(string, 10);
            if (isNaN(parsed)) return 0;
            return parsed;
        }
        const args = input.split(' ');
        let count = parse(args[0]);
        const reserved = args.map(arg => {
            if (arg.startsWith('<@') && arg.endsWith('>')) {
                return arg + ' ';
            } else {
                return '';
            }
        }).join('');
        if (count < 2) count = 0;
        g_coordinator.invite(this_role, this_member, count, reserved);
        return message.say(`Got it! This bracket will be available on the ${g_channels.get().gaming} channel.`).then(message => message.delete({ timeout: 3600000 }).catch(error => { })).catch(error => { });
    }
};