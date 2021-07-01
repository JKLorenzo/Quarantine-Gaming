import {
  ApplicationCommandData,
  CommandInteraction,
  Client,
  Guild,
  Snowflake,
  ApplicationCommandPermissionData,
  ApplicationCommand,
  ApplicationCommandOption,
} from 'discord.js';
import constants from '../utils/Constants.js';
import ProcessQueue from '../utils/ProcessQueue.js';

type Server = 'qg' | 'cs';
interface CommandPermissions {
  users?: {
    allow?: Snowflake[];
    deny?: Snowflake[];
  };
  roles?: {
    allow?: Snowflake[];
    deny?: Snowflake[];
  };
}

export default abstract class Command {
  client?: Client;
  data: ApplicationCommandData;
  permissions?: CommandPermissions;
  servers: Server[];

  constructor(
    data: ApplicationCommandData & {
      servers: Server[];
      permissions?: CommandPermissions;
    },
  ) {
    this.data = {
      name: data.name,
      description: data.description,
      defaultPermission: data.defaultPermission,
      options: data.options,
    };
    this.permissions = data.permissions;
    this.servers = data.servers;
  }

  async init(client: Client, queuer: ProcessQueue): Promise<this> {
    this.client = client;
    // Load the command
    await Promise.race([this.load(client)]);
    // Upsert command
    if (this.servers.includes('qg')) await this.upsert(client.qg, queuer);
    if (this.servers.includes('cs')) await this.upsert(client.cs, queuer);
    return this;
  }

  private async upsert(guild: Guild, queuer: ProcessQueue): Promise<void> {
    let this_command = guild.commands.cache.find(
      command => command.name === this.data.name,
    );
    // Create
    if (!this_command) {
      this_command = (await queuer.queue(() =>
        guild.commands.create(this.data),
      )) as ApplicationCommand;

      this.client?.message_manager.sendToChannel(
        constants.cs.channels.logs,
        `[${guild.name}] Command \`${this_command.name}\` created.`,
      );
    }

    // Update command
    const sameDescription = this_command.description === this.data.description;
    const sameOptions =
      JSON.stringify(this_command.options) ===
      JSON.stringify(this.getOptions());
    const sameDefaultPermissions =
      this_command.defaultPermission === this.data.defaultPermission;

    if (!sameDescription || !sameOptions || !sameDefaultPermissions) {
      await queuer.queue(() => this_command!.edit(this.data));
      this.client?.message_manager.sendToChannel(
        constants.cs.channels.logs,
        `[${guild.name}] Command \`${this_command.name}\` data updated.`,
      );
    }

    // Update permissions
    const existingPermissions = await this_command.permissions.fetch({});
    const currentPermissions = [] as ApplicationCommandPermissionData[];
    for (const id of this.permissions?.roles?.allow ?? []) {
      currentPermissions.push({ id, permission: true, type: 'ROLE' });
    }
    for (const id of this.permissions?.roles?.deny ?? []) {
      currentPermissions.push({ id, permission: false, type: 'ROLE' });
    }
    for (const id of this.permissions?.users?.allow ?? []) {
      currentPermissions.push({ id, permission: true, type: 'USER' });
    }
    for (const id of this.permissions?.users?.allow ?? []) {
      currentPermissions.push({ id, permission: false, type: 'USER' });
    }
    const samePermissions =
      JSON.stringify(existingPermissions) ===
      JSON.stringify(currentPermissions);

    if (!samePermissions) {
      await queuer.queue(() =>
        this_command!.permissions.set({
          command: this_command!,
          permissions: currentPermissions,
        }),
      );
      this.client?.message_manager.sendToChannel(
        constants.cs.channels.logs,
        `[${guild.name}] Command \`${this_command.name}\` permissions updated.`,
      );
    }
  }

  private getOptions(options = this.data.options): ApplicationCommandOption[] {
    if (!options && !Array.isArray(options)) return [];
    return options.map(
      option =>
        ({
          type: option.type,
          name: option.name,
          description: option.description,
          required: option.required,
          choices: option.choices,
          options: option.options ? this.getOptions(option.options) : undefined,
        } as ApplicationCommandOption),
    );
  }

  abstract load(client: Client): void;
  abstract exec(interaction: CommandInteraction): Promise<void>;
}
