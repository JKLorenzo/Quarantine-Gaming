// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js');

module.exports = class RoleManager {
	/** @param {import('../app.js')} app */
	constructor(app) {
		this.app = app;
		this.queuer = new app.utils.ProcessQueue(1000);
	}

	/**
 	 * Creates a new role in the guild.
 	 * @param {{name: String, color?: ColorResolvable, hoist?: Boolean, position?: number, permissions?: PermissionResolvable, mentionable?: Boolean, reason?: String}} options
 	 * @returns {Discord.Role}
 	 */
	create(options) {
		console.log(`RoleCreate: Queueing ${this.queuer.totalID} (${options.name})`);
		return this.queuer.queue(async () => {
			let result, error;
			try {
				result = await this.app.guild.roles.create({
					data: {
						name: options.name,
						color: options.color,
						hoist: options.hoist,
						mentionable: options.mentionable,
						permissions: options.permissions,
						position: options.position,
					},
					reason: options.reason,
				});
			}
			catch (this_error) {
				error = this_error;
			}
			finally {
				console.log(`RoleCreate: Finished ${this.queuer.currentID} (${options.name})`);
			}
			if (error) throw error;
			return result;
		});
	}

	/**
 	 * Deletes a role from the guild.
 	 * @param {Discord.RoleResolvable} role
 	 * @param {String} reason
	 * @returns {Promise<Discord.Role>}
	 */
	delete(role, reason = '') {
		const this_role = this.app.role(role);
		console.log(`RoleDelete: Queueing ${this.queuer.totalID} (${this_role ? this_role.name : role})`);
		return this.queuer.queue(async function() {
			let result, error;
			try {
				result = await this_role.delete(reason);
			}
			catch (this_error) {
				error = this_error;
			}
			finally {
				console.log(`RoleDelete: Finished ${this.queuer.currentID} (${this_role ? this_role.name : role})`);
			}
			if (error) throw error;
			return result;
		});
	}

	/**
	 * Adds the role to the target user.
	 * @param {Discord.UserResolvable} user
	 * @param {Discord.RoleResolvable} role
	 * @param {String} reason
	 * @returns {Promise<Discord.Role>}
	 */
	add(user, role, reason = '') {
		const this_member = this.app.member(user);
		const this_role = this.app.role(role);
		console.log(`RoleAdd: Queueing ${this.queuer.totalID} (${this_member ? this_member.displayName : user} | ${this_role ? this_role.name : role})`);
		return this.queuer.queue(async () => {
			let result, error;
			try {
				return await this_member.roles.add(this_role, reason);
			}
			catch (this_error) {
				error = this_error;
			}
			finally {
				console.log(`RoleAdd: Finished ${this.queuer.currentID} (${this_member ? this_member.displayName : user} | ${this_role ? this_role.name : role})`);
			}
			if (error) throw error;
			return result;
		});
	}

	/**
	 * Removes the role from the target user.
	 * @param {Discord.UserResolvable} user
	 * @param {Discord.RoleResolvable} role
	 * @param {String} reason
	 * @returns {Promise<Discord.Role>}
	 */
	remove(user, role, reason = '') {
		const this_member = this.app.member(user);
		const this_role = this.app.role(role);
		console.log(`RoleAdd: Queueing ${this.queuer.totalID} (${this_member ? this_member.displayName : user} | ${this_role ? this_role.name : role})`);
		return this.queuer.queue(async function() {
			let result, error;
			try {
				return await this_member.roles.remove(this_role, reason);
			}
			catch (this_error) {
				error = this_error;
			}
			finally {
				console.log(`RoleRemove: Finished ${this.queuer.currentID} (${this_member ? this_member.displayName : user} | ${this_role ? this_role.name : role})`);
			}
			if (error) throw error;
			return result;
		});
	}
};