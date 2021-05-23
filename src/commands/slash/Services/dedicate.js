import { MessageEmbed } from 'discord.js';
import { SlashCommand } from '../../../structures/Base.js';
import { parseMention, sleep, constants } from '../../../utils/Base.js';

/**
 * @typedef {import('discord.js').TextChannel} TextChannel
 * @typedef {import('discord.js').CategoryChannel} CategoryChannel
 * @typedef {import('discord.js').CommandInteraction} CommandInteraction
 */

export default class Dedicate extends SlashCommand {
	constructor() {
		super({
			name: 'dedicate',
			description: 'Create a dedicated channel for your current voice channel.',
			options: [
				{
					name: 'custom_name',
					description: 'Enter the name of the dedicated channel to create.',
					type: 'STRING',
				},
				{
					name: 'lock',
					description: 'Would you like to lock this dedicated channel?',
					type: 'BOOLEAN',
				},
			],
		});
	}

	/**
     * @param {CommandInteraction} interaction
     * @param {{custom_name?: String, lock?: boolean}} options
     */
	async exec(interaction, options) {
		await interaction.defer(true);

		const member = this.client.member(interaction.user);
		let voice_channel = member.voice.channel;
		if (!voice_channel) return interaction.editReply('You must be connected to any voice channels to create a dedicated channel.');

		if ((options.custom_name && options.custom_name != voice_channel.name.substring(1)) || voice_channel.parentID != constants.channels.category.dedicated_voice) {
			if (!options.custom_name) options.custom_name = member.displayName;

			if (voice_channel.parentID != constants.channels.category.dedicated_voice) {
				await interaction.editReply(`Got it! Please wait while I'm preparing **${options.custom_name}** voice and text channels.`);
			} else {
				await interaction.editReply(`Alright, renaming your dedicated channel to **${options.custom_name}**.`);
			}

			const data = await this.client.dedicated_channel_manager.create(voice_channel, options.custom_name);
			voice_channel = data.voice_channel;
			if (data.transfer_process) {
				await interaction.editReply(`You will be transfered to ${data.voice_channel} dedicated channel momentarily.`);
				await data.transfer_process;
				await interaction.editReply(`Transfer complete! Here are your dedicated ${data.voice_channel} voice and ${data.text_channel} text channels.`);
			}
			await sleep(2500);
		}

		if (typeof options.lock === 'boolean') {
			await interaction.editReply(`${options.lock ? 'Locking' : 'Unlocking'} ${voice_channel} dedicated channel.`);

			if (options.lock) {
				await voice_channel.updateOverwrite(constants.roles.member, {
					'CONNECT': false,
				});
			} else {
				await voice_channel.updateOverwrite(constants.roles.member, {
					'CONNECT': true,
				});
			}

			/** @type {CategoryChannel} */
			const dedicated_text_channels_category = this.client.channel(constants.channels.category.dedicated);
			/** @type {Array<TextChannel>} */
			const dedicated_text_channels = dedicated_text_channels_category.children.array();
			const text_channel = dedicated_text_channels.find(channel => channel.topic && parseMention(channel.topic.split(' ')[0]) == voice_channel.id);
			const embed = new MessageEmbed({
				author: { name: 'Quarantine Gaming: Dedicated Channels' },
				title: 'Permission Changed',
				description: `${member} ${options.lock ? 'locked' : 'unlocked'} this channel.`,
				color: '#ffe500',
				timestamp: new Date(),
			});
			await this.client.message_manager.sendToChannel(text_channel, embed);
			await sleep(2500);
		}

		interaction.editReply('Done!');
	}
}