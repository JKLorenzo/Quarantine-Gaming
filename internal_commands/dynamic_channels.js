const { MessageEmbed } = require("discord.js");
let isUpdating = false, toUpdate = new Array();

function updateGuild() {
    try {
        // Transfer members from generic voice rooms to dynamic voice rooms
        for (let this_channel of g_channels.get().guild.channels.cache.array()) {
            // Disregard Pandora's Box and Couchlockszx
            if (this_channel.type == 'voice' && this_channel.id != '747005488197009568' && this_channel.id != '663443529170681857') {
                if (this_channel.members.size > 1) {
                    // Get baseline activity
                    let baseline_role, same_acitivities, diff_acitivities;
                    for (let this_member of this_channel.members.array()) {
                        for (let this_role of this_member.roles.cache.array()) {
                            if (!baseline_role && this_role.name.startsWith('Play')) {
                                // Check how many users have the same roles
                                same_acitivities = 0;
                                diff_acitivities = 0;
                                for (let the_member of this_channel.members.array()) {
                                    if (the_member.roles.cache.find(role => role == this_role)) {
                                        same_acitivities++;
                                    } else if (the_member.roles.cache.find(role => role.name.startsWith('Play'))) {
                                        diff_acitivities++;
                                    }
                                }
                                if (same_acitivities > 1 && same_acitivities > diff_acitivities && !this_role.name.substring(5).startsWith(this_channel.name)) {
                                    baseline_role = this_role;
                                    g_channels.dedicate(this_member, this_role.name.substring(5));
                                }
                            }
                        }
                    }
                }
            }
        }
    } catch (error) {
        g_interface.on_error({
            name: 'updateGuild',
            location: 'dynamic_channels.js',
            error: error
        });
    }
}

