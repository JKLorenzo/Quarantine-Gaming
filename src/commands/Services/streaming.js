const { Command } = require('discord-akairo');
const { MessageEmbed } = require('discord.js');
const { constants } = require('../../utils/Base.js');

/**
 * @typedef {import('../../structures/Base.js').Client} Client
 * @typedef {import('../../structures/Base.js').ExtendedMessage} ExtendedMessage
 */

module.exports = class Streaming extends Command {
	constructor() {
		super('streaming', {
			aliases: ['streaming'],
			category: 'Services',
			description: 'Manually add a streaming role to your account to let other know you\'re streaming.',
		});
	}

	/** @param {ExtendedMessage} message */
	async exec(message) {
		/** @type {Client} */
		const client = message.client;

		const streaming_role = client.role(constants.roles.streaming);
		const hasStreaming = message.member.roles.cache.has(streaming_role.id);

		let reply;
		if (hasStreaming) {
			reply = await message.reply('Alright. Removing streaming status.');
			client.role_manager.remove(message.member, streaming_role);
		}
		else {
			reply = await message.reply('Got it! Adding the streaming status to your account.');
			client.role_manager.add(message.member, streaming_role);
		}

		if (message.member.voice.channelID && !hasStreaming) {
			const voice_channel = message.member.voice.channel;
			const embed = new MessageEmbed({
				author: { name: 'Quarantine Gaming: Streaming' },
				title: `${message.member.displayName} is currently Streaming`,
				description: 'Please observe proper behavior on your current voice channel.',
				image: { url: 'https://pa1.narvii.com/6771/d33918fa87ad0d84b7dc854dcbf6a8545c73f94d_hq.gif' },
				color: '#5dff00',
			});
			for (const member of voice_channel.members.array()) {
				if (member.id == message.member.id) continue;
				if (member.user.bot) continue;
				client.message_manager.sendToUser(member, embed);
			}

			client.speech_manager.say(voice_channel, 'Be notified: A member in this voice channel is currently streaming.');
		}

		reply.delete({ timeout: 30000 }).catch(e => void e);
		message.delete({ timeout: 30000 }).catch(e => void e);
	}
};