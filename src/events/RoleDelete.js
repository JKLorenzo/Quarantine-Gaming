const { MessageEmbed } = require('discord.js');
const { contains, constants } = require('../utils/Base.js');

/**
 * @typedef {import('../structures/Base.js').Client} Client
 * @typedef {import('discord.js').Role} Role
 */

/**
 * @param {Client} client
 * @param {Role} role
 */
module.exports = async function onRoleDelete(client, role) {
	if (contains(role.name, ['Play', 'Text', 'Team'])) return;

	const embed = new MessageEmbed();
	embed.setAuthor('Quarantine Gaming: Role Submanager');
	embed.setTitle('Role Deleted');
	embed.setDescription(role);
	embed.setFooter(`${role.name} (${role.id})`);
	embed.setTimestamp();
	embed.setColor(role.color);
	await client.message_manager.sendToChannel(constants.channels.server.logs, embed);
};