const Discord = require('discord.js');
const { CommandoClient } = require('discord.js-commando');
const constants = require('./constants.js');
const functions = require('./functions.js');
const classes = require('./classes.js');
/** @type {import('./message_manager.js')} */
let message_manager;
/** @type {import('./error_manager.js')} */
let error_manager;
/** @type {import('./role_manager.js')} */
let role_manager;
/** @type {import('./database.js')} */
let database;
/** @type {import('./general.js')} */
let general;
/** @type {import('./channel_manager.js')} */
let channel_manager;

const ErrorTicketManager = new classes.ErrorTicketManager('app.js');

/** @type {CommandoClient} */
let client;

/** @type {Boolean} */
let initialized = false;

/** @type {Array<Discord.Invite>} */
const invites_list = new Array();

/**
 * Checks if the app is initialized.
 * @returns {Boolean} boolean
 */
module.exports.isInitialized = () => {
    return initialized;
}

/**
 * Gets the Commando Client Instance.
 * @returns {CommandoClient} CommandoClient object
 */
module.exports.client = () => {
    return client;
}

/**
 * Gets the Quarantine Gaming Guild.
 * @returns {Discord.Guild} Guild object
 */
module.exports.guild = () => {
    return this.client().guilds.cache.get(constants.guild);
}

/**
 * Resolves a Guild Channel Resolvable to a Guild Channel object.
 * @param {Discord.GuildChannelResolvable} GuildChannelResolvable A GuildChannel object or a Snowflake.
 * @returns {Discord.GuildChannel} GuildChannel object
 */
module.exports.channel = (GuildChannelResolvable) => {
    return this.guild().channels.resolve(GuildChannelResolvable) || this.guild().channels.resolve(functions.parseMention(GuildChannelResolvable));
}

/**
 * Resolves a Role Resolvable to a Role object.
 * @param {Discord.RoleResolvable} RoleResolvable A Role object or a Snowflake.
 * @returns {Discord.Role} Role Object
 */
module.exports.role = (RoleResolvable) => {
    return this.guild().roles.resolve(RoleResolvable) || this.guild().roles.resolve(functions.parseMention(RoleResolvable));
}

/**
 * Resolves a Message Resolvable to a Message object.
 * @param {Discord.GuildChannelResolvable} GuildChannelResolvable A GuildChannel object or a Snowflake.
 * @param {Discord.MessageResolvable} MessageResolvable  A Message object or a Snowflake.
 * @returns {Discord.Message} Message Object
 */
module.exports.message = (GuildChannelResolvable, MessageResolvable) => {
    /** @type {Discord.TextChannel} */
    const channel = this.channel(GuildChannelResolvable);
    if (channel)
        return channel.messages.resolve(MessageResolvable);
    return null;
}

/**
 * Resolves a User Resolvable to a Guild Member object.
 * @param {Discord.UserResolvable} UserResolvable A message object, a guild member object, a user object, or a Snowflake.
 * @returns {Discord.GuildMember} GuildMember Object
 */
module.exports.member = (UserResolvable) => {
    return this.guild().members.resolve(UserResolvable) || this.guild().members.resolve(functions.parseMention(UserResolvable));
}

/**
 * Sets the activity of this client.
 * @param {String} name The name of the activity.
 * @param {Discord.ActivityType} type The type of this activity.
 * @returns {Promise<Discord.Presence} A Presence Object Promise
 */
module.exports.setActivity = (name, type = 'LISTENING') => {
    return this.client().user.setActivity(name, {
        type: type
    });
}

/**
 * Checks if a member has one of the roles listed.
 * @param {Discord.UserResolvable} UserResolvable A message, a guild member object, a user object, or a Snowflake.
 * @param {Array<Discord.RoleResolvable>} RoleResolvables An array of Role objects or Snowflakes.
 * @returns {Boolean} boolean
 */
module.exports.hasRole = (UserResolvable, RoleResolvables) => {
    for (const RoleResolvable of RoleResolvables) {
        if (this.member(UserResolvable).roles.cache.has(this.role(RoleResolvable).id)) {
            return true;
        }
    }
    return false;
}

/**
 * Gets the used and updated invites.
 * @returns {Promise<Array<Discord.Invite>>} The array of discord invites that are used or updated.
 */
