const { Command } = require('discord-akairo');
const { parseMention } = require('../../utils/Base.js');

/**
 * @typedef {import('../../structures/Base.js').Client} Client
 * @typedef {import('../../structures/Base.js').ExtendedMessage} ExtendedMessage
 * @typedef {import('discord.js').VoiceChannel} VoiceChannel
 */

module.exports = class TTS extends Command {
	constructor() {
		super('tts', {
			aliases: ['tts', 'say', 'speech'],
			category: 'Utility',
			description: 'Say a message to a voice channel using Quarantine Gaming\'s TTS.',
			args: [
				{
					id: 'channel',
					type: (message, phrase) => {
						const channel = message.guild.channels.resolve(phrase) || message.guild.channels.resolve(parseMention(phrase));
						if (channel && channel.type == 'voice') return channel;
						return null;
					},
					prompt: {
						start: 'Mention the voice channel or its id.',
						retry: 'You must enter a valid voice channel or voice channel id.',
					},
				},
				{
					id: 'message',
					type: 'string',
					match: 'restContent',
					prompt: {
						start: 'Enter the message to be coverted as speech.',
						retry: 'You must enter a valid text message.',
					},
				},
			],
		});
	}

	/**
     * @param {ExtendedMessage} message
     * @param {{channel: VoiceChannel, message: String}} args
     */
	async exec(message, args) {
		/** @type {Client} */
		const client = message.client;

		const reply = await message.reply(`Got it! Converting you message to speech in ${args.channel}.`);
		return client.speech_manager.say(args.channel, args.message).then(() => {
			message.delete().catch(e => void e);
			reply.delete().catch(e => void e);
		});
	}
};