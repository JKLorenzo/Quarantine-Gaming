const { MessageEmbed } = require('discord.js');
const { constants } = require('../utils/Base.js');

/**
 * @typedef {import('../structures/Base.js').Client} Client
 * @typedef {import('discord.js').Role} Role
 */

/**
 * @param {Client} client
 * @param {Role} role
 */
module.exports = async function onRoleCreate(client, role) {
	if (role.name.startsWith('Team 🔰')) return;
	if (role.name.startsWith('Play ') && role.hexColor == constants.colors.play_role) return;

	const embed = new MessageEmbed();
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
	await client.message_manager.sendToChannel(constants.channels.server.logs, embed);
};