// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js');

module.exports = class ChannelManager {
	/** @param {import('../app.js')} app */
	constructor(app) {
		this.app = app;
		this.queuer = new app.utils.ProcessQueue(1000);
	}

	/**
	 * Creates a new channel in the guild.
	 * @param {Discord.GuildCreateChannelOptions & {name: String}} options
	 * @returns {Promise<Discord.GuildChannel>}
	 */
	create(options) {
		console.log(`ChannelCreate: Queueing ${this.queuer.totalID} (${options.name})`);
		return this.queuer.queue(async () => {
			let result, error;
			try {
				result = await this.app.guild.channels.create(options.name, options);
			}
			catch (this_error) {
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
	 * @param {Discord.GuildChannelResolvable} channel
	 * @param {String} reason
	 * @returns {Promise<Discord.Channel>}
	 */
	delete(channel, reason = '') {
		const this_channel = this.app.channel(channel);
		console.log(`ChannelDelete: Queueing ${this.queuer.totalID} (${this_channel ? this_channel.name : channel})`);
		return this.queuer.queue(async () => {
			let result, error;
			try {
				result = await this_channel.delete(reason);
			}
			catch (this_error) {
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
	 * @param {Discord.GuildChannelResolvable | Discord.GuildChannelResolvable[]} channel
	 */
	clear(channel) {
		let resolvables = new Array();
		channel instanceof Array ? resolvables = [...channel] : resolvables.push(channel);
		for (const this_channel of resolvables) {
			/** @type {Discord.TextChannel} */
			const text_channel = this.app.channel(this_channel);
			if (!text_channel && !text_channel.isText()) continue;
			text_channel.messages.fetch().then(messages => messages.array()).then(async messages => {
				for (const message of messages) {
					message.delete({ timeout: 900000 }).catch(e => void e);
					await this.app.utils.sleep(5000);
				}
			});
		}
	}
};