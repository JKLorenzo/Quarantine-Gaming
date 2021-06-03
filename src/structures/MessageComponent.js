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
  /**
   * @param {ComponentData} data The message component data
   */
  constructor(data) {
    this.name = data.name;
    this.options = data.options;
  }

  /**
   * Initializes this message component.
   * @param {Client} client The QG Client
   * @returns {ComponentData}
   */
  init(client) {
    this.client = client;
    return this;
  }

  /**
   * Executes this component
   * @param {MessageComponentInteraction} interaction The interaction that triggered this component
   * @param {string} customID The customID of the component
   */
  exec(interaction, customID) {
    console.log({ interaction, customID });
  }

  /**
   * Transforms this component options into message action rows.
   * @returns {MessageActionRow[]}
   */
  getComponents() {
    return this.options?.map(
      action_row =>
        new MessageActionRow({
          components: action_row.components
            ?.map(component => {
              switch (component.type) {
                case 'BUTTON':
                  return new MessageButton({
                    ...component,
                    customID: `${this.name}__${component.customID}`,
                  });
                default:
                  return undefined;
              }
            })
            .filter(component => typeof component !== 'undefined'),
        }),
    );
  }
}
