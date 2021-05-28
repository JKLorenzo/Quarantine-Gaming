/**
 * @typedef {import('discord.js').MessageComponentInteraction} MessageComponentInteraction
 * @typedef {import('discord.js').MessageActionRowOptions} MessageActionRowOptions
 * @typedef {import('discord.js').MessageButtonOptions} MessageButtonOptions
 * @typedef {import('./Base.js').Client} Client
 */

/**
 * @typedef {MessageButtonOptions[]} Components
 * @typedef {Object} ComponentData
 * @property {String} name The name of this component
 * @property {Components[]} options An array of action row containing message components.
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
		return this.options.map(action_row => {
			/** @type {MessageActionRowOptions} */
			const this_row = {
				type: 'ACTION_ROW',
				components: action_row.map(component => {
					return {
						...component,
						customID: `${this.name}_${component.customID}`,
					};
				}),
			};
			return this_row;
		});
	}
}