const Discord = require('discord.js');

/**
 * @param {import('../app.js')} app
 * @param {Discord.Role} role
 */
module.exports = async function onRoleDelete(app, role) {
	if (app.utils.contains(role.name, ['Play', 'Text', 'Team'])) return;

	const embed = new Discord.MessageEmbed();
	embed.setAuthor('Quarantine Gaming: Role Submanager');
	embed.setTitle('Role Deleted');
	embed.setDescription(role);
	embed.setFooter(`${role.name} (${role.id})`);
	embed.setTimestamp();
	embed.setColor(role.color);
	await app.message_manager.sendToChannel(app.utils.constants.channels.server.logs, embed);
};