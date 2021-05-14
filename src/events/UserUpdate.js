const { MessageEmbed } = require('discord.js');
const { constants } = require('../utils/Base.js');

/**
 * @typedef {import('../structures/Base.js').Client} Client
 * @typedef {import('discord.js').User} User
 */

/**
 * @param {Client} client
 * @param {User} oldUser
 * @param {User} newUser
 */
module.exports = async function onUserUpdate(client, oldUser, newUser) {
	const member = client.member(newUser);

	const description = [`**Profile:** ${member}`];
	if (oldUser.username != newUser.username) description.push(`**Username:** ${oldUser.username} -> ${newUser.username}`);
	if (oldUser.tag != newUser.tag) description.push(`**Tagname:** ${oldUser.tag} -> ${newUser.tag}`);
	if (oldUser.displayAvatarURL() != newUser.displayAvatarURL()) description.push(`**Avatar:** [New Avatar](${newUser.displayAvatarURL()})`);

	if (description.length > 1) {
		client.message_manager.sendToChannel(constants.interface.channels.logs, new MessageEmbed({
			author: { name: 'Quarantine Gaming: Member Update Events' },
			title: 'User Property Changed',
			description: description.join('\n'),
			thumbnail: { url: newUser.displayAvatarURL() },
			footer: { text: `Reference ID: ${newUser.id}` },
			color: '#E1F358',
		}));
	}
};