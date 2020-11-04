const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');

let mode;
module.exports = class ReactionRole extends Command {
    constructor(client) {
        super(client, {
            name: 'reactionrole',
            group: 'management',
            memberName: 'reactionrole',
            description: '[Admin Only] Send or update a reaction role.',
            userPermissions: ["ADMINISTRATOR"],
            guildOnly: true,
            args: [
                {
                    key: 'mode',
                    prompt: 'Create or update?',
                    type: 'string',
                    oneOf: ['create', 'update'],
                    validate: this_mode => {
                        mode = this_mode;
                        return this_mode == 'create' || this_mode == 'update';
                    }
                },
                {
                    key: 'type',
                    prompt: 'nsfw, fgu',
                    type: 'string',
                    oneOf: ['nsfw', 'fgu']
                },
                {
                    key: 'msgID',
                    prompt: 'Message ID',
                    type: 'string',
                    validate: msgID => {
                        return mode == 'create' || (msgID && msgID.length > 0);
                    }
                }
            ]
        });
    }

    async run(message, { mode, type, msgID }) {
        let output;
        switch (type) {
            case 'nsfw':
                output = NSFW();
                break;
            case 'fgu':
                output = FreeGameUpdates();
                break;
        }

        let updated = true;
        switch (mode) {
            case 'create':
                await g_channels.get().roles.send(output.message).then(async this_message => {
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
                await g_channels.get().roles.messages.fetch({ limit: 25 }).then(async messages => {
                    let this_messages = new Array();
                    messages.map(msg => {
                        if (msg.embeds.length == 0 || !msg.author.bot) return msg;
                        if (msg.id == msgID) {
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
            default:
                updated = false;
                break;
        }

        if (updated) {
            message.say(`Got it! All changes are made.`)
        } else {
            message.say(`Uh oh! No changes made.`)
        }
    }
};

function NSFW() {
    let embed = new MessageEmbed()
        .setColor('#ffff00')
        .setAuthor('Quarantine Gaming: NSFW Content')
        .setTitle('Unlock NSFW Bots and Channel')
        .setThumbnail(g_client.user.displayAvatarURL())
        .setDescription('<@&700486309655085107> and <#699847972623482931> channel will be unlocked after getting the <@&700481554132107414> role.')
        .addField('🔴 - Not Safe For Work (NSFW)', 'The marked content may contain nudity, intense sexuality, profanity, violence or other potentially disturbing subject matter.')
        .setImage('https://s3.amazonaws.com/sofontsy-files-us/wp-content/uploads/2019/02/07163845/NSFW-Bundle_banner.jpg')
        .setFooter('Update your role by reacting below.');

    let reactions = ['🔴'];
    return {
        message: embed,
        reactions: reactions
    }
}

function FreeGameUpdates() {
    let description = new Array();
    description.push('All notifications will be made available on the <#699763763859161108> channel.');
    description.push(' ');
    description.push('1️⃣ - <@&722645979248984084>');
    description.push('Notifies you with Steam games and DLCs that are currently free.');
    description.push(' ');
    description.push('2️⃣ - <@&722691589813829672>');
    description.push('Notifies you with Epic games and DLCs that are currently free.');
    description.push(' ');
    description.push('3️⃣ - <@&722691679542312970>');
    description.push('Notifies you with GOG games and DLCs that are currently free.');
    description.push(' ');
    description.push('4️⃣ - <@&722691724572491776>');
    description.push('Notifies you with games and DLCs that are currently free for Xbox(One/360), PlayStation(3/4/Vita), and Wii(U/3DS/Switch).');
    description.push(' ');
    description.push('5️⃣ - <@&750517524738605087>');
    description.push('Notifies you with Ubisoft games and DLCs that are currently free.');
    let embed = new MessageEmbed()
        .setColor('#ffff00')
        .setAuthor('Quarantine Gaming: Free Game Updates')
        .setTitle('Subscribe to get updated')
        .setThumbnail(g_client.user.displayAvatarURL())
        .setDescription(description.join('\n'))
        .setImage('https://media.playstation.com/is/image/SCEA/playstation-vue-hero-banner-desktop-01-us-22jan19?$native_nt$')
        .setFooter('Update your role by reacting below.');

    let reactions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
    return {
        message: embed,
        reactions: reactions
    };
}