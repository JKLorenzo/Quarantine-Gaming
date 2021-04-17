const Discord = require('discord.js');

/**
 * @param {import('../app.js')} app
 * @param {Discord.Role} role
 */
module.exports = async function onRoleCreate(app, role) {
	if (app.utils.contains(role.name, ['Play', 'Text', 'Team'])) return;

	const embed = new Discord.MessageEmbed();
	embed.setAuthor('Quarantine Gaming: Role Submanager');
	embed.setTitle('Role Created');
	embed.setDescription(role);
	const properties = new Array();
	if (role.mentionable) properties.push('Mentionable');
	if (role.hoist) properties.push('Hoisted');
	if (role.permissions.bitfield) properties.push(role.permissions.bitfield);
	if (properties.length > 0) embed.addField('Properties:', properties.join(', '), true);
	embed.setFooter(`${role.name} (${role.id})`);
	embed.setTimestamp();
	embed.setColor(role.color);
	await app.message_manager.sendToChannel(app.utils.constants.channels.server.logs, embed);
};