const { ErrorTicketManager, ProcessQueue } = require('../utils/Base.js');

const ETM = new ErrorTicketManager('RoleManager');

/**
 * @typedef {import('../structures/Base.js').Client} Client
 * @typedef {import('discord.js').ColorResolvable} ColorResolvable
 * @typedef {import('discord.js').PermissionResolvable} PermissionResolvable
 * @typedef {import('discord.js').Role} Role
 * @typedef {import('discord.js').RoleResolvable} RoleResolvable
 * @typedef {import('discord.js').UserResolvable} UserResolvable
 */

module.exports = class RoleManager {
	/** @param {Client} client */
	constructor(client) {
		this.client = client;
		this.queuer = new ProcessQueue(1000);
	}

	/**
 	 * Creates a new role in the guild.
 	 * @param {{name: String, color?: ColorResolvable, hoist?: Boolean, position?: number, permissions?: PermissionResolvable, mentionable?: Boolean, reason?: String}} options
 	 * @returns {Role}
 	 */
	create(options) {
		console.log(`RoleCreate: Queueing ${this.queuer.totalID} (${options.name})`);
		return this.queuer.queue(async () => {
			let result, error;
			try {
				result = await this.client.guild.roles.create(options);
			}
			catch (this_error) {
				this.client.error_manager.mark(ETM.create('create', error));
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
 	 * @param {RoleResolvable} role
 	 * @param {String} reason
	 * @returns {Promise<Role>}
	 */
	delete(role, reason = '') {
		const this_role = this.client.role(role);
		console.log(`RoleDelete: Queueing ${this.queuer.totalID} (${this_role ? this_role.name : role})`);
		return this.queuer.queue(async () => {
			let result, error;
			try {
				result = await this_role.delete(reason);
			}
			catch (this_error) {
				this.client.error_manager.mark(ETM.create('delete', error));
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
	 * @param {UserResolvable} user
	 * @param {RoleResolvable} role
	 * @param {String} reason
	 * @returns {Promise<Role>}
	 */
	add(user, role, reason = '') {
		const this_member = this.client.member(user);
		const this_role = this.client.role(role);
		console.log(`RoleAdd: Queueing ${this.queuer.totalID} (${this_member ? this_member.displayName : user} | ${this_role ? this_role.name : role})`);
		return this.queuer.queue(async () => {
			let result, error;
			try {
				return await this_member.roles.add(this_role, reason);
			}
			catch (this_error) {
				this.client.error_manager.mark(ETM.create('add', error));
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
	 * @param {UserResolvable} user
	 * @param {RoleResolvable} role
	 * @param {String} reason
	 * @returns {Promise<Role>}
	 */
	remove(user, role, reason = '') {
		const this_member = this.client.member(user);
		const this_role = this.client.role(role);
		console.log(`RoleAdd: Queueing ${this.queuer.totalID} (${this_member ? this_member.displayName : user} | ${this_role ? this_role.name : role})`);
		return this.queuer.queue(async () => {
			let result, error;
			try {
				return await this_member.roles.remove(this_role, reason);
			}
			catch (this_error) {
				this.client.error_manager.mark(ETM.create('remove', error));
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