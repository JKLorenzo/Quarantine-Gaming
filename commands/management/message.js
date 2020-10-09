const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');

let mode;
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

module.exports = class Message extends Command {
    constructor(client) {
        super(client, {
            name: 'message',
            group: 'management',
            memberName: 'message',
            description: '[Admin Only] Send or update a message to a channel as Quarantine Gaming.',
            userPermissions: ["ADMINISTRATOR"],
            args: [
                {
                    key: 'mode',
                    prompt: 'Send or Update?',
                    type: 'string',
                    oneOf: ['send', 'update'],
                    validate: this_mode => {
                        mode = this_mode;
                        return this_mode == 'send' || this_mode == 'update';
                    }
                },
                {
                    key: 'arg1',
                    prompt: `Mention the channel where  ${mode == 'send' ? 'you want to send the message' : 'the message is located'}.`,
                    type: 'channel'
                },
                {
                    key: 'arg2',
                    prompt: mode == 'send' ? 'Enter the message you want to send.' : 'Enter the message ID of the original message. Followed by the message you want to send.',
                    type: 'string'
                }
            ]
        });
    }

    run(message, { mode, arg1, arg2 }) {
        message.delete({ timeout: 250 }).catch(error => { });
        let channel = g_channels.get().guild.channels.cache.get(arg1.id);
        if (channel) {
            switch (mode) {
                case 'send':
                    if (arg2 == 'guidelines') {
                        return channel.send(guidelines()).catch(error => {
                            g_interface.on_error({
                                name: 'run -> .send(guidelines)',
                                location: 'message.js',
                                error: error
                            });
                        });
                    } else {
                        return channel.send(`${arg2}`).catch(error => {
                            g_interface.on_error({
                                name: 'run -> .send(content)',
                                location: 'message.js',
                                error: error
                            });
                        });
                    }
                case 'update':
                    let message_id = arg2.split(' ')[0];
                    let content = arg2.split(' ').slice(1).join(' ');
                    channel.messages.fetch(message_id).then(this_message => {
                        return this_message.edit(`${content}`).catch(error => {
                            message.say(`Uh oh! ${error}`).then(this_message => {
                                this_message.delete({ timeout: 5000 }).catch(error => { });
                            });
                        });
                    });
            }
        } else {
            return message.say(`I can't find the channel you're looking for.`).then(this_message => {
                this_message.delete({ timeout: 5000 }).catch(error => { });
            });
        }
    }
};