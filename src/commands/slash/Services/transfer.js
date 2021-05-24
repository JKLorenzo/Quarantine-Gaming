import { SlashCommand } from '../../../structures/Base.js';

/**
 * @typedef {import('discord.js').CommandInteraction} CommandInteraction
 * @typedef {import('../../../structures/Base.js').ExtendedMember} ExtendedMember
 */

export default class Transfer extends SlashCommand {
	constructor() {
		super({
			name: 'transfer',
			description: 'Transfers a member from another voice channel to your current voice channel.',
			options: [
				{
					name: 'member_1',
					description: 'Select the member you\'d like to transfer.',
					type: 'USER',
					required: true,
				},
				{
					name: 'member_2',
					description: 'Select the member you\'d like to transfer.',
					type: 'USER',
				},
				{
					name: 'member_3',
					description: 'Select the member you\'d like to transfer.',
					type: 'USER',
				},
				{
					name: 'member_4',
					description: 'Select the member you\'d like to transfer.',
					type: 'USER',
				},
				{
					name: 'member_5',
					description: 'Select the member you\'d like to transfer.',
					type: 'USER',
				},
			],
		});
	}

	/**
     * @param {CommandInteraction} interaction
     * @param {*} options
     */
	async exec(interaction, options) {
		const voice_channel = this.client.member(interaction.member)?.voice.channel;
		if (!voice_channel) interaction.reply('You must be active on a voice channel to use this command.');

		await interaction.defer(true);

		/** @type {ExtendedMember[]} */
		const members = Object.keys(options).map(name => options[name]);
		const available = members.filter(m => m.voice.channel);

		for (const member of available) {
			this.client.message_manager.sendToUser(member, `You have been transferred to ${voice_channel} by ${interaction.member}.`);
		}
		await this.client.methods.voiceChannelTransfer(voice_channel, available);

		interaction.editReply(`Successfully transferred ${available.join(', ')} to ${voice_channel}.`);
	}
}