import { MessageActionRow, MessageButton } from 'discord.js';
import { MessageComponent } from '../structures/Base.js';
import { contains, parseMention, ProcessQueue } from '../utils/Base.js';

/**
 * @typedef {import('discord.js').Message} Message
 * @typedef {import('discord.js').GuildMember} GuildMember
 * @typedef {import('discord.js').MessageComponentInteraction} MessageComponentInteraction
 */

export default class GameBracket extends MessageComponent {
	constructor() {
		super({
			name: 'game_bracket',
			options: [
				new MessageActionRow({
					components: [
						new MessageButton({
							customID: 'join',
							label: 'Join this Bracket',
							style: 'PRIMARY',
						}),
						new MessageButton({
							customID: 'leave',
							label: 'Leave',
							style: 'DANGER',
						}),
					],
				}),
			],
		});

		this.bracket_queuer = new ProcessQueue();
	}

	async init(client) {
		this.client = client;

		this.options[0].components[0].setEmoji(this.client.qg.emojis.cache.find(e => e.name === 'blob_game'));

		return this;
	}

	/**
     * @param {MessageComponentInteraction} interaction
     * @param {'join' | 'leave'} customID
     */
	async exec(interaction, customID) {
		await interaction.deferUpdate();

		await this.bracket_queuer.queue(async () => {
			/** @type {Message} */
			const message = interaction.message;
			/** @type {GuildMember} */
			const member = interaction.member;

			const embed = message.embeds[0];
			const bracket_name = embed.title;
			const slots = embed.fields.length;
			const isLimited = contains(embed.footer.text, 'limited');
			const inviter = this.client.member(embed.fields[0].value);
			const players = embed.fields.map(field => field.value).filter(p => p !== 'Slot Available');

			if (inviter.id === member.id) return;
			if (contains(embed.footer.text, 'bracket is now full')) return;

			switch (customID) {
			case 'join':
				if (players.includes(member.toString())) return;
				players.forEach(player => {
					this.client.message_manager.sendToUser(player, `${member} joined your ${bracket_name} bracket.`);
				});
				players.push(member);
				break;
			case 'leave':
				if (!players.includes(member.toString())) return;
				players.splice(players.indexOf(member.toString()), 1);
				players.forEach(player => {
					this.client.message_manager.sendToUser(player, `${member} left your ${bracket_name} bracket.`);
				});
				break;
			}

			if (isLimited) {
				for (let slot = 1; slot < slots; slot++) {
					embed.fields[slot].value = players[slot] ?? 'Slot Available';
				}

				if (players.length === slots) {
					message.components = [],
					embed.setFooter('This limited bracket is now full.');
					players.forEach(player => {
						this.client.message_manager.sendToUser(player, {
							content: `Your ${bracket_name} bracket is now full.`,
							embed: embed,
						});
					});
				}
			} else {
				embed.spliceFields(1, slots - 1 > 0 ? slots - 1 : 0, players.filter(p => parseMention(p) !== inviter.id).map((value, index) => {
					return {
						name: `Player ${index + 2}`, value: value,
					};
				}));
			}

			await message.edit({
				embed: embed,
				components: message.components,
			});
		});
	}
}