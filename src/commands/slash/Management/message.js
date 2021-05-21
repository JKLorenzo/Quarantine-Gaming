import { SlashCommand } from '../../../structures/Base.js';
import { constants } from '../../../utils/Base.js';

/**
 * @typedef {import('discord.js').TextChannel} TextChannel
 * @typedef {import('discord.js').CommandInteraction} CommandInteraction
 * @typedef {import('../../../structures/Base.js').Client} Client
 * @typedef {import('../../../structures/Base.js').ExtendedMember} ExtendedMember
 */

export default class Message extends SlashCommand {
	constructor() {
		super({
			name: 'message',
			description: '[Staff/Mod] Sends a message to a member or a channel as Quarantine Gaming.',
			options: [
				{
					name: 'text_channel',
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
	 * @param {{text_channel?: {option: 'text_channel', channel: TextChannel, message: String}, dm?: {option: 'dm', member: ExtendedMember, message: String} }} options
	 */
	async exec(interaction, options) {
		await interaction.defer(true);

		/** @type {Client} */
		const client = interaction.client;

		const args = options.text_channel || options.dm;
		const message = args.message;

		if (args.option == 'text_channel') {
			const channel = options.text_channel.channel;
			if (!channel.isText()) return interaction.editReply('Failed to send the message. Supplied channel is not a text-based channel.');
			await client.message_manager.sendToChannel(channel, message);
		} else {
			const member = options.dm.member;
			if (member.user.bot) return interaction.editReply('Failed to send the message. Supplied member must not be a bot.');
			await client.message_manager.sendToUser(member, message);
		}
		interaction.editReply('Message sent!');
	}
}