const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');

function guidelines() {
    let embed = new MessageEmbed();
    embed.setAuthor('Discord', 'http://orig08.deviantart.net/5d90/f/2016/099/d/a/discord_token_icon_light_by_flexo013-d9y9q3w.png');
    embed.setTitle('**Discord Community Guidelines**');
    embed.setURL('https://discord.com/guidelines')
    let description = new Array();
    description.push("Our community guidelines are meant to explain what is and isn’t allowed on Discord, and ensure that everyone has a good experience. If you come across a message that appears to break these rules, please report it to us. We may take a number of steps, including issuing a warning, removing the content, or removing the accounts and/or servers responsible.");
    description.push(" ");
    description.push("**Here are some rules for interacting with others:**");
    description.push(" ");
    description.push("1. Do not organize, participate in, or encourage harassment of others.");
    description.push(" ");
    description.push("2. Do not organize, promote, or coordinate servers around hate speech.");
    description.push(" ");
    description.push("3. Do not make threats of violence or threaten to harm others.");
    description.push(" ");
    description.push("4. Do not evade user blocks or server bans.");
    description.push(" ");
    description.push("5. Do not send others viruses or malware.");
    description.push(" ");
    description.push(" ");
    description.push("**Here are some rules for content on Discord:**");
    description.push(" ");
    description.push("6. You must apply the NSFW label to channels if there is adult content in that channel.");
    description.push(" ");
    description.push("7. You may not sexualize minors in any way.");
    description.push(" ");
    description.push("8. You may not share sexually explicit content of other people without their consent.");
    description.push(" ");
    description.push("9. You may not share content that glorifies or promotes suicide or self-harm.");
    description.push(" ");
    description.push("10. You may not share images of sadistic gore or animal cruelty.");
    description.push(" ");
    description.push("11. You may not use Discord for the organization, promotion, or support of violent extremism.");
    description.push(" ");
    description.push("12. You may not operate a server that sells or facilitates the sales of prohibited or potentially dangerous goods.");
    description.push(" ");
    description.push("13. You may not promote, distribute, or provide access to content involving the hacking, cracking, or distribution of pirated software or stolen accounts.");
    description.push(" ");
    description.push("14. In general, you should not promote, encourage or engage in any illegal behavior.");
    embed.setDescription(description.join('\n'));
    embed.setFooter('Last Updated: May 19th, 2020.');
    embed.setColor('#6464ff');
    return embed;
}

let this_mode;
function setMode(val) {
    this_mode = val;
}
function getMode() {
    return this_mode;
}
module.exports = class Message extends Command {
    constructor(client) {
        super(client, {
            name: 'message',
            group: 'management',
            memberName: 'message',
            description: '[Admin Only] Send a message to a channel, update a message on a channel, or send a DM to a member as Quarantine Gaming.',
            userPermissions: ["ADMINISTRATOR"],
            args: [
                {
                    key: 'mode',
                    prompt: 'Send, Update or DM?',
                    type: 'string',
                    oneOf: ['send', 'update', 'dm'],
                    validate: mode => {
                        setMode(mode.toLowerCase());
                        return mode == 'send' || mode == 'update' || mode == 'dm';
                    }
                },
                {
                    key: 'args',
                    prompt: `**Arguments:**\n` +
                        `On Send: *<Channel ID> [Message]*\n` +
                        `On Update: *<Channel ID> [Message ID] {Message}*\n` +
                        `On DM: *<User ID> [Message]*`,
                    type: 'string',
                    validate: async args => {
                        console.log('validating')
                        let commands = args.split(' ');
                        if (commands.length < 2) return false;
                        let this_channel, the_message, this_member;
                        switch (getMode()) {
                            case 'send':
                                this_channel = g_channels.get().guild.channels.cache.find(channel => channel.id == commands[0]);
                                the_message = commands.slice(1).join(' ');
                                return (this_channel && the_message) ? true : false;
                                break;
                            case 'update':
                                this_channel = g_channels.get().guild.channels.cache.find(channel => channel.id == commands[0]);
                                let this_message;
                                if (this_channel) {
                                    await this_channel.messages.fetch(commands[1]).then(message => {
                                        this_message = message;
                                    }).catch(error => { });
                                }
                                the_message = commands.slice(2).join(' ');
                                return (this_channel && this_message && the_message) ? true : false;
                                break;
                            case 'dm':
                                this_member = g_channels.get().guild.members.cache.find(member => member.user.id == commands[0]);
                                the_message = commands.slice(1).join(' ');
                                return (this_member && the_message) ? true : false;
                                break;
                        }
                    }
                }
            ]
        });
    }

    async run(message, { mode, args }) {
        console.log('running')
        let this_channel, the_message, this_member;
        let commands = args.split(' ');
        switch (mode.toLowerCase()) {
            case 'send':
                this_channel = g_channels.get().guild.channels.cache.find(channel => channel.id == commands[0]);
                the_message = commands.slice(1).join(' ');
                if (the_message == 'guidelines') {
                    await this_channel.send(guidelines()).catch(error => {
                        g_interface.on_error({
                            name: 'run -> .send(guidelines)',
                            location: 'message.js',
                            error: error
                        });
                    });
                } else {
                    await this_channel.send(the_message).catch(error => {
                        g_interface.on_error({
                            name: 'run -> .send(the_message)',
                            location: 'message.js',
                            error: error
                        });
                    });
                }
                break;
            case 'update':
                this_channel = g_channels.get().guild.channels.cache.find(channel => channel.id == commands[0]);
                the_message = commands.slice(2).join(' ');
                if (this_channel) {
                    await this_channel.messages.fetch(commands[1]).then(async this_message => {
                        await this_message.edit(the_message).catch(async error => {
                            await message.say(`Uh oh! ${error}`).then(this_error_message => {
                                this_error_message.delete({ timeout: 5000 }).catch(error => { });
                            });
                        });
                    }).catch(error => {
                        g_interface.on_error({
                            name: 'run -> .fetch(the_message)',
                            location: 'message.js',
                            error: error
                        });
                    });
                }
                break;
            case 'dm':
                this_member = g_channels.get().guild.members.cache.find(member => member.user.id == commands[0]);
                the_message = commands.slice(1).join(' ');
                await g_message_manager.dm_member(this_member, the_message);
                break;
        }
        return message.say('Done!').catch(error => { });
    }
};