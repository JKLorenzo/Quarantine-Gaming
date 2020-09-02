const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');

module.exports = class ReactionRole extends Command {
    constructor(client) {
        super(client, {
            name: 'reactionrole',
            group: 'management',
            memberName: 'reactionrole',
            description: 'Sends or updates a reaction role to the channel.',
            userPermissions: ["ADMINISTRATOR"],
            guildOnly: true,
            args: [
                {
                    key: 'mode',
                    prompt: 'Create or update?',
                    type: 'string',
                    oneOf: ['create', 'update']
                },
                {
                    key: 'type',
                    prompt: 'nsfw or fgu?',
                    type: 'string',
                    oneOf: ['nsfw', 'fgu']
                }
            ]
        });
    }

    async run(message, { mode, type }) {
        message.delete();
        let output;
        switch (type) {
            case 'nsfw':
                output = NSFW(this.client);
                break;
            case 'fgu':
                output = FreeGameUpdates(this.client);
                break;
        }
        switch (mode) {
            case 'create':
                await message.say(output.message).then(async this_message => {
                    for (let this_reaction of output.reactions) {
                        await this_message.react(this_reaction).catch(error => {
                            g_interface.on_error({
                                name: 'run -> .react(this_reaction) [case create]',
                                location: 'reactionrole.js',
                                error: error
                            });
                        });
                    }
                }).catch(error => {
                    g_interface.on_error({
                        name: 'run -> .say(output.message) [case create]',
                        location: 'reactionrole.js',
                        error: error
                    });
                });
                break;
            case 'update':
                await message.channel.messages.fetch({ limit: 25 }).then(async messages => {
                    let this_messages = new Array();
                    messages.map(msg => {
                        if (msg.embeds.length == 0 || !msg.author.bot) return msg;
                        if (msg.embeds[0].author.name == output.message.author.name) {
                            this_messages.push(msg);
                        }
                    });
                    if (this_messages.length > 0) {
                        let this_message = this_messages[0];
                        await this_message.edit(output.message).then(async this_message => {
                            for (let this_reaction of output.reactions) {
                                await this_message.react(this_reaction).catch(error => {
                                    g_interface.on_error({
                                        name: 'run -> .react(this_reaction) [case update]',
                                        location: 'reactionrole.js',
                                        error: error
                                    });
                                });
                            }
                        }).catch(error => {
                            g_interface.on_error({
                                name: 'run -> .edit(output.message) [case update]',
                                location: 'reactionrole.js',
                                error: error
                            });
                        });
                    }
                });
                break;
        }
    }
};

function NSFW(client) {
    let embed = new MessageEmbed()
        .setColor('#ffff00')
        .setAuthor('Quarantine Gaming NSFW Content')
        .setTitle('Unlock NSFW Bots and Channel')
        .setThumbnail(client.user.displayAvatarURL())
        .setDescription('<@&700486309655085107> and <#699847972623482931> channel will be unlocked after getting the <@&700481554132107414> role.')
        .addField('🔴 - Not Safe For Work (NSFW)', 'The marked content may contain nudity, intense sexuality, profanity, violence or other potentially disturbing subject matter.')
        .setImage('https://s3.amazonaws.com/sofontsy-files-us/wp-content/uploads/2019/02/07163845/NSFW-Bundle_banner.jpg')
        .setFooter('Update your role by reacting below.');

    let reactions = new Array();
    reactions.push('🔴');
    return {
        message: embed,
        reactions: reactions
    }
}

function FreeGameUpdates(client) {
    let embed = new MessageEmbed()
        .setColor('#ffff00')
        .setAuthor('Quarantine Gaming Role Notification Subscription')
        .setTitle('Subscribe to get updated')
        .setThumbnail(client.user.displayAvatarURL())
        .setDescription('All notifications will be made available in the <#699763763859161108> channel.')
        .addFields([
            { name: '1️⃣ - Steam: Free Game Updates', value: 'Notifies you with Steam games and DLCs that are currently free.' },
            { name: '2️⃣ - Epic: Free Game Updates', value: 'Notifies you with Epic games and DLCs that are currently free.' },
            { name: '3️⃣ - GOG: Free Game Updates', value: 'Notifies you with GOG games and DLCs that are currently free.' },
            { name: '4️⃣ - Console: Free Game Updates', value: 'Notifies you with games and DLCs that are currently free for Xbox(One/360), PlayStation(3/4/Vita), and Wii(U/3DS/Switch).' },
            { name: '5️⃣ - UPlay: Free Game Updates', value: 'Notifies you with Ubisoft games and DLCs that are currently free.' },
        ])
        .setImage('https://media.playstation.com/is/image/SCEA/playstation-vue-hero-banner-desktop-01-us-22jan19?$native_nt$')
        .setFooter('Update your role by reacting below.');

    let reactions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
    return {
        message: embed,
        reactions: reactions
    };
}