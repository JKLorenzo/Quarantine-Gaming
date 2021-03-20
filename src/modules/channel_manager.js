// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js');
const functions = require('./functions.js');
const classes = require('./classes.js');
/** @type {import('./app.js')} */
let app;

const ChannelQueueManager = new classes.Manager();

/**
 * Initializes the module.
 * @param {import('discord.js-commando').CommandoClient} ClientInstance The Commando Client instance used to login.
 */
module.exports.initialize = (ClientInstance) => {
	// Link
	app = ClientInstance.modules.app;
};

/**
 * Creates a new channel in the guild.
 * @param {{name: String, bitrate?: Number, nsfw?: Boolean, parent?: Discord.ChannelResolvable, permissionOverwrites?: Array<Discord.OverwriteResolvable> | Discord.Collection<String, Discord.OverwriteResolvable>, position?: Number, rateLimitPerUser?: Number, reason?: String, topic?: String, type: "text" | "voice" | "category", userLimit?: Number}} options
 * @returns {Promise<Discord.GuildChannel>} A Text Channel, a Voice Channel, or a Category Channel Object
 */
module.exports.create = (options) => {
	console.log(`ChannelCreate: Queueing ${ChannelQueueManager.totalID} (${options.name})`);
	return ChannelQueueManager.queue(async function() {
		let result, error;
		try {
			result = await app.guild().channels.create(options.name, {
				bitrate: options.bitrate,
				nsfw: options.nsfw,
				parent: options.parent,
				permissionOverwrites: options.permissionOverwrites,
				position: options.position,
				rateLimitPerUser: options.rateLimitPerUser,
				reason: options.reason,
				topic: options.topic,
				type: options.type,
				userLimit: options.userLimit,
			});
		}
		catch (this_error) {
			error = this_error;
		}
		finally {
			console.log(`ChannelCreate: Finished ${ChannelQueueManager.currentID} (${options.name})`);
		}
		if (error) throw error;
		return result;
	});
};

/**
 * Deletes a Guild Channel.
 * @param {Discord.GuildChannelResolvable} GuildChannelResolvable A GuildChannel Object or a Snowflake.
 * @param {String} reason Reason for deleting this channel.
 * @returns {Promise<Discord.Channel>} A Channel Object
 */
module.exports.delete = (GuildChannelResolvable, reason = '') => {
	const channel = app.channel(GuildChannelResolvable);
	console.log(`ChannelDelete: Queueing ${ChannelQueueManager.totalID} (${channel ? channel.name : GuildChannelResolvable})`);
	return ChannelQueueManager.queue(async function() {
		let result, error;
		try {
			result = await channel.delete(reason);
		}
		catch (this_error) {
			error = this_error;
		}
		finally {
			console.log(`ChannelDelete: Finished ${ChannelQueueManager.totalID} (${channel ? channel.name : GuildChannelResolvable})`);
		}
		if (error) throw error;
		return result;
	});
};

/**
 * Deletes the messages from these channels.
 * @param {Array<Discord.GuildChannelResolvable>} GuildChannelResolvables An array of GuildChannelResolvable
 */
module.exports.clearTempChannels = async (GuildChannelResolvables) => {
	for (const channel of GuildChannelResolvables) {
		/** @type {Discord.TextChannel} */
		const this_channel = app.channel(channel);
		if (!this_channel) continue;
		await this_channel.messages.fetch().then(async messages => {
			for (const message of messages) {
				message[1].delete({ timeout: 900000 }).catch(e => void e);
				await functions.sleep(5000);
			}
		});
		await functions.sleep(5000);
	}
};

module.exports.ChannelQueueManager = ChannelQueueManager;