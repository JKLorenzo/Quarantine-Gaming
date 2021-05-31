import { MessageActionRow, MessageButton } from 'discord.js';
import { MessageComponent } from '../structures/Base.js';
import { constants } from '../utils/Base.js';

/**
 * @typedef {import('discord.js').MessageComponentInteraction} MessageComponentInteraction
 */

export default class NotSafeForWork extends MessageComponent {
	constructor() {
		super({
			name: 'nsfw',
			options: [
				new MessageActionRow({
					components: [
						new MessageButton({
							customID: 'button',
							label: 'Enable or Disable NSFW Content',
							style: 'SECONDARY',
						}),
					],
				}),
			],
		});
	}

	async init(client) {
		this.client = client;

		this.options[0].components[0].setEmoji(this.client.qg.emojis.cache.find(e => e.name === 'pepe_peek'));

		return this;
	}

	/**
     * @param {MessageComponentInteraction} interaction
     */
	async exec(interaction) {
		const member = this.client.member(interaction.member);

		member.roles.cache.has(constants.qg.roles.nsfw)
			? await this.client.role_manager.remove(member, constants.qg.roles.nsfw)
			: await this.client.role_manager.add(member, constants.qg.roles.nsfw);

		await interaction.deferUpdate();
	}
}