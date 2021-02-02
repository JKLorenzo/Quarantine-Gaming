const Discord = require('discord.js');
const { Command } = require('discord.js-commando');
const constants = require('../../modules/constants.js');
/** @type {import('../../modules/app.js')} */
let app;

module.exports = class CheckRole extends Command {
    constructor(client) {
        super(client, {
            name: 'checkrole',
            group: 'management',
            memberName: 'checkrole',
            description: '[Mod] Gets the permissions of a member or a role in a channel.',
            guildOnly: true,
            args: [
                {
                    key: 'Channel',
                    prompt: 'Mention the target channel/ID.',
                    type: 'string',
                    validate: Channel => {
                        // Link
                        app = this.client.modules.app;

                        if (app.channel(Channel))
                            return true;
                        return false;
                    }
                },
                {
                    key: 'MemberOrRole',
                    prompt: 'Mention the member/ID or role/ID you want to check.',
                    type: 'string',
                    validate: MemberOrRole => {
                        let isValid = false;
                        for (const this_MemberOrRole of String(MemberOrRole).split(' ')) {
                            if (app.member(this_MemberOrRole) || app.role(this_MemberOrRole)) {
                                isValid = true;
                                break;
                            }
                        }
                        return isValid;
                    }
                }
            ]
        });
    }

    /**
     * @param {Discord.Message} message 
     * @param {{Channel: Discord.ChannelResolvable, MemberOrRole: String}} 
     */
    async run(message, { Channel, MemberOrRole }) {
        // Check user permissions
        if (!app.hasRole(message.author, [constants.roles.staff, constants.roles.moderator])) {
            return message.reply("You don't have permissions to use this command.");
        }

        const this_channel = app.channel(Channel);
        for (const this_MemberOrRole of MemberOrRole.split(' ')) {
            const this_object = app.member(this_MemberOrRole) || app.role(this_MemberOrRole);
            if (!this_object) continue;
            const object_permissions = this_channel.permissionsFor(this_object);
            const embed = new Discord.MessageEmbed();
            embed.setAuthor('Quarantine Gaming: Bitwise Permission Flags');
            embed.setTitle('Channel Permissions')
            embed.setDescription(`${this_object} permissions on ${this_channel} channel.`);
            // General Permissions
            const general_permissions = new Array();
            for (const this_permission of Object.entries(constants.permissions.general)) {
                general_permissions.push({
                    name: this_permission[0].split('_').map(text => text.substring(0, 1).toUpperCase() + text.slice(1).toLowerCase()).join(' '),
                    value: object_permissions.has(this_permission[1])
                });
            }
            embed.addField('General Category Permissions', general_permissions.map(permission => `${permission.name}: ${permission.value ? '✅' : '❌'}`).join('\n'));
            // Type-Specific Permissions
            const type_specific_permissions = new Array();
            switch (this_channel.type) {
                case 'text':
                    for (const this_permission of Object.entries(constants.permissions.text)) {
                        type_specific_permissions.push({
                            name: this_permission[0].split('_').map(text => text.substring(0, 1).toUpperCase() + text.slice(1).toLowerCase()).join(' '),
                            value: object_permissions.has(this_permission[1])
                        });
                    }
                    embed.addField('Text Channel Permissions', type_specific_permissions.map(permission => `${permission.name}: ${permission.value ? '✅' : '❌'}`).join('\n'));
                    break;
                case 'voice':
                    for (const this_permission of Object.entries(constants.permissions.voice)) {
                        type_specific_permissions.push({
                            name: this_permission[0].split('_').map(text => text.substring(0, 1).toUpperCase() + text.slice(1).toLowerCase()).join(' '),
                            value: object_permissions.has(this_permission[1])
                        });
                    }
                    embed.addField('Voice Channel Permissions', type_specific_permissions.map(permission => `${permission.name}: ${permission.value ? '✅' : '❌'}`).join('\n'));
                    break;
            }
            embed.setFooter(`Channel ID: ${this_object.id}`);
            embed.setTimestamp();
            embed.setColor('#ffff00');
            message.say(embed);
        }
    }
};