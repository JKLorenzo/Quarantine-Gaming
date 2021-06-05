import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { Collection } from 'discord.js';
import {
  ProcessQueue,
  ErrorTicketManager,
  getAllFiles,
  sleep,
  constants,
} from '../utils/Base.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @typedef {import('discord.js').CommandInteraction} CommandInteraction
 * @typedef {import('discord.js').CommandInteractionOption} CommandInteractionOption
 * @typedef {import('discord.js').MessageComponentInteraction} MessageComponentInteraction
 * @typedef {import('../structures/Base').Client} Client
 * @typedef {import('../structures/Base').SlashCommand} SlashCommand
 * @typedef {import('../structures/Base').MessageComponent} MessageComponent
 */

const ETM = new ErrorTicketManager('Interaction Manager');
const initQueuer = new ProcessQueue(1000);

export default class InteractionManager {
  /**
   * @param {Client} client The QG Client
   */
  constructor(client) {
    this.client = client;

    /** @type {Collection<String, SlashCommand>} */
    this.commands = new Collection();

    /** @type {Collection<String, MessageComponent>} */
    this.components = new Collection();

    this.client.on('interaction', interaction => {
      if (interaction.isCommand()) {
        return this.processCommand(interaction);
      }
      if (interaction.isMessageComponent()) {
        return this.processMessageComponent(interaction);
      }
    });
  }

  async init() {
    try {
      const command_loading = this.loadCommands();
      const component_loading = this.loadComponents();
      await Promise.all([command_loading, component_loading]);
      this.client.message_manager.sendToChannel(
        constants.cs.channels.logs,
        '✅ - Interaction Manager',
      );
    } catch (error) {
      this.client.message_manager.sendToChannel(
        constants.cs.channels.logs,
        '❌ - Interaction Manager',
      );
      throw error;
    }
  }

  async loadComponents() {
    try {
      const components_dir = path.join(__dirname, '../components');
      for (const component_path of getAllFiles(components_dir)) {
        try {
          const component_class = await import(pathToFileURL(component_path));
          /** @type {MessageComponent} */
          const component = new component_class.default();
          this.components.set(
            component.name,
            await Promise.race([component.init(this.client)]),
          );
        } catch (error) {
          this.client.error_manager.mark(
            ETM.create(component_path, error, 'loadComponents'),
          );
        }
      }
    } catch (error) {
      this.client.error_manager.mark(ETM.create('loadComponents', error));
    }
  }

  async loadCommands() {
    try {
      const commands_dir = path.join(__dirname, '../commands');
      for (const command_path of getAllFiles(commands_dir)) {
        try {
          const command_class = await import(pathToFileURL(command_path));
          /** @type {SlashCommand} */
          const command = new command_class.default();
          this.commands.set(
            command.name,
            await Promise.race([command.init(this.client)]),
          );
        } catch (error) {
          this.client.error_manager.mark(
            ETM.create(command_path, error, 'loadCommands'),
          );
        }
      }

      const existingApplicationCommands = await this.client.qg.commands
        .fetch()
        .then(application_commands => application_commands.array());
      const existingApplicationCommandPermissions =
        await this.client.qg.commands.fetchPermissions();

      // Delete commands
      for (const this_application_command of existingApplicationCommands) {
        const this_application_command_data = this.commands
          .get(this_application_command.name)
          ?.getApplicationCommandData();
        if (this_application_command_data) continue;
        initQueuer.queue(async () => {
          console.log(
            `InteractionManager: Deleting ${this_application_command.name}`,
          );
          try {
            await this_application_command.delete();
            this.client.message_manager
              .sendToChannel(
                constants.cs.channels.logs,
                `Command \`${this_application_command.name}\` deleted.`,
              )
              // eslint-disable-next-line no-empty-function
              .catch(() => {});
          } catch (error) {
            this.client.error_manager.mark(
              ETM.create(
                `delete ${this_application_command.name}`,
                error,
                'loadCommands',
              ),
            );
          } finally {
            console.log(
              `InteractionManager: Deleted ${this_application_command.name}`,
            );
          }
        });
      }

      // Create commands
      for (const this_command of this.commands.array()) {
        const isPresent = existingApplicationCommands.some(
          application_command => application_command.name === this_command.name,
        );
        if (isPresent) continue;
        initQueuer.queue(async () => {
          console.log(`InteractionManager: Creating ${this_command.name}`);
          try {
            await this.client.qg.commands.create(
              this_command.getApplicationCommandData(),
            );
            this.client.message_manager
              .sendToChannel(
                constants.cs.channels.logs,
                `Command \`${this_command.name}\` created.`,
              )
              // eslint-disable-next-line no-empty-function
              .catch(() => {});
          } catch (error) {
            this.client.error_manager.mark(
              ETM.create(`create ${this_command.name}`, error, 'loadCommands'),
            );
          } finally {
            console.log(`InteractionManager: Created ${this_command.name}`);
          }
        });
      }

      // Update commands
      for (const this_command of this.commands.array()) {
        const this_application_command = this.client.qg.commands.cache.find(
          application_command => application_command.name === this_command.name,
        );
        if (!this_application_command) continue;
        const sameDescription =
          this_application_command.description === this_command.description;
        const sameOptions =
          JSON.stringify(this_application_command.options) ===
          JSON.stringify(this_command.getApplicationCommandOptions());
        const sameDefaultPermissions =
          this_application_command.defaultPermission ===
          this_command.defaultPermission;
        if (sameDescription && sameOptions && sameDefaultPermissions) continue;
        initQueuer.queue(async () => {
          console.log(
            `InteractionManager: Updating ${this_application_command.name}`,
          );
          try {
            await this.client.qg.commands.edit(
              this_application_command,
              this_command.getApplicationCommandData(),
            );
            this.client.message_manager
              .sendToChannel(
                constants.cs.channels.logs,
                `Command \`${this_application_command.name}\` updated.`,
              )
              // eslint-disable-next-line no-empty-function
              .catch(() => {});
          } catch (error) {
            this.client.error_manager.mark(
              ETM.create(`update ${this_command.name}`, error, 'loadCommands'),
            );
          } finally {
            console.log(
              `InteractionManager: Updated ${this_application_command.name}`,
            );
          }
        });
      }

      // Wait for the above methods to finish
      await initQueuer.queue(() => sleep(1000));

      // Update command permissions
      for (const this_command of this.commands.array()) {
        const this_application_command = this.client.qg.commands.cache.find(
          application_command => application_command.name === this_command.name,
        );
        if (!this_application_command) continue;
        const this_application_command_permissions =
          existingApplicationCommandPermissions.get(
            this_application_command.id,
          );
        const this_command_permissions =
          this_command.getApplicationCommandPermissionData();
        const samePermissions =
          JSON.stringify(this_application_command_permissions) ===
          JSON.stringify(this_command_permissions);
        if (samePermissions) continue;
        initQueuer.queue(async () => {
          console.log(
            `InteractionManager: Permission Updating ${this_application_command.name}`,
          );
          try {
            await this_application_command.setPermissions(
              this_command.getApplicationCommandPermissionData(),
            );
            this.client.message_manager
              .sendToChannel(
                constants.cs.channels.logs,
                `Command \`${this_application_command.name}\` permission updated.`,
              )
              // eslint-disable-next-line no-empty-function
              .catch(() => {});
          } catch (error) {
            this.client.error_manager.mark(
              ETM.create(
                `update permission ${this_command.name}`,
                error,
                'loadCommands',
              ),
            );
          } finally {
            console.log(
              `InteractionManager: Permission Updated ${this_application_command.name}`,
            );
          }
        });
      }
    } catch (error) {
      this.client.error_manager.mark(ETM.create('loadCommands', error));
    }
  }

