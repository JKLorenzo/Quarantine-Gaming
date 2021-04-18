const { ErrorTicketManager, ProcessQueue } = require('../utils/Base.js');

const ETM = new ErrorTicketManager('MessageManager');

/**
 * @typedef {import('../structures/Base.js').Client} Client
 * @typedef {import('discord.js').GuildChannelResolvable} GuildChannelResolvable
 * @typedef {import('discord.js').APIMessageContentResolvable} APIMessageContentResolvable
 * @typedef {import('discord.js').MessageOptions} MessageOptions
 * @typedef {import('discord.js').MessageAdditions} MessageAdditions
 * @typedef {import('discord.js').Message} Message
 * @typedef {import('discord.js').TextChannel} TextChannel
 * @typedef {import('discord.js').UserResolvable} UserResolvable
 */

module.exports = class MessageManager {
	/** @param {Client} client */
	constructor(client) {
		this.client = client;
		this.queuer = new ProcessQueue(1000);
	}

	/**
	 * Sends a message to a channel.
	 * @param {GuildChannelResolvable} channel
	 * @param {APIMessageContentResolvable | (MessageOptions & {split?: Boolean}) | MessageAdditions} content
	 * @returns {Promise<Message>}
	 */
	sendToChannel(channel, content) {
		/** @type {TextChannel} */
		const this_channel = this.client.channel(channel);
		console.log(`MessageChannelSend: Queueing ${this.queuer.totalID} (${this_channel ? this_channel.name : channel})`);
		return this.queuer.queue(async () => {
			let result, error;
			try {
				result = await this_channel.send(content);
			}
			catch (this_error) {
				this.client.error_manager.mark(ETM.create('sendToChannel', error));
				error = this_error;
			}
			finally {
				console.log(`MessageChannelSend: Finished ${this.queuer.currentID} (${this_channel ? this_channel.name : channel})`);
			}
			if (error) throw error;
			return result;
		});
	}

	/**
	 * Sends a message to a user then deletes it after some time.
	 * @param {UserResolvable} user
	 * @param {Discord.APIMessageContentResolvable | (MessageOptions & {split?: Boolean}) | MessageAdditions} content
	 * @returns {Promise<Message>}
	 */
	sendToUser(user, content) {
		const member = this.client.member(user);
		console.log(`MessageUserSend: Queueing ${this.queuer.totalID} (${member ? member.displayName : user})`);
		return this.queuer.queue(async () => {
			let result, error;
			try {
				result = await member.send(content);
				result.delete({ timeout:3600000 }).catch(e => void e);
			}
			catch (this_error) {
				this.client.error_manager.mark(ETM.create('sendToUser', error));
				error = this_error;
			}
			finally {
				console.log(`MessageUserSend: Finished ${this.queuer.currentID} (${member ? member.displayName : user})`);
			}
			if (error) throw error;
			return result;
		});
	}
};