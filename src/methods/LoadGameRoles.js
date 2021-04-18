const { contains, constants } = require('../utils/Base.js');

/**
 * @typedef {import('../structures/Base.js').Client} Client
 * @typedef {import('../structures/Base.js').ExtendedMember} ExtendedMember
 */

/** @param {Client} client */
module.exports = async function LoadGameRoles(client) {
	/** @type {ExtendedMember[]} */
	const members = client.guild.members.cache.array();

	// Add and create game roles and play roles
	for (const member of members.filter(this_member => !this_member.user.bot)) {
		const game_activities = member.presence.activities.filter(activity => activity.type == 'PLAYING');
		for (const game_activity of game_activities) {
			const game_name = game_activity.name.trim();
			if (client.database_manager.gameBlacklisted(game_name)) continue;
			if (!(game_activity.applicationID || client.database_manager.gameWhitelisted(game_name))) continue;
			// Game Role
			const game_role = client.guild.roles.cache.find(role => role.name == game_name) || await client.role_manager.create({ name: game_name, color: constants.colors.game_role });
			await member.updateGameRole(game_role);
			// Game Role Mentionable
			if (!client.guild.roles.cache.find(role => role.name == game_name + ' ⭐')) {
				await client.role_manager.create({ name: game_name + ' ⭐', color: constants.colors.game_role_mentionable, mentionable: true });
			}
			// Play Role
			const streaming_role = client.role(constants.roles.streaming);
			const play_role = client.guild.roles.cache.find(role => role.name == 'Play ' + game_name) || await client.role_manager.create({ name: 'Play ' + game_name, color: constants.colors.play_role, position: streaming_role.position, hoist: true });
			if (member.roles.cache.has(play_role.id)) continue;
			await client.role_manager.add(member, play_role);
			await play_role.setPosition(streaming_role.position - 1);
		}
	}

	// Delete unused game roles
	for (const game_role of client.guild.roles.cache.array().filter(role => role.hexColor == constants.colors.game_role)) {
		if (game_role.members.array().length > 0 && !client.database_manager.gameBlacklisted(game_role.name)) continue;
		await client.role_manager.delete(game_role);
	}

	// Delete unused game role mentionables
	for (const game_role_mentionable of client.guild.roles.cache.array().filter(role => role.hexColor == constants.colors.game_role_mentionable)) {
		if (client.guild.roles.cache.find(role => role.hexColor == constants.colors.game_role && game_role_mentionable.name.startsWith(role.name))) continue;
		await client.role_manager.delete(game_role_mentionable);
	}

	// Delete unused play roles
	for (const play_role of client.guild.roles.cache.array().filter(role => role.hexColor == constants.colors.play_role)) {
		const game_name = play_role.name.substring(5);
		for (const member of play_role.members.array()) {
			const games_playing = member.presence.activities.filter(activity => activity.type == 'PLAYING').map(activity => activity.name.trim());
			if (games_playing.includes(game_name)) continue;
			await client.role_manager.remove(member, play_role);
		}
		if (play_role.members.array().length > 0 && client.guild.roles.cache.find(role => role.hexColor == constants.colors.game_role && contains(play_role.name, role.name))) continue;
		await client.role_manager.delete(play_role);
	}
};