async function updateChannel() {
    while (toUpdate.length > 0) {
        try {
            let this_data = toUpdate.shift();
            let newState = this_data.new;
            let oldState = this_data.old;

            if (oldState.channel != newState.channel) {
                if (oldState.channel && oldState.channel.parent == g_channels.get().dedicated) {
                    let text_channel = g_channels.get().guild.channels.cache.find(channel => channel.type == 'text' && channel.topic && channel.topic.split(' ')[0] == oldState.channelID);
                    let text_role = g_channels.get().guild.roles.cache.get(text_channel.topic.split(' ')[1]);
                    let hoisted_role = g_channels.get().guild.roles.cache.get(text_channel.topic.split(' ')[2]);
                    if (oldState.channel.members.size > 0 && !(oldState.channel.members.size == 1 && oldState.channel.members.first().user.bot)) {
                        // Remove hoisted role
                        await newState.member.roles.remove(hoisted_role).catch(error => {
                            g_interface.on_error({
                                name: 'updateChannel -> .remove(hoisted_role)',
                                location: 'dynamic_channels.js',
                                error: error
                            });
                        });
                        // Remove text role
                        await newState.member.roles.remove(text_role).catch(error => {
                            g_interface.on_error({
                                name: 'updateChannel -> .remove(text_role)',
                                location: 'dynamic_channels.js',
                                error: error
                            });
                        });
                        let embed = new MessageEmbed();
                        embed.setAuthor('Quarantine Gaming: Dedicated Channels');
                        embed.setTitle(oldState.channel.name);
                        embed.setDescription(`${oldState.member} left this channel.`);
                        embed.setThumbnail(newState.member.user.displayAvatarURL());
                        embed.setFooter(`${newState.member.user.tag} (${newState.member.user.id})`);
                        embed.setTimestamp();
                        embed.setColor('#7b00ff');
                        await text_channel.send(embed).catch(error => {
                            g_interface.on_error({
                                name: 'updateChannel -> .send(embed)',
                                location: 'dynamic_channels.js',
                                error: error
                            });
                        });
                    } else {
                        await oldState.channel.delete().catch(error => {
                            g_interface.on_error({
                                name: 'updateChannel -> .delete(voice_channel)',
                                location: 'dynamic_channels.js',
                                error: error
                            });
                        });
                        await text_channel.delete().catch(error => {
                            g_interface.on_error({
                                name: 'updateChannel -> .delete(text_channel)',
                                location: 'dynamic_channels.js',
                                error: error
                            });
                        });
                        await text_role.delete().catch(error => {
                            g_interface.on_error({
                                name: 'updateChannel -> .delete(text_role)',
                                location: 'dynamic_channels.js',
                                error: error
                            });
                        });
                        await hoisted_role.delete().catch(error => {
                            g_interface.on_error({
                                name: 'updateChannel -> .delete(hoisted_role)',
                                location: 'dynamic_channels.js',
                                error: error
                            });
                        });
                    }
                }

                if (newState.channel) {
                    // Check if members are streaming
                    let streamers = new Array();
                    for (let this_member of newState.channel.members.array()) {
                        if (newState.member.user.id != this_member.user.id && this_member.roles.cache.find(role => role.id == '757128062276993115')) {
                            streamers.push(this_member);
                        }
                    }
                    // Notify member
                    if (streamers.length > 0) {
                        let embed = new MessageEmbed();
                        embed.setAuthor('Quarantine Gaming: Information');
                        embed.setTitle(`${streamers.length > 1 ? `${streamers.map(member => member.displayName).join(' and ')} are` : `${streamers.map(member => member.displayName)} is`} currently Streaming`);
                        embed.setDescription('Please observe proper behavior on your current voice channel.')
                        embed.setImage('https://pa1.narvii.com/6771/d33918fa87ad0d84b7dc854dcbf6a8545c73f94d_hq.gif');
                        embed.setColor('#5dff00')
                        await g_message_manager.dm_member(newState.member, embed).catch(error => {
                            g_interface.on_error({
                                name: 'updateChannel -> .dm(stream)',
                                location: 'dynamic_channels.js',
                                error: error
                            });
                        });
                    }


                    if (newState.channel.parent == g_channels.get().dedicated) {
                        // Add member to a text channel when joining a dedicated channel
                        let text_channel = g_channels.get().guild.channels.cache.find(channel => channel.type == 'text' && channel.topic && channel.topic.split(' ')[0] == newState.channelID);
                        let text_role = g_channels.get().guild.roles.cache.get(text_channel.topic.split(' ')[1]);
                        let hoisted_role = g_channels.get().guild.roles.cache.get(text_channel.topic.split(' ')[2]);
                        if (!newState.member.roles.cache.find(role => role == text_role)) {
                            // Add hoisted role
                            await newState.member.roles.add(hoisted_role).catch(error => {
                                g_interface.on_error({
                                    name: 'updateChannel -> .add(hoisted_role)',
                                    location: 'dynamic_channels.js',
                                    error: error
                                });
                            });
                            // Add text role
                            await newState.member.roles.add(text_role).catch(error => {
                                g_interface.on_error({
                                    name: 'updateChannel -> .add(text_role)',
                                    location: 'dynamic_channels.js',
                                    error: error
                                });
                            });
                            let embed = new MessageEmbed();
                            embed.setAuthor('Quarantine Gaming: Dedicated Channels');
                            embed.setTitle(newState.channel.name);
                            embed.setDescription(`${newState.member} joined this channel.`);
                            embed.setThumbnail(newState.member.user.displayAvatarURL());
                            embed.setFooter(`${newState.member.user.tag} (${newState.member.user.id})`);
                            embed.setTimestamp();
                            embed.setColor('#7b00ff');
                            await text_channel.send(embed).catch(error => {
                                g_interface.on_error({
                                    name: 'updateChannel -> .send(embed)',
                                    location: 'dynamic_channels.js',
                                    error: error
                                });
                            });
                        }
                        // Hide all active dedicated channels
                        if (!newState.member.user.bot && !newState.member.roles.cache.find(role => role == g_roles.get().dedicated)) {
                            await newState.member.roles.add(g_roles.get().dedicated).catch(error => {
                                g_interface.on_error({
                                    name: 'updateChannel -> .add(dedicated_role)',
                                    location: 'dynamic_channels.js',
                                    error: error
                                });
                            });
                        }
                    } else {
                        // Show all active dedicated channels
                        if (!newState.member.user.bot && newState.member.roles.cache.find(role => role == g_roles.get().dedicated)) {
                            await newState.member.roles.remove(g_roles.get().dedicated).catch(error => {
                                g_interface.on_error({
                                    name: 'updateChannel -> .remove(dedicated_role)',
                                    location: 'dynamic_channels.js',
                                    error: error
                                });
                            });
                        }
                    }
                } else {
                    // Check if member was streaming
                    let streaming_role = newState.member.roles.cache.find(role => role == g_roles.get().streaming);
                    if (streaming_role) {
                        newState.member.roles.remove(streaming_role).catch(error => {
                            g_interface.on_error({
                                name: 'updateChannel -> .remove(streaming_role)',
                                location: 'dynamic_channels.js',
                                error: error
                            });
                        });
                    }
                    // Show all active dedicated channels
                    if (!newState.member.user.bot && newState.member.roles.cache.find(role => role == g_roles.get().dedicated)) {
                        await newState.member.roles.remove(g_roles.get().dedicated).catch(error => {
                            g_interface.on_error({
                                name: 'updateChannel -> .remove(dedicated_role)',
                                location: 'dynamic_channels.js',
                                error: error
                            });
                        });
                    }
                }
            }
        } catch (error) {
            g_interface.on_error({
                name: 'updateChannel',
                location: 'dynamic_channels.js',
                error: error
            });
        }
    }
    isUpdating = false;
}

