const { CommandoClient } = require('discord.js-commando');
const path = require('path');

const client = new CommandoClient({
    commandPrefix: 'sudo ',
    owner: '393013053488103435',
    unknownCommandResponse: false,
});

client.registry
    .registerDefaultTypes()
    .registerGroups([
        ['administrator', 'Commands for admins']
    ])
    .registerCommandsIn(path.join(__dirname, 'commands'));

client.once('ready', () => {
    console.log('-------------{  Startup  }-------------');
    updateGuild();
});

const vr_prefix = 'Play ';
const ignored_titles = [
    'StartupWindow', 'Error', 'modlauncher', 'BlueStacks', 'NoxPlayer'
]
async function updateGuild() {
    console.log('**Updating Guild**')
    // Loops through every guild
    for (let this_guild of client.guilds.cache.array()) {
        // Get all the members of the guild
        let this_guild_members = this_guild.members.cache.array();
        // Loop through every member
        for (let this_member of this_guild_members) {
            // Get the status of this member
            let this_member_status = this_member.presence.status;
            // Check if this member is not offline
            if (this_member_status != 'offline') {
                // Get the list of activities of this member
                let this_member_activities = this_member.presence.activities;
                // Check if this member is not a bot and also check if this member have atleast 1 activity
                if (!this_member.user.bot && this_member_activities.length > 0) {
                    // Loop through all the acitivities of this member
                    for (let this_activity of this_member_activities) {
                        // Check if this activity is of type Playing, ignore if not
                        if (this_activity.type == 'PLAYING') {
                            // Get the name of the game
                            let this_game = this_activity.name;
                            // Remove the unwanted leading and trailing characters
                            this_game = this_game.trim();
                            // Check if the title of the game is not null and is not one of the ignored titles
                            if (this_game && !ignored_titles.includes(this_game)) {
                                // Check if user doesn't have this mentionable role
                                if (!this_member.roles.cache.find(role => role.name == this_game)) {
                                    // Get the equivalent role of this game
                                    let this_mentionable_role = this_guild.roles.cache.find(role => role.name == this_game);
                                    // Check if this role exists
                                    if (this_mentionable_role) {
                                        // Assign role to this member
                                        await this_member.roles.add(this_mentionable_role);
                                        console.log(`Mentionable role (${this_game}) added to (${this_member.user.tag}).`);
                                    } else {
                                        // Create role on this guild
                                        await this_guild.roles.create({
                                            data: {
                                                name: this_game,
                                                color: '0x00ffff',
                                                mentionable: true
                                            },
                                            reason: `A new game is played by (${this_member.user.tag}).`
                                        }).then(async function (this_mentionable_role) {
                                            console.log(`Mentionable role (${this_game}) created.`);
                                            // Assign role to this member
                                            await this_member.roles.add(this_mentionable_role);
                                            console.log(`Mentionable role (${this_game}) added to (${this_member.user.tag}).`);
                                        });
                                    }
                                }

                                // Get the voice room parent
                                let parent = this_guild.channels.cache.find(channel => channel.name.toLowerCase() == 'dedicated voice channels')
                                // Check if the voice room parent exists
                                if (parent) {
                                    let this_vr_name = vr_prefix + this_game;
                                    // Get the equivalent role of this game
                                    let this_voice_role = this_guild.roles.cache.find(role => role.name == this_vr_name);
                                    // Check if this role doesn't exists
                                    if (!this_voice_role) {
                                        // Get reference role
                                        let member_role = this_guild.roles.cache.find(role => role.name.toLowerCase() == 'member');
                                        // Create role on this guild
                                        await this_guild.roles.create({
                                            data: {
                                                name: this_vr_name,
                                                color: '0x7b00ff',
                                                mentionable: true,
                                                position: member_role.position + 1,
                                                hoist: true
                                            },
                                            reason: `A new game is played by (${this_member.user.tag}).`
                                        }).then(async function (voice_role) {
                                            console.log(`Voice room role (${this_vr_name}) created.`);
                                            this_voice_role = voice_role;
                                        });
                                    }

                                    // Get the equivalent voice room of this game
                                    let this_voice_room = this_guild.channels.cache.find(channel => channel.name == this_vr_name);
                                    // Check if this voice room doesn't exist
                                    if (!this_voice_room) {
                                        // Create this voice room
                                        await this_guild.channels.create(this_vr_name, {
                                            type: 'voice',
                                            topic: `Voice room dedicated for ${this_game} players.`,
                                            reason: `${this_game} is being played.`,
                                            parent: parent.id
                                        }).then(async (channel) => {
                                            await channel.overwritePermissions([
                                                {
                                                    id: this_voice_role.id,
                                                    allow: ["CONNECT"]
                                                },
                                                {
                                                    id: this_guild.roles.cache.find(role => role.name.toLowerCase() == 'music bots').id,
                                                    allow: ["CONNECT"]
                                                },
                                                {
                                                    id: this_guild.roles.everyone.id,
                                                    deny: ["CONNECT"]
                                                }
                                            ]);
                                        }).catch(console.error);
                                        console.log(`Voice room channel (${this_game}) created.`);
                                    }

                                    // Check if user doesn't have this voice room role
                                    if (!this_member.roles.cache.find(role => role.name == this_vr_name)) {
                                        // Assign role to this member
                                        await this_member.roles.add(this_voice_role);
                                        console.log(`Voice Room role (${this_vr_name}) added to (${this_member.user.tag}).`);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Get all the roles of this guild
        for (let this_role of this_guild.roles.cache.array()) {
            // Check if this role is one of the voice room roles
            if (this_role.name.startsWith(vr_prefix)) {
                // Boolean identifier if this role has members
                let has_members = false;
                // Get all the members of this guild
                for (let this_member of this_guild.members.cache.array()) {
                    // Check if this member has this role
                    if (this_member.roles.cache.find(role => role.name == this_role.name)) {
                        // Boolean identifier if this member is playing this role
                        let is_playing = false;
                        // Loop through all of this member's activities
                        for (let this_activity of this_member.presence.activities) {
                            // Check if this user is currently playing this role
                            if (this_activity.type == 'PLAYING' && this_activity.name == this_role.name.substring(vr_prefix.length)) {
                                has_members = true;
                                is_playing = true;
                            }
                        }
                        // Remove this role from this user
                        if (!is_playing) {
                            console.log(`Removing voice room role (${this_role.name}) from (${this_member.user.tag}).`);
                            await this_member.roles.remove(this_role).catch(console.error);
                        }
                    }
                }

                let equivalent_channels = new Array();;
                for (let this_channel of this_guild.channels.cache.array()) {
                    if (this_channel.name == this_role.name) {
                        equivalent_channels.push(this_channel);
                    }
                }

                let buffer_channels = new Array();
                for (let this_channel of equivalent_channels) {
                    if (this_channel.members.size == 0) {
                        buffer_channels.push(this_channel);
                    }
                }

                if (buffer_channels == 0) {
                    // Create duplicate voice room
                    await this_guild.channels.create(this_role.name, {
                        type: 'voice',
                        topic: `Voice room dedicated for ${this_role.name.substring(vr_prefix.length)} players.`,
                        reason: `${this_role.name.substring(vr_prefix.length)} is being played.`,
                        parent: this_guild.channels.cache.find(channel => channel.name.toLowerCase() == 'dedicated voice channels').id
                    }).then(async (channel) => {
                        await channel.overwritePermissions([
                            {
                                id: this_guild.id,
                                allow: ["CONNECT"]
                            },
                            {
                                id: this_guild.roles.cache.find(role => role.name.toLowerCase() == 'music bots').id,
                                allow: ["CONNECT"]
                            },
                            {
                                id: this_guild.roles.everyone.id,
                                deny: ["CONNECT"]
                            }
                        ]);
                    }).catch(console.error);
                    console.log(`Voice Room duplicate (${this_role.name.substring(vr_prefix.length)}) created.`);
                } else if (buffer_channels.length > 1) {
                    // Remove duplicates that are more than 1
                    for (let i = 1; i < buffer_channels.length; i++) {
                        // Delete this channel
                        await buffer_channels.pop().delete('No players are currently playing this game.').catch(console.error);
                        console.log(`Voice room channel (${this_role.name}) removed.`);
                    }
                }

                if (!has_members) {
                    // Check if equivalent channels exists
                    if (equivalent_channels.length > 0) {
                        let has_users = false;
                        for (let this_channel of equivalent_channels) {
                            // Check if someone is using this channel
                            if (this_channel.members.size > 0) {
                                has_users = true;
                            } else {
                                // Delete this channel
                                await this_channel.delete('No players are currently playing this game.').catch(console.error);
                                console.log(`Channel (${this_role.name}) removed.`);
                            }
                        }
                        if (!has_users) {
                            // Delete this role
                            await this_role.delete('No players are currently playing this game.').catch(console.error);
                            console.log(`Voice room role (${this_role.name}) removed.`);
                        }
                    } else {
                        // Delete this role
                        await this_role.delete('No players are currently playing this game.').catch(console.error);
                        console.log(`Voice room role (${this_role.name}) removed.`);
                    }
                }
            }
        }

        // Transfer members from generic voice rooms to dynamic voice rooms
        for (let this_channel of this_guild.channels.cache.array()) {
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
                        let same_acitivities = true;
                        // Check if all members have the same activity
                        for (let this_member of this_channel.members.array()) {
                            if (same_acitivities && !this_member.roles.cache.find(role => role == baseline_role)) {
                                same_acitivities = false;
                            }
                        }
                        if (same_acitivities) {
                            // Find an empty room
                            for (let channel of this_guild.channels.cache.array()) {
                                let is_trasnfered = false;
                                if (!is_trasnfered && channel.type == 'voice') {
                                    if (channel.name == baseline_role.name && channel.members.size == 0) {
                                        for (let this_member of this_channel.members.array()) {
                                            await this_member.voice.setChannel(channel).catch(console.error);
                                            console.log(`Transfering (${this_member.user.tag}) to (${channel.name}) channel.`);
                                        }
                                        is_trasnfered = true;
                                    }
                                }
                            }

                        }
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

client.on('error', console.error);

client.login(process.env.BOT_TOKEN);