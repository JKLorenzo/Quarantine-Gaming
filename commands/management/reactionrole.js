const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');
const constants = require('../../modules/constants.js');
const functions = require('../../modules/functions.js');
let app = require('../../modules/app.js');
let message_manager = require('../../modules/message_manager.js');
let reaction_manager = require('../../modules/reaction_manager.js');

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
        // Link 
        const Modules = functions.parseModules(GlobalModules);
        app = Modules.app;
        message_manager = Modules.message_manager;
        reaction_manager = Modules.reaction_manager;

        /** @type {NSFW | FreeGameUpdates} */
        let ReactionRoleType;
        switch (type) {
            case 'nsfw':
                ReactionRoleType = NSFW;
                break;
            case 'fgu':
                ReactionRoleType = FreeGameUpdates;
                break;
        }

        switch (mode) {
            case 'create':
                const CreateMessage = await message_manager.sendToChannel(constants.channels.server.roles, ReactionRoleType().message);
                for (const emoji of ReactionRoleType().reactions) {
                    await reaction_manager.addReaction(CreateMessage, emoji);
                }
                break;
            case 'update':
                const UpdateMessage = await app.message(constants.channels.server.roles, msgID);
                if (UpdateMessage) {
                    await UpdateMessage.edit(ReactionRoleType().message);
                    for (const emoji of ReactionRoleType().reactions) {
                        await reaction_manager.addReaction(UpdateMessage, emoji);
                    }
                }
                break;
        }
        message.reply('Done!');
    }
};

function NSFW() {
    const embed = new MessageEmbed();
    embed.setColor('#ffff00');
    embed.setAuthor('Quarantine Gaming: NSFW Content');
    embed.setTitle('Unlock NSFW Bots and Channel');
    embed.setThumbnail(app.client().user.displayAvatarURL());
    embed.setDescription(`${app.role(constants.roles.nsfw_bot)} and ${app.channel(constants.channels.text.explicit)} channel will be unlocked after getting the role.`);
    embed.addField(`🔴 - ${app.role(constants.roles.nsfw)} (Not Safe For Work)`, 'The marked content may contain nudity, intense sexuality, profanity, violence or other potentially disturbing subject matter.');
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
    description.push(`1️⃣ - ${constants.roles.steam}`);
    description.push('Notifies you with Steam games and DLCs that are currently free.');
    description.push(' ');
    description.push(`2️⃣ - ${constants.roles.epic}`);
    description.push('Notifies you with Epic games and DLCs that are currently free.');
    description.push(' ');
    description.push(`3️⃣ - ${constants.roles.gog}`);
    description.push('Notifies you with GOG games and DLCs that are currently free.');
    description.push(' ');
    description.push(`4️⃣ - ${constants.roles.console}`);
    description.push('Notifies you with games and DLCs that are currently free for Xbox(One/360), PlayStation(3/4/Vita), and Wii(U/3DS/Switch).');
    description.push(' ');
    description.push(`5️⃣ - ${constants.roles.ubisoft}`);
    description.push('Notifies you with Ubisoft games and DLCs that are currently free.');
    const embed = new MessageEmbed();
    embed.setColor('#ffff00');
    embed.setAuthor('Quarantine Gaming: Free Game Updates');
    embed.setTitle('Subscribe to get updated');
    embed.setThumbnail(app.client().user.displayAvatarURL());
    embed.setDescription(description.join('\n'));
    embed.setImage(constants.images.free_games_banner);
    embed.setFooter('Update your role by reacting below.');
    return {
        message: embed,
        reactions: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣']
    };
}