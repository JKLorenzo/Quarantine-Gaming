// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js');
/** @param {import('../app.js')} app */
module.exports = async function LoadDedicatedChannels(app) {
	const ErrorTicketManager = new app.utils.ErrorTicketManager('Dedicated Channel Loading');

	for (const team_role of app.guild.roles.cache.array().filter(role => role.name.startsWith('Team'))) {
		/** @type {Discord.CategoryChannel} */
		const dedicated_text_category = app.guild.channels.cache.get(app.utils.constants.channels.category.dedicated);
		/** @type {Discord.TextChannel} */
		const dedicated_text_channel = dedicated_text_category.children.array().find(channel => {
			/** @type {Discord.TextChannel} */
			const text_channel = channel;
			if (text_channel.topic && app.utils.parseMention(text_channel.topic.split(' ')[1]) == team_role.id) return true;
			return false;
		});
		if (!dedicated_text_channel) {
			await app.role_manager.delete(team_role);
			continue;
		}
		/** @type {Discord.VoiceChannel} */
		const dedicated_voice_channel = app.channel(app.utils.parseMention(dedicated_text_channel.topic.split(' ')[0]));
		if (!dedicated_voice_channel) {
			await app.role_manager.delete(team_role).catch(error => app.error_manager.mark(ErrorTicketManager.create(`TeamRoleDelete ${team_role}`, error)));
			await app.channel_manager.delete(dedicated_text_channel).catch(error => app.error_manager.mark(ErrorTicketManager.create(`TextChannelDelete ${dedicated_text_channel}`, error)));
			continue;
		}
		const team_members = team_role.members.array().filter(member => !member.user.bot);
		if (team_members.length == 0) {
			await app.role_manager.delete(team_role).catch(error => app.error_manager.mark(ErrorTicketManager.create(`TeamRoleDelete ${team_role}`, error)));
			await app.channel_manager.delete(dedicated_text_channel).catch(error => app.error_manager.mark(ErrorTicketManager.create(`TextChannelDelete ${dedicated_text_channel}`, error)));
			await app.channel_manager.delete(dedicated_voice_channel).catch(error => app.error_manager.mark(ErrorTicketManager.create(`VoiceChannelDelete ${dedicated_voice_channel}`, error)));
			continue;
		}
		for (const this_member of team_members) {
			if (dedicated_voice_channel.members.array().includes(this_member)) {
				// Add team role
				if (this_member.roles.cache.has(team_role.id)) continue;
				await app.role_manager.add(this_member, team_role).catch(error => app.error_manager.mark(ErrorTicketManager.create(`TeamRoleAdd ${this_member} ${team_role}`, error)));
			}
			else {
				// Remove team role
				if (!this_member.roles.cache.has(team_role.id)) continue;
				await app.role_manager.remove(this_member, team_role).catch(error => app.error_manager.mark(ErrorTicketManager.create(`TeamRoleRemove ${this_member} ${team_role}`, error)));
			}
		}
	}
};