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
	if (client.member(newUser)) return;

	const embed = new MessageEmbed();
	embed.setAuthor('Quarantine Gaming: Member Submanager');
	embed.setTitle('User Update');
	embed.setThumbnail(newUser.displayAvatarURL());
	embed.addField('User:', newUser);

	// Avatar
	if (oldUser.displayAvatarURL() != newUser.displayAvatarURL()) {
		embed.addField('Avatar:', `New [Avatar](${newUser.displayAvatarURL()})`);
	}

	// Username
	if (oldUser.username != newUser.username) {
		embed.addField('Username:', `Old: ${oldUser.username}\nNew: ${newUser.username}`);
	}

	// Tag
	if (oldUser.tag != newUser.tag) {
		embed.addField('Tag:', `Old: ${oldUser.tag}\nNew: ${newUser.tag}`);
	}

	embed.setFooter(`${newUser.tag} (${newUser.id})`);
	embed.setTimestamp();
	embed.setColor('#7bff64');
	if (embed.fields.length > 1) client.message_manager.sendToChannel(constants.channels.server.logs, embed);
};