import { MessageActionRow, MessageButton } from 'discord.js';
import { MessageComponent } from '../structures/Base.js';
import { constants } from '../utils/Base.js';

/**
 * @typedef {import('discord.js').MessageComponentInteraction} MessageComponentInteraction
 */

export default class FreeGameUpdate extends MessageComponent {
	constructor() {
		super({
			name: 'fgu',
			options: [
				new MessageActionRow({
					components: [
						new MessageButton({
							customID: 'steam',
							style: 'SECONDARY',
						}),
						new MessageButton({
							customID: 'epic',
							style: 'SECONDARY',
						}),
						new MessageButton({
							customID: 'gog',
							style: 'SECONDARY',
						}),
						new MessageButton({
							customID: 'ubisoft',
							style: 'SECONDARY',
						}),
						new MessageButton({
							customID: 'console',
							style: 'SECONDARY',
						}),
					],
				}),
			],
		});
	}

	async init(client) {
		this.client = client;

		this.options[0].components[0].setEmoji(this.client.guild.emojis.cache.find(e => e.name === 'steam'));
		this.options[0].components[1].setEmoji(this.client.guild.emojis.cache.find(e => e.name === 'epic_games'));
		this.options[0].components[2].setEmoji(this.client.guild.emojis.cache.find(e => e.name === 'gog'));
		this.options[0].components[3].setEmoji(this.client.guild.emojis.cache.find(e => e.name === 'ubisoft'));
		this.options[0].components[4].setEmoji(this.client.guild.emojis.cache.find(e => e.name === 'controller'));

		return this;
	}

	/**
     * @param {MessageComponentInteraction} interaction
     * @param {'steam' | 'epic' | 'gog' | 'ubisoft' | 'console'} customID
     */
	async exec(interaction, customID) {
		const member = this.client.member(interaction.member);

		switch(customID) {
		case 'steam':
			member.hasRole(constants.roles.steam)
				? await this.client.role_manager.remove(member, constants.roles.steam)
				: await this.client.role_manager.add(member, constants.roles.steam);
			break;
		case 'epic':
			member.hasRole(constants.roles.epic)
				? await this.client.role_manager.remove(member, constants.roles.epic)
				: await this.client.role_manager.add(member, constants.roles.epic);
			break;
		case 'gog':
			member.hasRole(constants.roles.gog)
				? await this.client.role_manager.remove(member, constants.roles.gog)
				: await this.client.role_manager.add(member, constants.roles.gog);
			break;
		case 'ubisoft':
			member.hasRole(constants.roles.ubisoft)
				? await this.client.role_manager.remove(member, constants.roles.ubisoft)
				: await this.client.role_manager.add(member, constants.roles.ubisoft);
			break;
		case 'xbox':
			member.hasRole(constants.roles.console)
				? await this.client.role_manager.remove(member, constants.roles.console)
				: await this.client.role_manager.add(member, constants.roles.console);
			break;
		}

		await interaction.deferUpdate();
	}
}