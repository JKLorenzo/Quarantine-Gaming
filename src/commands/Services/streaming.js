import { MessageEmbed } from 'discord.js';
import { SlashCommand } from '../../structures/Base.js';
import { constants } from '../../utils/Base.js';

/**
 * @typedef {import('discord.js').CommandInteraction} CommandInteraction
 */

export default class Streaming extends SlashCommand {
	constructor() {
		super({
			name: 'streaming',
			description: 'Manually add a streaming role to your account to let others know you\'re streaming.',
		});
	}

	/**
     * @param {CommandInteraction} interaction
     */
	async exec(interaction) {
		await interaction.defer({ ephemeral: true });

		const member = interaction.member;
		const streaming_role = this.client.role(constants.qg.roles.streaming);
		const hasStreaming = member.roles.cache.has(streaming_role.id);

		if (hasStreaming) {
			await interaction.editReply('Alright. Removing streaming status.');
			this.client.role_manager.remove(member, streaming_role);
		} else {
			await interaction.editReply('Got it! Adding the streaming status to your account.');
			this.client.role_manager.add(member, streaming_role);
		}

		if (member.voice.channelID && !hasStreaming) {
			const voice_channel = member.voice.channel;
			const embed = new MessageEmbed({
				author: { name: 'Quarantine Gaming: Streaming' },
				title: `${member.displayName} is currently Streaming`,
				description: 'Please observe proper behavior on your current voice channel.',
				image: { url: 'https://pa1.narvii.com/6771/d33918fa87ad0d84b7dc854dcbf6a8545c73f94d_hq.gif' },
				color: '#5dff00',
			});
			for (const this_member of voice_channel.members.array()) {
				if (this_member.id == member.id) continue;
				if (this_member.user.bot) continue;
				this.client.message_manager.sendToUser(member, embed);
			}

			this.client.speech_manager.say(voice_channel, 'Be notified: A member in this voice channel is currently streaming.');
		}
	}
}