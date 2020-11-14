const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');

module.exports = class CheckRole extends Command {
    constructor(client) {
        super(client, {
            name: 'checkrole',
            group: 'management',
            memberName: 'checkrole',
            description: '[Admin Only] Gets the permissions of a role in the target channel.',
            guildOnly: true,
            args: [
                {
                    key: 'role',
                    prompt: 'Mention the role you want to check.',
                    type: 'role'
                },
                {
                    key: 'channel',
                    prompt: 'Mention the channel.',
                    type: 'channel'
                }
            ]
        });
    }

    async run(message, { role, channel }) {
        message.delete({ timeout: 60000 }).catch(error => { });

        let permissions = g_channels.get().guild.channels.cache.get(channel.id).permissionsFor(role);
        const generalPermissions = [
            'CREATE_INSTANT_INVITE', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 'MANAGE_WEBHOOKS'
        ]
        const textPermissions = [
            'VIEW_CHANNEL', 'SEND_MESSAGES', 'SEND_TTS_MESSAGES', 'MANAGE_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES', 'READ_MESSAGE_HISTORY', 'MENTION_EVERYONE', 'USE_EXTERNAL_EMOJIS', 'ADD_REACTIONS'
        ]
        const voicePermissions = [
            'VIEW_CHANNEL', 'CONNECT', 'SPEAK', 'STREAM', 'MUTE_MEMBERS', 'DEAFEN_MEMBERS', 'MOVE_MEMBERS', 'PRIORITY_SPEAKER'
        ]

        let output = new Array();
        for (let this_permission of generalPermissions) {
            output.push({
                name: this_permission.split('_').map(text => text.substring(0, 1).toUpperCase() + text.slice(1).toLowerCase()).join(' '),
                value: permissions.has(this_permission)
            });
        }
        switch (channel.type) {
            case 'text':
                for (let this_permission of textPermissions) {
                    output.push({
                        name: this_permission.split('_').map(text => text.substring(0, 1).toUpperCase() + text.slice(1).toLowerCase()).join(' '),
                        value: permissions.has(this_permission)
                    });
                }
                break;
            case 'voice':
                for (let this_permission of voicePermissions) {
                    output.push({
                        name: this_permission.split('_').map(text => text.substring(0, 1).toUpperCase() + text.slice(1).toLowerCase()).join(' '),
                        value: permissions.has(this_permission)
                    });
                }
                break;
        }
        let embed = new MessageEmbed();
        embed.setTitle(`**${role.name} Role**`);
        embed.setDescription(output.map(data => `${data.name}: ${data.value ? '✅' : '❌'}`));
        embed.setAuthor('Quarantine Gaming: Role Information', g_client.user.displayAvatarURL());
        embed.setFooter(`On ${channel.name} channel`);
        embed.setTimestamp(new Date());
        return message.say(embed).catch(() => { });;
    }
};