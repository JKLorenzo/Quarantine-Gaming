const Discord = require('discord.js');

/**
 * @param {import('../app.js')} app
 * @param {Discord.Role} oldRole
 * @param {Discord.Role} newRole
 */
module.exports = async function onRoleUpdate(app, oldRole, newRole) {
	if (app.utils.contains(newRole.name, ['Play', 'Text', 'Team'])) return;

	const embed = new Discord.MessageEmbed();
	embed.setAuthor('Quarantine Gaming: Role Submanager');
	embed.setTitle('Role Updated');
	embed.setDescription(newRole);
	if (oldRole.name != newRole.name) embed.addField('Name:', `Old: ${oldRole.name}\nNew: ${newRole.name}`);
	if (oldRole.hexColor != newRole.hexColor) embed.addField('Color:', `Old: ${oldRole.hexColor}\nNew: ${newRole.hexColor}`);
	if (oldRole.mentionable != newRole.mentionable) embed.addField('Mentionable:', newRole.mentionable);
	if (oldRole.hoist != newRole.hoist) embed.addField('Hoisted:', newRole.hoist);
	if (oldRole.permissions.bitfield != newRole.permissions.bitfield) embed.addField('BitField Permissions:', `Old: ${oldRole.permissions.bitfield}\nNew: ${newRole.permissions.bitfield}`);
	embed.setFooter(`${newRole.name} (${newRole.id})`);
	embed.setTimestamp();
	embed.setColor(newRole.color);
	if (embed.fields.length > 0) await app.message_manager.sendToChannel(app.utils.constants.channels.server.logs, embed);
};