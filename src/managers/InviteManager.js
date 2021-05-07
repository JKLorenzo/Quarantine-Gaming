const { ProcessQueue } = require('../utils/Base.js');

/**
 * @typedef {import('../structures/Base.js').Client} Client
 * @typedef {import('discord.js').Invite} Invite
 * @typedef {import('discord.js').Collection<string, Invite>} Collection
 */

module.exports = class InviteManager {
	/** @param {Client} client */
	constructor(client) {
		this.client = client;
		this.queuer = new ProcessQueue(1000);

		/** @type {Collection} */
		this.data = null;

		/** @type {Invite[]} */
		this.invites_queue = new Array();
	}

	async init() {
		this.data = await this.client.guild.fetchInvites();
	}

	/**
     *
     * @param {Invite} invite
     */
	update(invite) {
		this.data.set(invite.code, invite);
	}

	/**
     *
     * @returns {Promise<Invite>}]
     */
	get() {
		return this.queuer.queue(async () => {
			if (!this.data) return new Array();
			const newData = await this.client.guild.fetchInvites();
			const updated_invites = newData.difference(this.data).array();
			for (const invite of updated_invites) {
				this.invites_queue.push(invite);
			}
			this.data = newData;
			return this.invites_queue.shift();
		});
	}
};