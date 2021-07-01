import {
  Client,
  MessageActionRow,
  MessageActionRowOptions,
  MessageButton,
  MessageButtonOptions,
  MessageComponentInteraction,
  MessageSelectMenu,
  MessageSelectMenuOptions,
} from 'discord.js';

export default abstract class Component {
  client?: Client;
  name: string;
  options: MessageActionRowOptions[];

  constructor(data: { name: string; options: MessageActionRowOptions[] }) {
    this.name = data.name;
    this.options = data.options;
  }

  toJSON(): MessageActionRow[] {
    return this.options.map(
      row =>
        new MessageActionRow({
          components: row.components?.map(component => {
            switch (component.type) {
              case 'BUTTON':
                return new MessageButton(
                  component as MessageButtonOptions,
                ).setCustomID(`${this.name}__${component.customID}`);
              case 'SELECT_MENU':
                return new MessageSelectMenu(
                  component as MessageSelectMenuOptions,
                ).setCustomID(`${this.name}__${component.customID}`);
              default:
                return {
                  ...component,
                  customID: `${this.name}__${component.customID}`,
                };
            }
          }),
        }),
    );
  }

  async init(client: Client): Promise<this> {
    this.client = client;
    // Load the component
    await Promise.race([this.load(client)]);
    return this;
  }

  abstract load(client: Client): void;

  abstract exec(
    interaction: MessageComponentInteraction,
    customID: string,
  ): Promise<void>;
}