module.exports.getInvites = () => {
    return new Promise(async resolve => {
        /** @type {Array<Discord.Invite>} */
        const invite_changes = new Array();
        try {
            const guild_invites = (await this.guild().fetchInvites()).array();
            for (const invite of guild_invites) {
                const the_invite = invites_list.find(this_invite => this_invite.code == invite.code);
                if (!the_invite) {
                    // Add to list
                    invites_list.push(invite);
                    // Add to changes
                    if (invite.uses > 0) {
                        invite_changes.push(invite);
                    }
                } else if (the_invite.uses != invite.uses) {
                    // Add to changes
                    invite_changes.push(invite);
                    // Replace
                    invites_list.splice(invites_list.indexOf(the_invite), 1, [invite]);
                }
            }
            if (invite_changes.length == 0) {
                for (const deleted_invite_code of functions.compareArray(invites_list.map(invite => invite.code), guild_invites.map(invite => invite.code))) {
                    // Add to changes
                    invite_changes.push(invites_list.find(invite => invite.code = deleted_invite_code));
                    // Remove from invites list
                    invites_list.splice(invites_list.indexOf(deleted_invite_code), 1);
                }
            }
        } catch (error) {
            error_manager.mark(ErrorTicketManager.create('getInvites', error));
        }
        resolve(invite_changes);
    });
}

/**
 * Adds the invite to the invites list.
 * @param {Discord.Invite} new_invite The invite that was created.
 */
module.exports.addInvite = (new_invite) => {
    // Add to list
    invites_list.push(new_invite);
}

/**
 * Initializes the module.
 * @param {CommandoClient} ClientInstance The Commando Client instance used to login.
 */
