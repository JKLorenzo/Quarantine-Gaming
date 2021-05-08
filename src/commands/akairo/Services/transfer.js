const { Command } = require('discord-akairo');

/**
 * @typedef {import('../../../structures/Base.js').Client} Client
 * @typedef {import('../../../structures/Base.js').ExtendedMessage} ExtendedMessage
 * @typedef {import('../../../structures/Base.js').ExtendedMember} ExtendedMember
 */

module.exports = class Transfer extends Command {
	constructor() {
		super('transfer', {
			aliases: ['transfer'],
			category: 'Services',
			description: 'Create a dedicated channel for your current voice channel.',
			args: [
				{
					id: 'members',
					type: (message) => {
						const members = message.mentions.members.filter(member => !member.user.bot && member.voice.channelID).array();
						if (members.length) return members;
						return null;
					},
					description: 'The members to transfer.',
					match: 'content',
					prompt: {
						start: 'Mention the members to transfer to your voice channel.',
						retry: 'You must mention a member that is active on a different voice channel.',
					},
				},
			],
		});
	}

	/**
     * @param {ExtendedMessage} message
     * @param {{members: ExtendedMember[]}} args
     */
	async exec(message, args) {
		/** @type {Client} */
		const client = message.client;

		const voice_channel = message.member.voice.channel;
		if (!voice_channel) {
			return message.reply('You must be active on a voice channel before you can transfer other members.').then(reply => {
				message.delete({ timeout: 30000 }).catch(e => void e);
				reply.delete({ timeout: 30000 }).catch(e => void e);
			});
		}

		const reply = await message.reply(`Got it! Transferring ${args.members.join(', ')} to ${voice_channel}.`, {
			allowedMentions: {
				parse: [],
			},
		});

		await client.methods.voiceChannelTransfer(voice_channel, args.members);
		for (const member of args.members) {
			await client.message_manager.sendToUser(member, `You have been transferred by ${message.member.displayName} to ${voice_channel.name}.`);
		}

		return reply.edit('All done!').then(() => {
			message.delete({ timeout: 30000 }).catch(e => void e);
			reply.delete({ timeout: 30000 }).catch(e => void e);
		});
	}
};