  /**
   * @private
   * @param {MessageComponentInteraction} componentInteraction The interaction to process
   */
  async processMessageComponent(componentInteraction) {
    try {
      const data = componentInteraction.customID.split('__');
      const name = data[0];
      const customID = data[1];
      const component = this.components.get(name);
      if (component) {
        await component.exec(componentInteraction, customID);
        this.client.message_manager
          .sendToChannel(constants.cs.channels.logs, {
            content:
              `**${componentInteraction.user.username}** interacted with the \`${componentInteraction.customID}\` ` +
              `component on **${componentInteraction.channel.name}** channel.`,
            allowedMentions: {
              parse: [],
            },
          })
          // eslint-disable-next-line no-empty-function
          .catch(() => {});
      } else {
        throw new ReferenceError(
          `Interaction component \`${componentInteraction.customID}\` does not exist.`,
        );
      }
    } catch (error) {
      this.client.error_manager.mark(
        ETM.create(
          componentInteraction.customID,
          error,
          'processMessageComponent',
        ),
      );
    }
  }

  /**
   * @private
   * @param {CommandInteraction} commandInteraction The interaction to process
   */
  async processCommand(commandInteraction) {
    try {
      const command = this.commands.get(commandInteraction.commandName);
      if (command) {
        await command.exec(
          commandInteraction,
          this.transformCommandOptions(commandInteraction.options),
        );
        this.client.message_manager
          .sendToChannel(constants.cs.channels.logs, {
            content:
              `**${commandInteraction.user.username}** executed the \`${commandInteraction.commandName}\` ` +
              `command on **${commandInteraction.channel.name}** channel.`,
            allowedMentions: {
              parse: [],
            },
          })
          // eslint-disable-next-line no-empty-function
          .catch(() => {});
      } else {
        throw new ReferenceError(
          `Interaction command \`${commandInteraction.commandName}\` does not exist.`,
        );
      }
    } catch (error) {
      const message = 'It looks like this command has failed.';
      if (commandInteraction.deferred || commandInteraction.replied) {
        commandInteraction.editReply(message);
      } else {
        commandInteraction.reply(message);
      }
      this.client.error_manager.mark(
        ETM.create(commandInteraction.commandName, error, 'processCommand'),
      );
    }
  }

  /**
   * @private
   * @param {Collection<string, CommandInteractionOption>} options The options to transform
   * @param {Object} [args] The arguments of this option
   * @returns {Object}
   */
  transformCommandOptions(options, args = {}) {
    try {
      if (typeof options === 'undefined') return args;
      for (const option of options.array()) {
        if (option.options) {
          if (option.type) {
            args[option.name] = this.transformCommandOptions(option.options, {
              option: option.name,
            });
          } else {
            args = this.transformCommandOptions(option.options);
          }
        } else if (
          option.channel ||
          option.member ||
          option.role ||
          option.user
        ) {
          args[option.name] =
            option.channel ?? option.member ?? option.role ?? option.user;
        } else {
          args[option.name] = option.value;
        }
      }
      return args;
    } catch (error) {
      this.client.error_manager.mark(
        ETM.create('transformCommandOptions', error),
      );
    }
  }
}
