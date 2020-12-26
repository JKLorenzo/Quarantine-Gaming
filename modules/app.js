const { CommandoClient } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');
const constants = require('./constants.js');
const functions = require('./functions.js');
const message = require('./message.js');
const error_manager = require('./error_manager.js');

let global_client = new CommandoClient();
let initialized = false;

const error_ticket = error_manager.for('app.js');

module.exports = {
    isInitialized: initialized,
    client: global_client,
    guild: global_client.guilds.cache.get(constants.guild),
    channel: function (resolvable) {
        return global_client.channels.resolve(resolvable);
    },
    role: function (resolvable) {
        return global_client.roles.resolve(resolvable);
    },
    member: function (user) {
        return global_client.member(user);
    },
    initialize: async function (client) {
        global_client = client;

        try {
            await this.setActivity('!help');

            if (process.env.STARTUP_REASON) {
                const embed = new MessageEmbed();
                embed.setColor('#ffff00');
                embed.setAuthor('Quarantine Gaming', client.user.displayAvatarURL());
                embed.setTitle('Startup Initiated');
                embed.addField('Reason', process.env.STARTUP_REASON);

                await message.sendToChannel(constants.channels.qg.logs, embed);
            }
        } catch (error) {
            error_manager.mark(new error_ticket('instantiate', error));
        }

        initialized = true;
    },
    setActivity: function (value, type = 'LISTENING') {
        return global_client.user.setActivity(value.trim(), {
            type: type.trim().toUpperCase()
        });
    }
}