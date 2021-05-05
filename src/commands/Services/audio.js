const { Command } = require('discord-akairo');
const { MessageEmbed } = require('discord.js');
const { constants } = require('../../utils/Base.js');

/**
 * @typedef {import('../../structures/Base.js').Client} Client
 * @typedef {import('../../structures/Base.js').ExtendedMessage} ExtendedMessage
 */

module.exports = class Audio extends Command {
	constructor() {
		super('audio', {
			aliases: ['audio'],
			category: 'Services',
			description: 'Summon the audio control extension for voice channels.',
		});
	}

	/** @param {ExtendedMessage} message */
	async exec(message) {
		/** @type {Client} */
		const client = message.client;

		const embed = new MessageEmbed({
			author: { name: 'Quarantine Gaming: Experience' },
			title: 'Audio Control Extension for Voice Channels',
			description: 'Mute or unmute all members on your current voice channel.',
			thumbnail: { url: constants.images.audio_control_thumbnail },
			fields: [
				{ name: 'Actions:', value: '🟠 - Mute', inline: true },
				{ name: '\u200b', value: '🟢 - Unmute', inline: true },
			],
			color: '#ffff00',
			footer: { text: 'Apply selected actions by reacting below.' },
		});

		return message.reply(embed).then(async reply => {
			await client.reaction_manager.add(reply, ['🟠', '🟢']);
			message.delete({ timeout: 1800000 }).catch(e => void e);
			reply.delete({ timeout: 1800000 }).catch(e => void e);
		});
	}
};