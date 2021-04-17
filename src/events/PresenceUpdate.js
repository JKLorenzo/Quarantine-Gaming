// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js');
// eslint-disable-next-line no-unused-vars
const { ExtendedMember } = require('../structures/Base.js');

/**
 * @param {import('../app.js')} app
 * @param {Discord.Presence} oldPresence
 * @param {Discord.Presence} newPresence
 */
module.exports = async function onPresenceUpdate(app, oldPresence, newPresence) {
	/** @type {ExtendedMember} */
	const member = newPresence.member ? newPresence.member : oldPresence.member;

	if (newPresence.status == 'offline') {
		// general.memberOffline(member);
	}

	// Sort Changed Activities
	let oldActivities = new Array(), newActivities = new Array();
	if (oldPresence) oldActivities = oldPresence.activities.filter(activity => activity.type == 'PLAYING').map(activity => activity.name.trim());
	if (newPresence) newActivities = newPresence.activities.filter(activity => activity.type == 'PLAYING').map(activity => activity.name.trim());
	const acitivityDifference = app.utils.compareArray(oldActivities, newActivities).map(game_name => {
		if (newActivities.includes(game_name)) {
			return {
				activity: newPresence.activities.find(activity => activity.name.trim() == game_name),
				new: true,
			};
		}
		else {
			return {
				activity: oldPresence.activities.find(activity => activity.name.trim() == game_name),
				new: false,
			};
		}
	});

	for (const data of acitivityDifference) {
		const activity = data.activity;
		const game_name = activity.name.trim();
		if (!app.database_manager.gameBlacklisted(game_name) && (activity.applicationID || app.database_manager.gameWhitelisted(game_name))) {
			const streaming_role = app.role(app.utils.constants.roles.streaming);
			const game_role = app.guild.roles.cache.find(role => role.name == game_name) || await app.role_manager.create({ name: game_name, color: app.utils.constants.colors.game_role });
			let play_role = app.guild.roles.cache.find(role => role.name == 'Play ' + game_name);

			if (!app.guild.roles.cache.find(role => role.name == game_name + ' ⭐')) await app.role_manager.create({ name: game_name + ' ⭐', color: app.utils.constants.colors.game_role_mentionable, mentionable: true });

			if (data.new) {
				// Update database
				await member.updateGameRole(game_role);

				if (play_role) {
					// Bring Play Role to Top
					play_role.setPosition(streaming_role.position - 1);
				}
				else {
					// Create Play Role
					play_role = await app.role_manager.create({ name: 'Play ' + game_name, color: app.utils.constants.colors.play_role, position: streaming_role.position, hoist: true });
				}
				await app.role_manager.add(member, game_role);
				await app.role_manager.add(member, play_role);
			}
			else if (play_role) {
				// Remove Play Role from this member
				if (member.roles.cache.has(play_role.id)) {
					await app.role_manager.remove(member, play_role);
				}
				// Delete Play Role
				if (play_role.members.array().length == 0) {
					await app.role_manager.delete(play_role);
				}
			}
		}
	}
};