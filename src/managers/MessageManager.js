// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js');

module.exports = class MessageManager {
	/** @param {import('../app.js')} app */
	constructor(app) {
		this.app = app;
		this.queuer = new app.utils.ProcessQueue(1000);
		this.ETM = new app.utils.ErrorTicketManager('MessageManager');
	}

	/**
	 * Sends a message to a channel.
	 * @param {Discord.GuildChannelResolvable} channel
	 * @param {Discord.APIMessageContentResolvable | (Discord.MessageOptions & {split?: Boolean}) | Discord.MessageAdditions} content
	 * @returns {Promise<Discord.Message>}
	 */
	sendToChannel(channel, content) {
		/** @type {Discord.TextChannel} */
		const this_channel = this.app.channel(channel);
		console.log(`MessageChannelSend: Queueing ${this.queuer.totalID} (${this_channel ? this_channel.name : channel})`);
		return this.queuer.queue(async () => {
			let result, error;
			try {
				result = await this_channel.send(content);
			}
			catch (this_error) {
				this.app.error_manager.mark(this.ETM.create('sendToChannel', error));
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
	 * @param {Discord.UserResolvable} user
	 * @param {Discord.APIMessageContentResolvable | (Discord.MessageOptions & {split?: Boolean}) | Discord.MessageAdditions} content
	 * @returns {Promise<Discord.Message>}
	 */
	sendToUser(user, content) {
		const member = this.app.member(user);
		console.log(`MessageUserSend: Queueing ${this.queuer.totalID} (${member ? member.displayName : user})`);
		return this.queuer.queue(async () => {
			let result, error;
			try {
				result = await member.send(content);
				result.delete({ timeout:3600000 }).catch(e => void e);
			}
			catch (this_error) {
				this.app.error_manager.mark(this.ETM.create('sendToUser', error));
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