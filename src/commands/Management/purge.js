import { MessageEmbed } from 'discord.js';
import { SlashCommand } from '../../structures/Base.js';
import { constants } from '../../utils/Base.js';

/**
 * @typedef {import('discord.js').TextChannel} TextChannel
 * @typedef {import('discord.js').CommandInteraction} CommandInteraction
 * @typedef {import('../../structures/Base.js').ExtendedMessage} ExtendedMessage
 */

export default class Purge extends SlashCommand {
	constructor() {
		super({
			name: 'purge',
			description: '[Staff/Mod] Removes a number of messages on the current channel.',
			options: [
				{
					name: 'message_count',
					description: 'The number of messages to delete.',
					type: 'INTEGER',
					required: true,
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
	 * @param {{message_count: Number}} options
	 */
	async exec(interaction, options) {
		await interaction.defer({ ephemeral: true });

		let retries = 3;
		let deleted_messages_count = 0;
		const deleted_messages = new Array();
		/** @type {TextChannel} */
		const channel = interaction.channel;

		do {
			/** @type {ExtendedMessage[]} */
			const messages_to_delete = new Array();
			const authors_id = new Array();
			await channel.messages.fetch().then(async messages => {
				for (const this_message of messages.array()) {
					if (this_message.deletable) {
						messages_to_delete.push(this_message);
						authors_id[this_message.id] = [this_message.author ? this_message.author : 'Unavailable'];
					}
					if (messages_to_delete.length >= options.message_count) break;
				}
			});
			await channel.bulkDelete(messages_to_delete, true).then(messages => {
				for (const this_message of messages.array()) {
					deleted_messages_count++;
					if (deleted_messages[authors_id[this_message.id]]) {
						deleted_messages[authors_id[this_message.id]] += 1;
					} else {
						deleted_messages[authors_id[this_message.id]] = 1;
					}
				}
			});
			retries--;
		} while (retries > 0 && deleted_messages_count < options.message_count);
		const elapsedTime = (Date.now() - interaction.createdTimestamp) / 1000;

		const embed = new MessageEmbed({
			author: { name: 'Quarantine Gaming: Message Cleanup' },
			title: 'Channel Purge Complete',
			description: `A total of ${deleted_messages_count} messages were removed.`,
			fields: [
				{ name: 'Affected Authors:', value: Object.entries(deleted_messages).map(entry => `${entry[0]}: ${entry[1]}`) },
			],
			footer: { text: `This process took ${elapsedTime.toFixed(2)} seconds to finish.` },
			timestamp: new Date(),
			color: '#ffff00',
		});

		return interaction.editReply(embed);
	}
}