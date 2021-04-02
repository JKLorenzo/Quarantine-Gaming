const Discord = require('discord.js');

/**
 * @param {import('../app.js')} app
 * @param {Discord.User} oldUser
 * @param {Discord.User} newUser
 */
module.exports = async function onUserUpdate(app, oldUser, newUser) {
	if (app.member(newUser)) return;

	const embed = new Discord.MessageEmbed();
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
	if (embed.fields.length > 1) app.message_manager.sendToChannel(app.utils.constants.channels.server.logs, embed);
};