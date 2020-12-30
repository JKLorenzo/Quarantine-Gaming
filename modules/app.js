const { CommandoClient } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');
const constants = require('./constants.js');
const functions = require('./functions.js');
const message = require('./message.js');
const error_manager = require('./error_manager.js');
const role = require('./role.js');

let global_client = new CommandoClient();
let initialized = false;

const error_ticket = error_manager.for('app.js');

module.exports = {
    isInitialized: initialized,
    client: global_client,
    guild: global_client.guilds.cache.get(constants.guild),
    channel: function (resolvable) {
        return global_client.channels.resolve(resolvable);
    },
    role: function (resolvable) {
        return global_client.roles.resolve(resolvable);
    },
    member: function (user) {
        return global_client.member(user);
    },
    setActivity: function (value, type = 'LISTENING') {
        return global_client.user.setActivity(value.trim(), {
            type: type.trim().toUpperCase()
        });
    },
    initialize: async function (client) {
        try {
            global_client = client;

            await this.setActivity('!help');

            // Dedicated Channels
            for (const dedicated_channel of this.channel(constants.channels.category.dedicated).children) {
                if (dedicated_channel.type == 'text') {
                    const linked_data = dedicated_channel.topic.split(' ');
                    const voice_channel = this.channel(linked_data[0]);
                    const text_role = this.role(linked_data[1]);
                    const team_role = this.role(linked_data[2]);

                    for (const this_member of voice_channel.members.array()) {
                        // Give text role
                        if (!this_member.user.bot && !this_member.roles.cache.has(text_role.id)) {
                            await role.add(this_member, text_role).catch(error => error_manager.mark(new error_ticket(`add text_role to ${this_member}`, error, 'initialize')));
                        }
                        // Give team role
                        if (!this_member.user.bot && !this_member.roles.cache.has(team_role.id)) {
                            await role.add(this_member, team_role).catch(error => error_manager.mark(new error_ticket(`add team_role to ${this_member}`, error, 'initialize')));
                        }
                        // Hide other dedicated channels
                        if (!this_member.user.bot && !this_member.roles.cache.has(constants.roles.dedicated)) {
                            await role.add(this_member, constants.roles.dedicated).catch(error => error_manager.mark(new error_ticket(`add dedicated_role to ${this_member}`, error, 'initialize')));
                        }
                    }

                    for (const this_member of this.guild.members.cache.array()) {
                        if (!this_member.user.bot) {
                            if (this_member.roles.cache.has(text_role.id)) {
                                // Remove roles related to dedicated channels
                                if (!this_member.voice || this_member.voice.channelID != voice_channel.id) {
                                    await role.remove(this_member, text_role).catch(error => error_manager.mark(new error_ticket(`remove text_role from ${this_member}`, error, 'initialize')));
                                    await role.remove(this_member, team_role).catch(error => error_manager.mark(new error_ticket(`remove team_role from ${this_member}`, error, 'initialize')));
                                }
                            }

                            if (this_member.roles.cache.has(constants.roles.dedicated)) {
                                // Show all active dedicated channels
                                if (!this_member.voice || !this_member.voice.channel || this_member.voice.channel.parent != constants.channels.category.dedicated) {
                                    await role.remove(this_member, constants.roles.dedicated).catch(error => error_manager.mark(new error_ticket(`remove dedicated_role from ${this_member}`, error, 'initialize')));
                                }
                            }
                        }
                    }
                }
            }

            if (process.env.STARTUP_REASON) {
                const embed = new MessageEmbed();
                embed.setColor('#ffff00');
                embed.setAuthor('Quarantine Gaming', client.user.displayAvatarURL());
                embed.setTitle('Startup Initiated');
                embed.addField('Reason', process.env.STARTUP_REASON);

                await message.sendToChannel(constants.channels.qg.logs, embed);
            }

            console.log('Initialized');
            initialized = true;
        } catch (error) {
            error_manager.mark(new error_ticket('initialize', error));
        }
    }
}