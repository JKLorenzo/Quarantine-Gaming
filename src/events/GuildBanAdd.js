const { MessageEmbed } = require('discord.js');
const { constants } = require('../utils/Base.js');

/**
 * @typedef {import('../structures/Base.js').Client} Client
 * @typedef {import('discord.js').User} User
 */

/**
 * @param {Client} client
 * @param {User} user
 */
module.exports = async function onGuildBanAdd(client, user) {
	await client.message_manager.sendToChannel(constants.channels.server.logs, new MessageEmbed({
		author: { name: 'Quarantine Gaming: Server Gateway Events' },
		title: 'Member Ban Implemented',
		description: `**Profile:** ${user}`,
		thumbnail: { url: user.displayAvatarURL() },
		footer: { text: `Reference ID: ${user.id}` },
		color: '#FF2222',
	}));
};