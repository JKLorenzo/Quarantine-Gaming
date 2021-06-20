import {
  ApplicationCommandData,
  ApplicationCommandOptionData,
  CommandInteraction,
  Collection,
  CommandInteractionOption,
  Client,
} from 'discord.js';

interface CommandPermissions {
  users?: {
    allow?: bigint[];
    deny?: bigint[];
  };
  roles?: {
    allow?: bigint[];
    deny?: bigint[];
  };
}

export default abstract class Command {
  name: string;
  description: string;
  options?: ApplicationCommandOptionData[];
  defaultPermission?: boolean;
  permissions?: CommandPermissions;

  constructor(
    data: ApplicationCommandData & { permissions?: CommandPermissions },
  ) {
    this.name = data.name;
    this.description = data.description;
    this.options = data.options;
    this.defaultPermission = data.defaultPermission;
    this.permissions = data.permissions;
  }

  abstract init(client: Client): Promise<void>;

  abstract exec(
    interaction: CommandInteraction,
    options: Collection<string, CommandInteractionOption>,
  ): Promise<void>;

  getApplicationCommandData(): ApplicationCommandData {
    return {
      name: this.name,
      description: this.description,
      options: this.options,
      defaultPermission: this.defaultPermission,
    };
  }
}
