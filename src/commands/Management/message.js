import { MessageEmbed } from 'discord.js';
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
		await interaction.defer({ ephemeral: true });

		options = options[Object.keys(options)[0]];

		if (options.option == 'channel') {
			const channel = options.channel;
			if (channel.isText()) {
				await this.client.message_manager.sendToChannel(channel, this.transformMessage(options.message));
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

	/**
	 * @private
	 * @param {String} message
	 */
	transformMessage(message) {
		if (typeof message !== 'string') return message;

		switch(message) {
		case 'fgu': return this.freeGameUpdates();
		case 'nsfw': return this.notSafeForWork();
		default: return message;
		}
	}

	/** @private */
	freeGameUpdates() {
		return {
			embed: new MessageEmbed({
				author: { name: 'Quarantine Gaming: Free Game Updates' },
				title: 'Subscribe to get Updated',
				description: [
					`All notifications will be made available on our ${this.client.channel(constants.channels.integrations.free_games)}.`,
					'',
					`${this.client.guild.emojis.cache.find(e => e.name === 'steam')} - ${this.client.role(constants.roles.steam)}`,
					'Notifies you with games that are currently free on Steam.',
					'',
					`${this.client.guild.emojis.cache.find(e => e.name === 'epic_games')} - ${this.client.role(constants.roles.epic)}`,
					'Notifies you with games that are currently free on Epic Games.',
					'',
					`${this.client.guild.emojis.cache.find(e => e.name === 'gog')} - ${this.client.role(constants.roles.gog)}`,
					'Notifies you with games that are currently free on GOG.',
					'',
					`${this.client.guild.emojis.cache.find(e => e.name === 'ubisoft')} - ${this.client.role(constants.roles.ubisoft)}`,
					'Notifies you with games that are currently free on UPlay.',
					'',
					`${this.client.guild.emojis.cache.find(e => e.name === 'controller')} - ${this.client.role(constants.roles.console)}`,
					'Notifies you with games that are currently free for Xbox(One/360), PlayStation(3/4/Vita), and Wii(U/3DS/Switch).',
				].join('\n'),
				image: { url: constants.images.free_games_banner },
				footer: { text: 'Powered by r/FreeGameFindings' },
				color: '#C4FF00',
			}),
			components: this.client.interaction_manager.components.get('fgu').getComponents(),
		};
	}

	/** @private */
	notSafeForWork() {
		return {
			embed: new MessageEmbed({
				author: { name: 'Quarantine Gaming: NSFW Content' },
				title: 'Unlock NSFW Bots and Channel',
				description: [
					`${this.client.role(constants.roles.nsfw_bot)} and ${this.client.channel(constants.channels.text.explicit)} channel will be unlocked after getting the role.`,
					'',
					`**🔴 - Not Safe For Work (${this.client.role(constants.roles.nsfw)})**`,
					'The marked content may contain nudity, intense sexuality, profanity, violence or other potentially disturbing subject matter.',
				].join('\n'),
				image: { url: constants.images.nsfw_banner },
				footer: { text: 'Update your role by clicking the button below.' },
				color: 'FUCHSIA',
			}),
			components: this.client.interaction_manager.components.get('nsfw').getComponents(),
		};
	}
}