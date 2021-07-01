import { readdirSync } from 'fs';
import { join } from 'path';
import {
  Client,
  Collection,
  CommandInteraction,
  MessageComponentInteraction,
  TextChannel,
} from 'discord.js';
import Command from '../structures/Command';
import Component from '../structures/Component';
import constants from '../utils/Constants';
import ErrorTicketManager from '../utils/ErrorTicketManager';
import { sleep } from '../utils/Functions';
import ProcessQueue from '../utils/ProcessQueue';

interface ReloadRequest {
  name: string;
  timeout: number;
}

const ETM = new ErrorTicketManager('Interaction Manager');

export default class InteractionManager {
  client: Client;
  commands: Collection<string, Command>;
  components: Collection<string, Component>;
  queuer: ProcessQueue;
  reloading: boolean;
  reload_request_queue: ReloadRequest[];

  constructor(client: Client) {
    this.client = client;
    this.commands = new Collection();
    this.components = new Collection();
    this.queuer = new ProcessQueue(5000);
    this.reloading = false;
    this.reload_request_queue = [];
  }

  async init(): Promise<void> {
    try {
      await Promise.all([this.loadCommands(), this.loadComponents()]);
    } catch (error) {
      this.client.message_manager.sendToChannel(
        `${constants.cs.channels.logs}`,
        '❌ - Interaction Manager',
      );
    }

    this.client.on('interaction', interaction => {
      if (interaction.isCommand()) {
        return this.processCommand(interaction);
      } else if (interaction.isMessageComponent()) {
        return this.processComponent(interaction);
      }
    });
  }

  async loadCommands(): Promise<void> {
    try {
      const path = new URL('../commands', import.meta.url).pathname;
      for (const filename of readdirSync(path)) {
        try {
          const filepath = join(path, filename);
          const SlashCommand = await import(filepath);
          const command = new SlashCommand() as Command;
          this.commands.set(
            command.data.name,
            await command.init(this.client, this.queuer),
          );
        } catch (error) {
          this.client.error_manager.mark(
            ETM.create(`importCommand(${filename})`, error, 'loadCommands'),
          );
        }
      }
    } catch (error) {
      this.client.error_manager.mark(ETM.create('loadCommands', error));
    }
  }

  async loadComponents(): Promise<void> {
    try {
      const path = new URL('../components', import.meta.url).pathname;
      for (const filename of readdirSync(path)) {
        try {
          const filepath = join(path, filename);
          const MessageComponent = await import(filepath);
          const component = new MessageComponent() as Component;
          this.components.set(
            component.name,
            await component.init(this.client),
          );
        } catch (error) {
          this.client.error_manager.mark(
            ETM.create(`importCommand(${filename})`, error, 'loadCommands'),
          );
        }
      }
    } catch (error) {
      this.client.error_manager.mark(ETM.create('loadCommands', error));
    }
  }

  reloadCommand(name: string): void {
    const this_request_index = this.reload_request_queue.findIndex(
      request => request.name === name,
    );
    if (this_request_index !== -1) {
      this.reload_request_queue[this_request_index].timeout = 10;
    } else {
      this.reload_request_queue.push({ name: name, timeout: 10 });
    }

    if (!this.reloading) this.commandReloader();
  }

  private async commandReloader(): Promise<void> {
    this.reloading = true;
    while (this.reload_request_queue.length > 0) {
      for (let i = 0; i < this.reload_request_queue.length; i++) {
        const request = this.reload_request_queue[i];
        if (request.timeout === 0) {
          const command = this.commands.get(request.name);
          if (command) {
            this.commands.set(
              command.data.name,
              await command.init(this.client, this.queuer),
            );
          } else {
            this.client.error_manager.mark(
              ETM.create(
                request.name,
                new ReferenceError(
                  `Interaction command \`${request.name}\` does not exist.`,
                ),
                'commandReloader',
              ),
            );
          }
          this.reload_request_queue.splice(i, 1);
        } else {
          // Decrement request timeout
          request.timeout--;
          this.reload_request_queue[i] = request;
        }
      }
      await sleep(1000);
    }
    this.reloading = false;
  }

  async processCommand(interaction: CommandInteraction): Promise<void> {
    try {
      const command = this.commands.get(interaction.commandName);
      if (command) {
        await command.exec(interaction);
        this.client.message_manager
          .sendToChannel(constants.cs.channels.logs, {
            content:
              `**${interaction.user.username}** executed the \`${interaction.commandName}\` ` +
              `command on **${
                (interaction.channel as TextChannel).name
              }** channel.`,
          })
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          .catch(() => {});
      } else {
        throw new ReferenceError(
          `Interaction command \`${interaction.commandName}\` does not exist.`,
        );
      }
    } catch (error) {
      const message = 'It looks like this command has failed.';
      if (interaction.deferred || interaction.replied) {
        interaction.editReply(message);
      } else {
        interaction.reply({
          content: message,
          ephemeral: true,
        });
      }
      this.client.error_manager.mark(
        ETM.create(interaction.commandName, error, 'processCommand'),
      );
    }
  }

  async processComponent(
    interaction: MessageComponentInteraction,
  ): Promise<void> {
    try {
      const data = interaction.customID.split('__');
      const name = data[0];
      const customID = data[1];
      const component = this.components.get(name);
      if (component) {
        await component.exec(interaction, customID);
        this.client.message_manager
          .sendToChannel(
            constants.cs.channels.logs,
            `**${interaction.user.username}** interacted with the \`${interaction.customID}\` ` +
              `component on **${
                (interaction.channel as TextChannel).name
              }** channel.`,
          )
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          .catch(() => {});
      } else {
        throw new ReferenceError(
          `Interaction component \`${interaction.customID}\` does not exist.`,
        );
      }
    } catch (error) {
      this.client.error_manager.mark(
        ETM.create(interaction.customID, error, 'processComponent'),
      );
    }
  }
}
