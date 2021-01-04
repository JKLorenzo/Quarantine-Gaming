const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');
const functions = require('../../modules/functions.js');
const constants = require('../../modules/constants.js');
let app = require('../../modules/app.js');

module.exports = class CheckRole extends Command {
    constructor(client) {
        super(client, {
            name: 'checkrole',
            group: 'management',
            memberName: 'checkrole',
            description: '[Admin Only] Gets the permissions of a member or a role in a channel.',
            guildOnly: true,
            args: [
                {
                    key: 'MemberOrRole',
                    prompt: 'Mention the member/ID or role/ID you want to check.',
                    type: 'string',
                    validate: MemberOrRole => {
                        // Link
                        const Modules = functions.parseModules(GlobalModules);
                        app = Modules.app;

                        MemberOrRole = functions.parseMention(MemberOrRole);
                        if (app.member(MemberOrRole) || app.role(MemberOrRole))
                            return true;
                        return false;
                    }
                },
                {
                    key: 'Channel',
                    prompt: 'Mention the target channel/ID.',
                    type: 'string',
                    validate: Channel => {
                        Channel = functions.parseMention(Channel);
                        if (app.channel(Channel))
                            return true;
                        return false;
                    }
                }
            ]
        });
    }

    async run(message, { MemberOrRole, Channel }) {
        // Parse Mentions
        MemberOrRole = functions.parseMention(MemberOrRole);
        const this_object = app.member(MemberOrRole) || app.role(MemberOrRole);
        const this_channel = app.channel(functions.parseMention(Channel));

        const object_permissions = this_channel.permissionsFor(this_object);
        const embed = new MessageEmbed();
        embed.setAuthor('Quarantine Gaming: Bitwise Permission Flags');
        embed.setTitle('Channel Permissions')
        embed.setDescription(`${this_object} permissions on ${this_channel} channel.`);
        // General Permissions
        let permissions = new Array();
        for (const this_permission of Object.entries(constants.permissions.general)) {
            permissions.push({
                name: this_permission[0].split('_').map(text => text.substring(0, 1).toUpperCase() + text.slice(1).toLowerCase()).join(' '),
                value: object_permissions.has(this_permission[1])
            });
        }
        embed.addField('General Category Permissions', permissions.map(permission => `${permission.name}: ${permission.value ? '✅' : '❌'}`).join('\n'));
        // Type-Specific Permissions
        permissions = new Array();
        switch (this_channel.type) {
            case 'text':
                for (const this_permission of Object.entries(constants.permissions.text)) {
                    permissions.push({
                        name: this_permission[0].split('_').map(text => text.substring(0, 1).toUpperCase() + text.slice(1).toLowerCase()).join(' '),
                        value: object_permissions.has(this_permission[1])
                    });
                }
                embed.addField('Text Channel Permissions', permissions.map(permission => `${permission.name}: ${permission.value ? '✅' : '❌'}`).join('\n'));
                break;
            case 'voice':
                for (const this_permission of Object.entries(constants.permissions.voice)) {
                    permissions.push({
                        name: this_permission[0].split('_').map(text => text.substring(0, 1).toUpperCase() + text.slice(1).toLowerCase()).join(' '),
                        value: object_permissions.has(this_permission[1])
                    });
                }
                embed.addField('Voice Channel Permissions', permissions.map(permission => `${permission.name}: ${permission.value ? '✅' : '❌'}`).join('\n'));
                break;
        }
        embed.setTimestamp();
        embed.setColor('#ffff00');
        message.say(embed);
    }
};