import { MessageActionRow, MessageButton } from 'discord.js';
import { MessageComponent } from '../structures/Base.js';
import { constants } from '../utils/Base.js';

/**
 * @typedef {import('discord.js').Message} Message
 * @typedef {import('discord.js').MessageComponentInteraction} MessageComponentInteraction
 */

export default class MemberScreening extends MessageComponent {
	constructor() {
		super({
			name: 'member_screening',
			options: [
				new MessageActionRow({
					components: [
						new MessageButton({
							customID: 'approve',
							label: 'Approve',
							style: 'SUCCESS',
						}),
						new MessageButton({
							customID: 'kick',
							label: 'Deny',
							style: 'PRIMARY',
						}),
						new MessageButton({
							customID: 'ban',
							label: 'Ignore requests from this user',
							style: 'DANGER',
						}),
					],
				}),
			],
		});
	}

	async init(client) {
		this.client = client;

		const emojis = this.client.emojis.cache;
		this.options[0].components[0].setEmoji(emojis.find(e => e.name === 'accept'));
		this.options[0].components[1].setEmoji(emojis.find(e => e.name === 'reject'));
		this.options[0].components[2].setEmoji(emojis.find(e => e.name === 'banned'));

		return this;
	}

	/**
     * @param {MessageComponentInteraction} interaction
     * @param {'approve' | 'kick' | 'ban'} customID
     */
	async exec(interaction, customID) {
		await interaction.deferUpdate();

		let message = this.client.message(interaction.message.channel, interaction.message);
		if (message.partial) message = await message.fetch();

		const embed = message.embeds[0];
		const member = this.client.member(embed.fields[0].value);
		const inviter = this.client.member(embed.fields[1].value);
		const moderator = this.client.member(interaction.member);

		if (member) {
			const data = {};
			switch(customID) {
			case 'approve':
				await this.client.role_manager.add(member, constants.qg.roles.member);
				if (inviter) data.inviter = inviter.id;
				if (moderator) data.moderator = moderator.id;
				await this.client.database_manager.updateMemberData(member.id, data);
				embed.fields[3].value = `Approved by ${moderator}`;
				embed.setColor('GREEN');
				break;
			case 'kick':
				await member.kick();
				embed.fields[3].value = `Kicked by ${moderator}`;
				embed.setColor('FUCHSIA');
				break;
			case 'ban':
				await member.ban({
					reason: `Gateway Ban by ${moderator.displayName}.`,
				});
				embed.setColor('RED');
				embed.fields[3].value = `Banned by ${moderator}`;
				break;
			}
		} else {
			embed.fields[3].value = 'User not found ⚠';
		}

		await message.edit({
			embed: embed.setFooter(new Date()),
			components: [],
		});

		const messages = await message.channel.messages.fetch();
		const ping_message = messages.find(msg => msg.content === `${this.client.cs.roles.everyone}, ${member} wants to join the server.`);
		if (ping_message) await ping_message.delete();

		if (customID === 'approve') {
			const games = member.presence.activities.filter(activity => activity.type === 'PLAYING');
			if (games.length) await this.client.game_manager.reload();
		}
	}
}