// External Functions Region
const init = async function () {
    try {
        for (let this_channel of g_channels.get().guild.channels.cache.array()) {
            if (this_channel && this_channel.parent && this_channel.parent == g_channels.get().dedicated) {
                if (this_channel.type == 'text') {
                    let data = this_channel.topic.split(' ');
                    let this_voice = g_channels.get().guild.channels.cache.get(data[0]);
                    let this_text = g_channels.get().guild.roles.cache.get(data[1]);
                    let this_hoisted = g_channels.get().guild.roles.cache.get(data[2]);


                    for (let this_member of this_voice.members.array()) {
                        // Give all channel members text roles
                        if (!this_member.user.bot && !this_member.roles.cache.find(role => role == this_text)) {
                            await this_member.roles.add(this_text).catch(error => {
                                g_interface.on_error({
                                    name: 'init -> .add(text_role)',
                                    location: 'dynamic_channels.js',
                                    error: error
                                });
                            });
                        }
                        // Give all channel members hoisted roles
                        if (!this_member.user.bot && !this_member.roles.cache.find(role => role == this_hoisted)) {
                            await this_member.roles.add(this_hoisted).catch(error => {
                                g_interface.on_error({
                                    name: 'init -> .add(this_hoisted)',
                                    location: 'dynamic_channels.js',
                                    error: error
                                });
                            });
                        }
                        // Hide all active dedicated channels
                        if (!this_member.user.bot && !this_member.roles.cache.find(role => role == g_roles.get().dedicated)) {
                            await this_member.roles.add(g_roles.get().dedicated).catch(error => {
                                g_interface.on_error({
                                    name: 'init -> .add(dedicated_role)',
                                    location: 'dynamic_channels.js',
                                    error: error
                                });
                            });
                        }
                    }

                    // Remove role from all members not in the voice room
                    for (let this_member of g_channels.get().guild.members.cache.array()) {
                        if (!this_member.user.bot && this_member.roles.cache.find(role => role == this_text)) {
                            if (!this_member.voice || this_member.voice.channelID != this_voice.id) {
                                await this_member.roles.remove(this_text).catch(error => {
                                    g_interface.on_error({
                                        name: 'init -> .remove(text_role) [A]',
                                        location: 'dynamic_channels.js',
                                        error: error
                                    });
                                });

                                await this_member.roles.remove(this_hoisted).catch(error => {
                                    g_interface.on_error({
                                        name: 'init -> .remove(this_hoisted) [A]',
                                        location: 'dynamic_channels.js',
                                        error: error
                                    });
                                });
                            }
                        }

                        // Show all active dedicated channels
                        if (!this_member.user.bot && this_member.roles.cache.find(role => role == g_roles.get().dedicated)) {
                            if (!this_member.voice || !this_member.voice.channel || this_member.voice.channel.parent != g_channels.get().dedicated) {
                                await this_member.roles.remove(g_roles.get().dedicated).catch(error => {
                                    g_interface.on_error({
                                        name: 'init -> .remove(dedicated_role)',
                                        location: 'dynamic_channels.js',
                                        error: error
                                    });
                                });
                            }
                        }
                    }
                }
            }
        }

        setInterval(function () {
            updateGuild();
        }, 30000)
    } catch (error) {
        g_interface.on_error({
            name: 'init',
            location: 'dynamic_channels.js',
            error: error
        });
    }
}

const update = function (oldState, newState) {
    try {
        if (!(oldState.member.user.bot || newState.member.user.bot)) {
            let this_data = {
                old: oldState,
                new: newState
            }

            toUpdate.push(this_data);
            if (!isUpdating) {
                isUpdating = true;
                updateChannel();
            }
        }
    } catch (error) {
        g_interface.on_error({
            name: 'update',
            location: 'dynamic_channels.js',
            error: error
        });
    }
}

// Interface Module Functions
module.exports = {
    init,
    update
}