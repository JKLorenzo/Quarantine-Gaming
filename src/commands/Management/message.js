import { SlashCommand } from '../../structures/Base.js';
import { constants } from '../../utils/Base.js';

/**
 * @typedef {import('discord.js').TextChannel} TextChannel
 * @typedef {import('discord.js').VoiceChannel} VoiceChannel
 * @typedef {import('discord.js').CommandInteraction} CommandInteraction
 * @typedef {import('../../structures/Base.js').ExtendedMember} ExtendedMember
 */

export default class Message extends SlashCommand {
	constructor() {
		super({
			name: 'message',
			description: '[Staff/Mod] Sends a message to a member or a channel as Quarantine Gaming.',
			options: [
				{
					name: 'channel',
					description: '[Staff/Mod] Sends a message to a channel as Quarantine Gaming.',
					type: 'SUB_COMMAND',
					options: [
						{
							name: 'channel',
							description: 'The channel where the message will be sent.',
							type: 'CHANNEL',
							required: true,
						},
						{
							name: 'message',
							description: 'The message to send to the channel.',
							type: 'STRING',
							required: true,
						},
					],
				},
				{
					name: 'dm',
					description: '[Staff/Mod] Sends a message to a member as Quarantine Gaming.',
					type: 'SUB_COMMAND',
					options: [
						{
							name: 'member',
							description: 'The member where the message will be sent.',
							type: 'USER',
							required: true,
						},
						{
							name: 'message',
							description: 'The message to send to the member.',
							type: 'STRING',
							required: true,
						},
					],
				},
			],
			defaultPermission: false,
			permissions: {
				roles: {
					allow: [
						constants.roles.staff,
						constants.roles.moderator,
					],
				},
			},
		});
	}

	/**
	 * @param {CommandInteraction} interaction
	 * @param {{option: 'channel' | 'dm', channel?: TextChannel | VoiceChannel, member?: ExtendedMember, message: String}} options
	 */
	async exec(interaction, options) {
		await interaction.defer(true);

		options = options[Object.keys(options)[0]];

		if (options.option == 'channel') {
			const channel = options.channel;
			if (channel.isText()) {
				await this.client.message_manager.sendToChannel(channel, options.message);
			} else {
				await this.client.speech_manager.say(channel, options.message.split(' ').map(word => {
					return this.client.channel(word)?.name ?? this.client.member(word)?.displayName ?? this.client.role(word)?.name ?? word;
				}));
			}
		} else {
			const member = options.member;
			if (member.user.bot) return interaction.editReply('Failed to send the message. Supplied member must not be a bot.');
			await this.client.message_manager.sendToUser(member, options.message);
		}
		interaction.editReply('Message sent!');
	}
}