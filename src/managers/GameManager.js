import { Collection } from 'discord.js';
import { ErrorTicketManager, ProcessQueue, contains, sleep, constants } from '../utils/Base.js';

/**
 * @typedef {import('discord.js').Presence} Presence
 * @typedef {import('discord.js').Activity} Activity
 * @typedef {import('../structures/Base').Client} Client
 * @typedef {import('../structures/Base').ExtendedMember} ExtendedMember
 */

/**
 * @typedef {Object} ActivityData
 * @property {Activity} activity
 * @property {'OLD' | 'NEW'} status
 */

const ETM = new ErrorTicketManager('Game Manager');

export default class GameManager {
	/** @param {Client} client */
	constructor(client) {
		this.client = client;
	}

	async init() {
		// Subscribe to presence events
		this.client.on('presenceUpdate', (oldPresence, newPresence) => {
			if (newPresence.guild.id == constants.guild) return this.processPresenceUpdate(oldPresence, newPresence);
		});

		await this.reload();
		await this.clearExpired();
	}

	/**
	 * Reload all the game roles and play roles of all members
	 */
	async reload() {
		try {
			/** @type {ExtendedMember[]} */
			const members = this.client.guild.members.cache.array();

			// Add and create game roles and play roles
			for (const member of members.filter(this_member => !this_member.user.bot)) {
				const game_activities = member.presence.activities.filter(activity => activity.type == 'PLAYING');
				for (const game_activity of game_activities) {
					const game_name = game_activity.name.trim();
					if (this.client.database_manager.gameBlacklisted(game_name)) continue;
					if (!(game_activity.applicationID || this.client.database_manager.gameWhitelisted(game_name))) continue;
					// Game Role
					const game_role = this.client.guild.roles.cache.find(role => role.name == game_name)
						?? await this.client.role_manager.create({ name: game_name, color: constants.colors.game_role });
					// Game Role Mentionable
					if (!this.client.guild.roles.cache.find(role => role.name == game_name + ' ⭐')) {
						await this.client.role_manager.create({ name: game_name + ' ⭐', color: constants.colors.game_role_mentionable, mentionable: true });
					}
					await this.client.role_manager.add(member, game_role);
					// Play Role
					const streaming_role = this.client.role(constants.roles.streaming);
					const play_role = this.client.guild.roles.cache.find(role => role.name == 'Play ' + game_name)
						?? await this.client.role_manager.create({ name: 'Play ' + game_name, color: constants.colors.play_role, position: streaming_role.position, hoist: true });
					if (member.roles.cache.has(play_role.id)) continue;
					await this.client.role_manager.add(member, play_role);
					await play_role.setPosition(streaming_role.position - 1);
				}
			}

			// Delete unused game roles
			for (const game_role of this.client.guild.roles.cache.array().filter(role => role.hexColor == constants.colors.game_role)) {
				if (game_role.members.array().length > 0 && !this.client.database_manager.gameBlacklisted(game_role.name)) continue;
				await this.client.role_manager.delete(game_role);
			}

			// Delete unused game role mentionables
			for (const game_role_mentionable of this.client.guild.roles.cache.array().filter(role => role.hexColor == constants.colors.game_role_mentionable)) {
				if (this.client.guild.roles.cache.find(role => role.hexColor == constants.colors.game_role && game_role_mentionable.name.startsWith(role.name))) continue;
				await this.client.role_manager.delete(game_role_mentionable);
			}

			// Delete unused play roles
			for (const play_role of this.client.guild.roles.cache.array().filter(role => role.hexColor == constants.colors.play_role)) {
				const game_name = play_role.name.substring(5);
				for (const member of play_role.members.array()) {
					const games_playing = member.presence.activities.filter(activity => activity.type == 'PLAYING').map(activity => activity.name.trim());
					if (games_playing.includes(game_name)) continue;
					await this.client.role_manager.remove(member, play_role);
				}
				if (play_role.members.array().length > 0 && this.client.guild.roles.cache.find(role => role.hexColor == constants.colors.game_role && contains(play_role.name, role.name))) continue;
				await this.client.role_manager.delete(play_role);
			}
		} catch (error) {
			this.client.error_manager.mark(ETM.create('reload', error));
		}
	}

	/**
 	 * @param {Presence} oldPresence
 	 * @param {Presence} newPresence
 	 */
	async processPresenceUpdate(newPresence, oldPresence) {
		try {
			/** @type {ExtendedMember} */
			const member = newPresence ? newPresence.member : oldPresence.member;

			/** @type {Collection<String, ActivityData>} */
			const oldGames = new Collection();
			/** @type {Collection<String, ActivityData>} */
			const newGames = new Collection();

			if (oldPresence) oldPresence.activities.filter(activity => activity.type === 'PLAYING').forEach(activity => oldGames.set(activity.name.trim(), { activity: activity, status: 'OLD' }));
			if (newPresence) newPresence.activities.filter(activity => activity.type === 'PLAYING').forEach(activity => newGames.set(activity.name.trim(), { activity: activity, status: 'NEW' }));
			const difference = newGames.difference(oldGames);

			for (const [game_name, { activity, status }] of difference) {
				const not_blacklisted = !this.client.database_manager.gameBlacklisted(game_name);
				const valid = activity.applicationID || this.client.database_manager.gameWhitelisted(game_name);
				if (not_blacklisted && valid) {
					const streaming_role = this.client.role(constants.roles.streaming);
					const game_role = this.client.guild.roles.cache.find(role => role.name == game_name)
						?? await this.client.role_manager.create({ name: game_name, color: constants.colors.game_role });
					let play_role = this.client.guild.roles.cache.find(role => role.name == 'Play ' + game_name);
					if (!this.client.guild.roles.cache.some(role => role.name == game_name + ' ⭐')) await this.client.role_manager.create({ name: game_name + ' ⭐', color: constants.colors.game_role_mentionable, mentionable: true });

					switch (status) {
					case 'NEW':
						if (play_role) {
							play_role.setPosition(streaming_role.position - 1);
						} else {
							play_role = await this.client.role_manager.create({ name: 'Play ' + game_name, color: constants.colors.play_role, position: streaming_role.position, hoist: true });
						}
						this.client.role_manager.add(member, game_role);
						this.client.role_manager.add(member, play_role);
						break;
					case 'OLD':
						if (play_role) {
							if (member.hasRole(play_role)) await this.client.role_manager.remove(member, play_role);
							if (play_role.members.array().length == 0) await this.client.role_manager.delete(play_role);
						}
						break;
					}
				}
			}
		} catch (error) {
			this.client.error_manager.mark(ETM.create('processPresenceUpdate', error));
		}
	}

	async clearExpired() {
		try {
			/** @type {ExtendedMember[]} */
			const members = this.client.guild.members.cache.array();
			const queuer = new ProcessQueue();
			for (const member of members) {
				if (member.user.bot) continue;
				const expired_game_roles_partial = await member.getExpiredGameRoles();
				for (const expired_game_role_partial of expired_game_roles_partial) {
					queuer.queue(async () => {
						await this.client.role_manager.remove(member, expired_game_role_partial.id);
					});
				}
			}
			await queuer.queue(async () => await sleep(1000));
		} catch (error) {
			this.client.error_manager.mark(ETM.create('clearExpired', error));
		}
	}
}