module.exports.initialize = async (ClientInstance) => {
    // Link
    client = ClientInstance;
    message_manager = client.modules.message_manager;
    error_manager = client.modules.error_manager;
    role_manager = client.modules.role_manager;
    database = client.modules.database;
    general = client.modules.general;
    channel_manager = client.modules.channel_manager;

    try {
        await this.setActivity('Startup', 'LISTENING');

        // Manage Active Dedicated Channels
        for (const dedicated_channel of this.channel(constants.channels.category.dedicated).children.array()) {
            if (dedicated_channel.type == 'text') {
                const linked_data = dedicated_channel.topic.split(' ');
                const voice_channel = this.channel(linked_data[0]);
                const text_role = this.role(linked_data[1]);
                const team_role = this.role(linked_data[2]);

                for (const this_member of voice_channel.members.array()) {
                    // Give text role
                    if (!this_member.user.bot && !this_member.roles.cache.has(text_role.id)) {
                        await role_manager.add(this_member, text_role).catch(error => error_manager.mark(ErrorTicketManager.create(`add text_role to ${this_member}`, error, 'initialize')));
                    }
                    // Give team role
                    if (!this_member.user.bot && !this_member.roles.cache.has(team_role.id)) {
                        await role_manager.add(this_member, team_role).catch(error => error_manager.mark(ErrorTicketManager.create(`add team_role to ${this_member}`, error, 'initialize')));
                    }
                    // Hide other dedicated channels
                    if (!this_member.user.bot && !this_member.roles.cache.has(constants.roles.dedicated)) {
                        await role_manager.add(this_member, constants.roles.dedicated).catch(error => error_manager.mark(ErrorTicketManager.create(`add dedicated_role to ${this_member}`, error, 'initialize')));
                    }
                }

                for (const this_member of this.guild().members.cache.array()) {
                    if (!this_member.user.bot) {
                        if (this_member.roles.cache.has(text_role.id)) {
                            // Remove roles related to dedicated channels
                            if (!this_member.voice || this_member.voice.channelID != voice_channel.id) {
                                await role_manager.remove(this_member, text_role).catch(error => error_manager.mark(ErrorTicketManager.create(`remove text_role from ${this_member}`, error, 'initialize')));
                                await role_manager.remove(this_member, team_role).catch(error => error_manager.mark(ErrorTicketManager.create(`remove team_role from ${this_member}`, error, 'initialize')));
                            }
                        }

                        if (this_member.roles.cache.has(constants.roles.dedicated)) {
                            // Show all active dedicated channels
                            if (!this_member.voice || !this_member.voice.channel || this_member.voice.channel.parent != constants.channels.category.dedicated) {
                                await role_manager.remove(this_member, constants.roles.dedicated).catch(error => error_manager.mark(ErrorTicket.create(`remove dedicated_role from ${this_member}`, error, 'initialize')));
                            }
                        }
                    }
                }
            }
        }

        // Manage Inactive Dedicated Channel Related Roles
        for (const this_member of this.guild().members.cache.array()) {
            for (const this_role of this_member.roles.cache.array()) {
                if (this_role.id == constants.roles.dedicated) {
                    // Remove Dedicated Channel Role
                    if ((this_member.voice && this_member.voice.channel && this_member.voice.channel.parent && this_member.voice.channel.parent.id != constants.channels.category.dedicated) || !(this_member.voice && this_member.voice.channel)) {
                        await role_manager.remove(this_member, this_role);
                    }
                } else if (this_role.name.startsWith('Text')) {
                    // Remove Text Role
                    const text_channel = this.channel(this_role.name.split(' ')[1]);
                    if (!text_channel || (text_channel && !text_channel.members.find(member => member.user.id == this_member.user.id))) {
                        await role_manager.remove(this_member, this_role);
                    }
                }
            }
        }

        // Manage Inactive Dedicated Channel Related Channels
        /** @type {Discord.CategoryChannel} */
        const dedicated_category_channel = this.channel(constants.channels.category.dedicated);
        for (const dedicated_channel of dedicated_category_channel.children.array()) {
            if (dedicated_channel.type == 'voice' && dedicated_channel.parent && dedicated_channel.parentID == constants.channels.category.dedicated) {
                let empty = true;
                for (const this_member of dedicated_channel.members.array()) {
                    if (!this_member.user.bot) empty = false;
                }
                if (empty) {
                    const text_channel = this.guild().channels.cache.find(channel => channel.type == 'text' && channel.topic && functions.parseMention(channel.topic.split(' ')[0]) == dedicated_channel.id);
                    const linked_data = text_channel.topic.split(' ');
                    const text_role = this.role(linked_data[1]);
                    const team_role = this.role(linked_data[2]);

                    await channel_manager.delete(dedicated_channel);
                    await channel_manager.delete(text_channel);
                    await role_manager.delete(text_role);
                    await role_manager.delete(team_role);
                }
            }
        }

        // Add and Create Play Roles and Game Roles
        for (const this_member of this.guild().members.cache.array()) {
            if (!this_member.user.bot) {
                for (const this_activity of this_member.presence.activities) {
                    const activity_name = this_activity.name.trim();
                    if (this_activity.type == 'PLAYING' && !database.gameBlacklisted(activity_name) && (this_activity.applicationID || database.gameWhitelisted(activity_name))) {
                        const game_role = this.guild().roles.cache.find(role => role.name == activity_name) || await role_manager.create({ name: activity_name, color: '0x00ffff' });

                        if (!this_member.roles.cache.has(game_role.id)) {
                            // Add Game Role to this member
                            await role_manager.add(this_member, game_role);

                            if (!this.guild().roles.cache.find(role => role.name == activity_name + ' ⭐')) {
                                // Create Game Role Mentionable
                                await role_manager.create({ name: activity_name + ' ⭐', color: '0x00fffe' });
                            }
                        }

                        const streaming_role = this.role(constants.roles.streaming);
                        let play_role = this.guild().roles.cache.find(role => role.name == 'Play ' + activity_name);
                        if (!play_role) {
                            // Create Play Role
                            play_role = await role_manager.create({ name: 'Play ' + activity_name, color: '0x7b00ff', position: streaming_role.position, hoist: true });
                        }

                        if (!this_member.roles.cache.has(play_role.id)) {
                            // Add Play Role to this member
                            await role_manager.add(this_member, play_role);
                            // Bring Play Role to Top
                            await play_role.setPosition(streaming_role.position - 1);
                        }
                    }
                }
            }
        }

        // Manage Inactive Play Roles
        for (const this_role of this.guild().roles.cache.array()) {
            if (this_role.hexColor == '#7b00ff' && this_role.name.startsWith('Play')) {
                // Check if Play Role is still in use
                let role_in_use = false;
                for (const this_member of this.guild().members.cache.array()) {
                    if (this_member.roles.cache.find(role => role == this_role)) {
                        // Check if this member is still playing
                        if (this_member.presence.activities.map(activity => activity.name.trim()).includes(this_role.name.substring(5))) {
                            role_in_use = true;
                        } else {
                            // Remove Play Role from this member
                            await role_manager.remove(this_member, this_role);
                        }
                    }
                }
                // Delete blacklisted and inactive Play Roles
                if (!role_in_use || database.gameBlacklisted(this_role.name.substring(5))) {
                    // Delete Play Role
                    await role_manager.delete(this_role);
                }
            } else if (this_role.hexColor == '#00ffff' && database.gameBlacklisted(this_role.name)) {
                // Delete Game Role
                await role_manager.delete(this_role);
            } else if (this_role.hexColor == '#00fffe' && database.gameBlacklisted(this_role.name)) {
                // Delete Game Role Mentionable
                await role_manager.delete(this_role);
            }
        }

        // Manage Inactive Streamers
        for (const this_member of this.guild().members.cache.array()) {
            if (this_member.roles.cache.has(constants.roles.streaming)) {
                await role_manager.remove(this_member, constants.roles.streaming);
            }
        }

        // Check for unlisted members
        await general.memberUnlisted();

        // Auto Dedicate
        setInterval(() => {
            try {
                const channels_for_dedication = new Array();
                for (const this_channel of this.channel(constants.channels.category.voice).children.array()) {
                    if (this_channel.type == 'voice') channels_for_dedication.push(this_channel);
                }
                for (const this_channel of this.channel(constants.channels.category.dedicated).children.array()) {
                    if (this_channel.type == 'voice') channels_for_dedication.push(this_channel);
                }
                for (const this_channel of channels_for_dedication) {
                    if (this_channel.members.size > 1) {
                        // Get baseline activity
                        let baseline_role, same_acitivities, diff_acitivities;
                        for (const this_member of this_channel.members.array()) {
                            for (const this_role of this_member.roles.cache.array()) {
                                if (!baseline_role && this_role.name.startsWith('Play')) {
                                    // Check how many users have the same roles
                                    same_acitivities = 0;
                                    diff_acitivities = 0;
                                    for (const the_member of this_channel.members.array()) {
                                        if (the_member.roles.cache.find(role => role == this_role)) {
                                            same_acitivities++;
                                        } else if (the_member.roles.cache.find(role => role.name.startsWith('Play'))) {
                                            diff_acitivities++;
                                        }
                                    }
                                    if (same_acitivities > 1 && same_acitivities > diff_acitivities && !this_role.name.substring(5).startsWith(this_channel.name.substring(2))) {
                                        baseline_role = this_role;
                                        general.dedicateChannel(this_channel, this_role.name.substring(5));
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                error_manager.mark(ErrorTicketManager.create('Auto Dedicate', error, 'initialize'));
            }
        }, 120000);

        // Free Games
        setTimeout(async () => {
            // Initial Fetch after 10mins
            await general.freeGameFetch();
            await general.freeGameUpdate();

            // Future Fetch every 30mins
            setInterval(() => {
                general.freeGameFetch();
            }, 1800000);
            // Future Update every 3hrs
            setInterval(() => {
                general.freeGameUpdate();
            }, 10800000);
        }, 600000);

        // Clear Temporary Channels
        channel_manager.clearTempChannels([
            constants.channels.integrations.game_invites,
            constants.channels.qg.testing_ground_text
        ]);

        await this.setActivity(process.env.STATUS_TEXT, process.env.STATUS_TYPE);

        if (process.env.STARTUP_REASON) {
            const embed = new Discord.MessageEmbed();
            embed.setColor('#ffff00');
            embed.setAuthor('Quarantine Gaming', this.client().user.displayAvatarURL());
            embed.setTitle('Startup Initiated');
            embed.addField('Reason', process.env.STARTUP_REASON);

            await message_manager.sendToChannel(constants.channels.qg.updates, embed);
        }

        console.log('Initialized');
        initialized = true;
    } catch (error) {
        console.error('Initializing Failed');
        await this.setActivity('Startup Failed', 'PLAYING');
        error_manager.mark(ErrorTicketManager.create('initialize', error));
    }
}