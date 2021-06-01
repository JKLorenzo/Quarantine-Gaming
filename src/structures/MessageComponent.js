import { MessageActionRow, MessageButton } from 'discord.js';

/**
 * @typedef {import('discord.js').MessageActionRowOptions} MessageActionRowOptions
 * @typedef {import('discord.js').MessageComponentInteraction} MessageComponentInteraction
 * @typedef {import('./Base.js').Client} Client
 */

/**
 * @typedef {Object} ComponentData
 * @property {String} name The name of this component
 * @property {MessageActionRowOptions[]} options An array of action row containing message components.
 */

export default class MessageComponent {
	/** @param {ComponentData} data */
	constructor(data) {
		this.name = data.name;
		this.options = data.options;
	}

	/**
	 * Initializes this message component.
	 * @param {Client} client
	 */
	async init(client) {
		this.client = client;
		return this;
	}

	/**
     * @param {MessageComponentInteraction} interaction
     * @param {String} customID
     */
	async exec(interaction, customID) {
		console.log({ interaction, customID });
	}

	/**
	 * Transforms this component options to message action row options.
	 */
	getComponents() {
		return this.options?.map(action_row => {
			return new MessageActionRow({
				components: action_row.components?.map(component => {
					switch(component.type) {
					case 'BUTTON': return new MessageButton({
						...component,
						customID: `${this.name}__${component.customID}`,
					});
					default: return undefined;
					}
				}).filter(component => typeof component !== 'undefined'),
			});
		});
	}
}