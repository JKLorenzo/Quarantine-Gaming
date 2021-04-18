const { GuildMember } = require('discord.js');
const { constants } = require('../utils/Base.js');

/**
 * @typedef {import('../structures/Base.js').Client} Client
 * @typedef {import('discord.js').Role} Role
 * @typedef {import('discord.js').RoleResolvable} RoleResolvable
 * @typedef {import('../types/Base.js').PartialRole} PartialRole
 */

module.exports = class ExtendedMember extends GuildMember {
	constructor(client, data, guild) {
		super(client, data, guild);

		/** @private */
		this.memberDocRef = null;
		/** @private */
		this.memberDocSnap = null;
		/** @private */
		this.roleColRef = null;

		/**
		 * The inviter of this member.
		 * @type {ExtendedMember | String}
		 * @readonly
		 */
		this.inviter = null;
		/**
		 * The moderator that approved this member.
		 * @type {ExtendedMember | String}
		 * @readonly
		 */
		this.moderator = null;

		/** @type {Client} */
		this.client;
	}

	/**
	 * Initializes this member and syncing it with the database
	 */
	async init() {
		const data = this.client.database_manager.getMemberData(super.id);
		if (data) {
			const inviter = this.client.member(data.inviter);
			const moderator = this.client.member(data.moderator);
			this.inviter = inviter ? inviter : data.inviter;
			this.moderator = moderator ? moderator : data.moderator;
			return;
		}
		await this.client.database_manager.setMemberData({
			id: super.id,
			name: super.displayName,
			tagname: this.client.member(super.id).user.tag,
		});
	}

	/**
	 * Sets the inviter of this member.
	 * @param {ExtendedMember} member
	 * @param {ExtendedMember} moderator
	 */
	async setInviter(member, moderator) {
		await this.client.database_manager.updateMemberData(super.id, {
			inviter: member.id,
			moderator: moderator.id,
		});
		this.inviter = member;
		this.moderator = moderator;
	}

	/**
	 * Update this member's game role.
	 * @param {Role} role
	 */
	async updateGameRole(role) {
		await this.client.database_manager.updateMemberGameRole(super.id, {
			id: role.id,
			name: role.name,
		});
		await this.client.role_manager.add(super.id, role);
	}

	/**
	 * Delete this member's game role;
	 * @param {String} role_id
	 */
	async deleteGameRole(role_id) {
		await this.client.database_manager.deleteMemberGameRole(super.id, role_id);
		await this.client.role_manager.remove(super.id, role_id);
	}

	/**
	 * Gets the expired game roles of this member.
	 * @returns {Promise<PartialRole[]>}
	 */
	async getExpiredGameRoles() {
		if (super.roles.cache.array().filter(role => role.hexColor == constants.colors.game_role).length > 0) return new Array();
		return await this.client.database_manager.getMemberExpiredGameRoles(super.id);
	}

	/**
	 * Checks if this member has one of these roles.
 	 * @param {RoleResolvable | RoleResolvable[]} role
 	 */
	hasRole(role) {
		/** @type {String[]} */
		const roleIDs = new Array();
		if (role instanceof Array) {
			for (const this_roleresolvable of role) {
				const this_role = this.client.role(this_roleresolvable);
				if (this_role) roleIDs.push(this_role.id);
			}
		}
		else {
			const this_role = this.client.role(role);
			if (this_role) roleIDs.push(this_role.id);
		}
		for (const roleID of roleIDs) {
			if (super.roles.cache.has(roleID)) return true;
		}
		return false;
	}
};