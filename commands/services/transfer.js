const { Command } = require('discord.js-commando');

module.exports = class TransferCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'transfer',
            group: 'services',
            memberName: 'transfer',
            description: 'Transfer a user/users to your current voice channel regardless of roles.',
            guildOnly: true,
            args: [
                {
                    key: 'users',
                    prompt: 'Mention the user/users you want to invite.',
                    type: 'string',
                }
            ]
        });
    }

    run(message, { users }) {
        let channel = g_interface.get('guild').members.cache.get(message.author.id).voice.channelID;
        if (channel) {
            for (let user of users.split(' ')) {
                let user_id = user.split('<@').join('').split('>').join('').slice(1);
                console.log(user_id);
                let this_member = g_interface.get('guild').members.cache.get(user_id);
                console.log(this_member);
                if (this_member) {
                    if (this_member.voice.channelID) {
                        this_member.voice.setChannel(channel).catch(console.error);
                    } else {
                        message.channel.send(`${this_member} must be active to any voice channels.`).then(this_message => {
                            this_message.delete({ timeout: 5000 }).catch(error => { });
                        });
                    }
                } else {
                    message.channel.send(`I can't find user ${user}, please try again.`).then(this_message => {
                        this_message.delete({ timeout: 5000 }).catch(error => { });
                    });
                }
            }
        } else {
            message.channel.send('Join a voice channel first before inviting someone.').then(this_message => {
                this_message.delete({ timeout: 5000 }).catch(error => { });
            });
        }
        return;
    }
};