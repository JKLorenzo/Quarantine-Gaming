const { ErrorTicketManager, ProcessQueue, sleep } = require('../utils/Base.js');

const ETM = new ErrorTicketManager('ChannelManager');

/**
 * @typedef {import('../structures/Base.js').Client} Client
 * @typedef {import('discord.js').GuildCreateChannelOptions} GuildCreateChannelOptions
 * @typedef {import('discord.js').GuildChannel} GuildChannel
 * @typedef {import('discord.js').GuildChannelResolvable} GuildChannelResolvable
 * @typedef {import('discord.js').Channel} Channel
 * @typedef {import('discord.js').TextChannel} TextChannel
 */

module.exports = class ChannelManager {
	/** @param {Client} client */
	constructor(client) {
		this.client = client;
		this.queuer = new ProcessQueue(1000);
	}

	/**
	 * Creates a new channel in the guild.
	 * @param {GuildCreateChannelOptions & {name: String}} options
	 * @returns {Promise<GuildChannel>}
	 */
	create(options) {
		console.log(`ChannelCreate: Queueing ${this.queuer.totalID} (${options.name})`);
		return this.queuer.queue(async () => {
			let result, error;
			try {
				result = await this.client.guild.channels.create(options.name, options);
			}
			catch (this_error) {
				this.client.error_manager.mark(ETM.create('create', error));
				error = this_error;
			}
			finally {
				console.log(`ChannelCreate: Finished ${this.queuer.currentID} (${options.name})`);
			}
			if (error) throw error;
			return result;
		});
	}

	/**
	 * Deletes a guild channel.
	 * @param {GuildChannelResolvable} channel
	 * @param {String} reason
	 * @returns {Promise<Channel>}
	 */
	delete(channel, reason = '') {
		const this_channel = this.client.channel(channel);
		console.log(`ChannelDelete: Queueing ${this.queuer.totalID} (${this_channel ? this_channel.name : channel})`);
		return this.queuer.queue(async () => {
			let result, error;
			try {
				result = await this_channel.delete(reason);
			}
			catch (this_error) {
				this.client.error_manager.mark(ETM.create('delete', error));
				error = this_error;
			}
			finally {
				console.log(`ChannelDelete: Finished ${this.queuer.totalID} (${this_channel ? this_channel.name : channel})`);
			}
			if (error) throw error;
			return result;
		});
	}

	/**
	 * Deletes the messages from these channels.
	 * @param {GuildChannelResolvable | GuildChannelResolvable[]} channel
	 */
	clear(channel) {
		try {
			let resolvables = new Array();
			channel instanceof Array ? resolvables = [...channel] : resolvables.push(channel);
			for (const this_channel of resolvables) {
				/** @type {TextChannel} */
				const text_channel = this.client.channel(this_channel);
				if (!text_channel && !text_channel.isText()) continue;
				text_channel.messages.fetch().then(messages => messages.array()).then(async messages => {
					for (const message of messages) {
						message.delete({ timeout: 900000 }).catch(e => void e);
						await sleep(5000);
					}
				});
			}
		}
		catch (error) {
			this.client.error_manager.mark(ETM.create('clear', error));
			throw error;
		}
	}
};