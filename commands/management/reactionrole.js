const Discord = require('discord.js');
const { Command } = require('discord.js-commando');
const constants = require('../../modules/constants.js');
/** @type {import('../../modules/app.js')} */
let app;
/** @type {import('../../modules/message_manager.js')} */
let message_manager;
/** @type {import('../../modules/reaction_manager.js')} */
let reaction_manager;

const modeSelector = {
    /** @type {String} */
    mode: ''
}

module.exports = class ReactionRole extends Command {
    constructor(client) {
        super(client, {
            name: 'reactionrole',
            group: 'management',
            memberName: 'reactionrole',
            description: '[Staff] Send or update a reaction role.',
            userPermissions: ["ADMINISTRATOR"],
            guildOnly: true,
            args: [
                {
                    key: 'mode',
                    prompt: 'Create or update?',
                    type: 'string',
                    oneOf: ['create', 'update'],
                    validate: this_mode => {
                        modeSelector.mode = this_mode;
                        return this_mode == 'create' || this_mode == 'update';
                    }
                },
                {
                    key: 'type',
                    prompt: 'NSFW, FGU, or Multiplayer?',
                    type: 'string',
                    oneOf: ['nsfw', 'fgu', 'multiplayer']
                },
                {
                    key: 'msgID',
                    prompt: 'Message ID',
                    type: 'string',
                    default: '',
                    validate: async msgID => {
                        // Link 
                        app = this.client.modules.app;
                        message_manager = this.client.modules.message_manager;
                        reaction_manager = this.client.modules.reaction_manager;

                        const message_to_update = app.message(constants.channels.server.roles, msgID) || await app.channel(constants.channels.server.roles).messages.fetch(msgID);

                        if (modeSelector.mode == 'create' || message_to_update)
                            return true;
                        return false;
                    }
                }
            ]
        });
    }

    /**
     * @param {Discord.Message} message 
     * @param {{mode: 'create' | 'update', type: 'nsfw' | 'fgu' | 'multiplayer', msgID: String}} 
     */
    async run(message, { mode, type, msgID }) {
        // Link 
        app = this.client.modules.app;
        message_manager = this.client.modules.message_manager;
        reaction_manager = this.client.modules.reaction_manager;

        // Check user permissions
        if (!app.hasRole(message.author, [constants.roles.staff])) {
            return message.reply("You don't have permissions to use this command.");
        }

        /** @type {NSFW | FreeGameUpdates} */
        let ReactionRoleType;
        switch (type) {
            case 'nsfw':
                ReactionRoleType = NSFW;
                break;
            case 'fgu':
                ReactionRoleType = FreeGameUpdates;
                break;
            case 'multiplayer':
                ReactionRoleType = Multiplayer;
                break;
        }

        /** @type {Message} */
        let ReferenceMessage;
        switch (mode) {
            case 'create':
                ReferenceMessage = await message_manager.sendToChannel(constants.channels.server.roles, ReactionRoleType().message);
                for (const emoji of ReactionRoleType().reactions) {
                    await reaction_manager.addReaction(ReferenceMessage, emoji);
                }
                break;
            case 'update':
                const message_to_update = app.message(constants.channels.server.roles, msgID) || await app.channel(constants.channels.server.roles).messages.fetch(msgID);
                if (message_to_update) {
                    ReferenceMessage = await message_to_update.edit(ReactionRoleType().message);
                    for (const emoji of ReactionRoleType().reactions) {
                        await reaction_manager.addReaction(message_to_update, emoji);
                    }
                }
                break;
        }

        if (ReferenceMessage) {
            message.reply(`Done! Reference ID: \`${ReferenceMessage.id}\``);
        } else {
            message.reply(`Failed to ${mode} ${String(type).toUpperCase()}.`);
        }
    }
};

function NSFW() {
    const description = new Array();
    description.push(`${app.role(constants.roles.nsfw_bot)} and ${app.channel(constants.channels.text.explicit)} channel will be unlocked after getting the role.`);
    description.push(' ');
    description.push(`🔴 - ${app.role(constants.roles.nsfw)} (Not Safe For Work)`);
    description.push('The marked content may contain nudity, intense sexuality, profanity, violence or other potentially disturbing subject matter.');
    const embed = new Discord.MessageEmbed();
    embed.setColor('#ffff00');
    embed.setAuthor('Quarantine Gaming: NSFW');
    embed.setTitle('Unlock NSFW Bots and Channel');
    embed.setDescription(description.join('\n'));
    embed.setImage(constants.images.nsfw_banner);
    embed.setFooter('Update your role by reacting below.');
    return {
        message: embed,
        reactions: ['🔴']
    }
}

function FreeGameUpdates() {
    const description = new Array();
    description.push(`All notifications will be made available on our ${app.channel(constants.channels.integrations.free_games)} channel.`);
    description.push(' ');
    description.push(`1️⃣ - ${app.role(constants.roles.steam)}`);
    description.push('Notifies you with Steam games and DLCs that are currently free.');
    description.push(' ');
    description.push(`2️⃣ - ${app.role(constants.roles.epic)}`);
    description.push('Notifies you with Epic games and DLCs that are currently free.');
    description.push(' ');
    description.push(`3️⃣ - ${app.role(constants.roles.gog)}`);
    description.push('Notifies you with GOG games and DLCs that are currently free.');
    description.push(' ');
    description.push(`4️⃣ - ${app.role(constants.roles.console)}`);
    description.push('Notifies you with games and DLCs that are currently free for Xbox(One/360), PlayStation(3/4/Vita), and Wii(U/3DS/Switch).');
    description.push(' ');
    description.push(`5️⃣ - ${app.role(constants.roles.ubisoft)}`);
    description.push('Notifies you with Ubisoft games and DLCs that are currently free.');
    const embed = new Discord.MessageEmbed();
    embed.setColor('#ffff00');
    embed.setAuthor('Quarantine Gaming: Free Game Updates');
    embed.setTitle('Subscribe to get Updated');
    embed.setDescription(description.join('\n'));
    embed.setImage(constants.images.free_games_banner);
    embed.setFooter('Update your role by reacting below.');
    return {
        message: embed,
        reactions: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣']
    };
}

function Multiplayer() {
    const description = new Array();
    description.push(`The ${app.channel(constants.channels.integrations.game_invites)} channel will be unlocked after getting the role.`);
    description.push(' ');
    description.push(`⚔ - ${app.role(constants.roles.multiplayer)}`);
    description.push('Receive game invites from other members through Game Roles. Do `!play` to get started.');
    const embed = new Discord.MessageEmbed();
    embed.setColor('#ffff00');
    embed.setAuthor('Quarantine Gaming: Multiplayer');
    embed.setTitle('Receive Game Invites from Members');
    embed.setDescription(description.join('\n'));
    embed.setImage(constants.images.multiplayer_banner);
    embed.setFooter('Update your role by reacting below.');
    return {
        message: embed,
        reactions: ['⚔']
    }
}