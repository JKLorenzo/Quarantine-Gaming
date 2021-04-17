const Discord = require('discord.js');
// eslint-disable-next-line no-unused-vars
const { ExtendedMember } = require('../structures/Base.js');

/**
 * @param {import('../app.js')} app
 * @param {ExtendedMember} oldMember
 * @param {ExtendedMember} newMember
 */
module.exports = async function onGuildMemberUpdate(app, oldMember, newMember) {
	if (newMember.pending == false && oldMember.pending != newMember.pending) {
		await app.actions.memberScreening(newMember);
	}

	const embed = new Discord.MessageEmbed();
	embed.setAuthor('Quarantine Gaming: Member Submanager');
	embed.setTitle('Member Update');
	embed.setThumbnail(newMember.user.displayAvatarURL());
	embed.addField('User:', newMember);

	// Display Name
	if (newMember.displayName != oldMember.displayName) {
		embed.addField('Display Name', `Old: ${oldMember.displayName}\nNew: ${newMember.displayName}`);
	}

	// Role
	if (newMember.roles.cache.size != oldMember.roles.cache.size) {
		const added = new Array(), removed = new Array();
		for (const this_role of newMember.roles.cache.difference(oldMember.roles.cache).array()) {
			if (app.utils.contains(this_role.name, ['Play', 'Text', 'Team'])) continue;
			if (app.utils.contains(this_role.id, app.utils.constants.roles.streaming)) continue;
			newMember.roles.cache.has(this_role.id) ? added.push(this_role.name) : removed.push(this_role.name);
		}
		if (added.length > 0) {
			embed.addField('Role Added:', added.join(', '));
		}
		if (removed.length > 0) {
			embed.addField('Role Removed:', removed.join(', '));
		}
	}
	embed.setFooter(`${newMember.user.tag} (${newMember.user.id})`);
	embed.setTimestamp();
	embed.setColor('#7bff64');
	if (embed.fields.length > 1) app.message_manager.sendToChannel(app.utils.constants.channels.server.logs, embed);
};