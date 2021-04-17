/** @param {import('../app.js')} app */
module.exports = async function LoadGameRoles(app) {
	const ErrorTicketManager = new app.utils.ErrorTicketManager('LoadGameRoles');

	/** @type {import('../structures/Base.js').ExtendedMember[]} */
	const members = app.guild.members.cache.array();

	try {
		// Add and create game roles and play roles
		for (const member of members.filter(this_member => !this_member.user.bot)) {
			const game_activities = member.presence.activities.filter(activity => activity.type == 'PLAYING');
			for (const game_activity of game_activities) {
				const game_name = game_activity.name.trim();
				if (app.database_manager.gameBlacklisted(game_name)) continue;
				if (!(game_activity.applicationID || app.database_manager.gameWhitelisted(game_name))) continue;
				// Game Role
				const game_role = app.guild.roles.cache.find(role => role.name == game_name) || await app.role_manager.create({ name: game_name, color: app.utils.constants.colors.game_role });
				await member.updateGameRole(game_role);
				// Game Role Mentionable
				if (!app.guild.roles.cache.find(role => role.name == game_name + ' ⭐')) {
					await app.role_manager.create({ name: game_name + ' ⭐', color: app.utils.constants.colors.game_role_mentionable, mentionable: true });
				}
				// Play Role
				const streaming_role = app.role(app.utils.constants.roles.streaming);
				const play_role = app.guild.roles.cache.find(role => role.name == 'Play ' + game_name) || await app.role_manager.create({ name: 'Play ' + game_name, color: app.utils.constants.colors.play_role, position: streaming_role.position, hoist: true });
				if (member.roles.cache.has(play_role.id)) continue;
				await app.role_manager.add(member, play_role);
				await play_role.setPosition(streaming_role.position - 1);
			}
		}
	}
	catch(error) {
		app.error_manager.mark(ErrorTicketManager.create('AddCreateGamePlayRoles', error));
		throw error;
	}

	try {
		// Delete unused game roles
		for (const game_role of app.guild.roles.cache.array().filter(role => role.hexColor == app.utils.constants.colors.game_role)) {
			if (game_role.members.array().length > 0 && !app.database_manager.gameBlacklisted(game_role.name)) continue;
			await app.role_manager.delete(game_role);
		}

		// Delete unused game role mentionables
		for (const game_role_mentionable of app.guild.roles.cache.array().filter(role => role.hexColor == app.utils.constants.colors.game_role_mentionable)) {
			if (app.guild.roles.cache.find(role => role.hexColor == app.utils.constants.colors.game_role && game_role_mentionable.name.startsWith(role.name))) continue;
			await app.role_manager.delete(game_role_mentionable);
		}

		// Delete unused play roles
		for (const play_role of app.guild.roles.cache.array().filter(role => role.hexColor == app.utils.constants.colors.play_role)) {
			const game_name = play_role.name.substring(5);
			for (const member of play_role.members.array()) {
				const games_playing = member.presence.activities.filter(activity => activity.type == 'PLAYING').map(activity => activity.name.trim());
				if (games_playing.includes(game_name)) continue;
				await app.role_manager.remove(member, play_role);
			}
			if (play_role.members.array().length > 0 && app.guild.roles.cache.find(role => role.hexColor == app.utils.constants.colors.game_role && app.utils.contains(play_role.name, role.name))) continue;
			await app.role_manager.delete(play_role);
		}
	}
	catch(error) {
		app.error_manager.mark(ErrorTicketManager.create('DeleteUnusedGamePlayRoles', error));
		throw error;
	}
};