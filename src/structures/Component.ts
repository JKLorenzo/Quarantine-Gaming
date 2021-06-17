import {
  ButtonInteraction,
  Client,
  MessageActionRow,
  MessageActionRowOptions,
  MessageButton,
} from 'discord.js';

export default abstract class Component {
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
                return new MessageButton(component).setCustomID(
                  `${this.name}__${component.customID}`,
                );
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

  abstract init(client: Client): Promise<void>;

  abstract exec(
    interaction: ButtonInteraction,
    customID: string,
  ): Promise<void>;
}
