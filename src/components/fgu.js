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
							label: 'Steam',
							style: 'SECONDARY',
						}),
						new MessageButton({
							customID: 'epic',
							label: 'Epic Games',
							style: 'SECONDARY',
						}),
						new MessageButton({
							customID: 'gog',
							label: 'GOG',
							style: 'SECONDARY',
						}),
						new MessageButton({
							customID: 'ubisoft',
							label: 'UPlay',
							style: 'SECONDARY',
						}),
					],
				}),
				new MessageActionRow({
					components: [
						new MessageButton({
							customID: 'xbox',
							label: 'Xbox',
							style: 'SECONDARY',
						}),
						new MessageButton({
							customID: 'playstation',
							label: 'PlayStation',
							style: 'SECONDARY',
						}),
						new MessageButton({
							customID: 'wii',
							label: 'Wii',
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

		this.options[1].components[0].setEmoji(this.client.guild.emojis.cache.find(e => e.name === 'xbox'));
		this.options[1].components[1].setEmoji(this.client.guild.emojis.cache.find(e => e.name === 'playstation'));
		this.options[1].components[2].setEmoji(this.client.guild.emojis.cache.find(e => e.name === 'wii'));

		return this;
	}

	/**
     * @param {MessageComponentInteraction} interaction
     * @param {'steam' | 'epic' | 'gog' | 'ubisoft' | 'xbox' | 'playstation' | 'wii'} customID
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
			member.hasRole(constants.roles.xbox)
				? await this.client.role_manager.remove(member, constants.roles.xbox)
				: await this.client.role_manager.add(member, constants.roles.xbox);
			break;
		case 'playstation':
			member.hasRole(constants.roles.playstation)
				? await this.client.role_manager.remove(member, constants.roles.playstation)
				: await this.client.role_manager.add(member, constants.roles.playstation);
			break;
		case 'wii':
			member.hasRole(constants.roles.wii)
				? await this.client.role_manager.remove(member, constants.roles.wii)
				: await this.client.role_manager.add(member, constants.roles.wii);
			break;
		}

		await interaction.deferUpdate();
	}
}