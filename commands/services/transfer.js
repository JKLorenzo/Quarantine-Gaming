const { Command } = require('discord.js-commando');

module.exports = class TransferCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'transfer',
            group: 'services',
            memberName: 'transfer',
            description: 'Transfer a user to your current voice channel.',
            guildOnly: true,
            args: [
                {
                    key: 'user',
                    prompt: 'Mention the user you want to invite.',
                    type: 'user',
                }
            ]
        });
    }

    run(message, { user }) {
        let channel = g_interface.get('guild').members.cache.get(message.author.id).voice.channelID;
        if (channel) {
            let this_member = g_interface.get('guild').members.cache.get(user.id);
            if (this_member) {
                if (this_member.voice.channelID) {
                    this_member.voice.setChannel(channel).catch(console.error);
                } else {
                    message.channel.send(`${user} must be active to any voice channels.`).then(this_message => {
                        this_message.delete({ timeout: 5000 }).catch(error => { });
                    });
                }
            } else {
                message.channel.send("I can't find this user, please try again.").then(this_message => {
                    this_message.delete({ timeout: 5000 }).catch(error => { });
                });
            }
        } else {
            message.channel.send('Join a voice channel first before inviting someone.').then(this_message => {
                this_message.delete({ timeout: 5000 }).catch(error => { });
            });
        }
        return;
    }
};