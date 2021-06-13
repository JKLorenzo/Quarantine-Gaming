import { SlashCommand } from '../../structures/Base.js';
import { constants } from '../../utils/Base.js';

/**
 * @typedef {import('discord.js').Role} Role
 * @typedef {import('discord.js').CommandInteraction} CommandInteraction
 */

/**
 * @typedef {Role[]} Partition Represents a subcommand choice containing 25 roles
 */

export default class Play extends SlashCommand {
  constructor() {
    super({
      name: 'play',
      description: 'Invite members to play a game.',
      options: [],
    });
  }

  /**
   * @private Registers this partition as a subcommand
   * @param {Partition} partition The role partition
   * @param {number} [iteration] The current iteration of this subcommand
   */
  registerPartitionAsSubCommand(partition, iteration = 0) {
    const start = partition[0].name.substring(0, 1).toLowerCase();
    const end = partition[partition.length - 1].name
      .substring(0, 1)
      .toLowerCase();
    const this_name = `${start}_to_${end}${iteration ? `_${iteration}` : ''}`;
    if (this.options.map(option => option.name).includes(this_name)) {
      this.registerPartitionAsSubCommand(partition, ++iteration);
    } else {
      this.options.push({
        name: this_name,
        description: `Invite members to play a game. (${start.toUpperCase()} to ${end.toUpperCase()})`,
        type: 'SUB_COMMAND',
        options: [
          {
            name: 'game',
            description: 'Select the game you want to play.',
            type: 'STRING',
            choices: partition.map(role => ({
              name: role.name,
              value: role.id,
            })),
            required: true,
          },
          {
            name: 'player_count',
            description:
              'Enter the maximum number of players for this bracket. (Max 25)',
            type: 'INTEGER',
            choices: [
              { name: '2', value: 2 },
              { name: '3', value: 3 },
              { name: '4', value: 4 },
              { name: '5', value: 5 },
              { name: '6', value: 6 },
              { name: '7', value: 7 },
              { name: '8', value: 8 },
              { name: '9', value: 9 },
              { name: '10', value: 10 },
              { name: '11', value: 11 },
              { name: '12', value: 12 },
              { name: '13', value: 13 },
              { name: '14', value: 14 },
              { name: '15', value: 15 },
              { name: '16', value: 16 },
              { name: '17', value: 17 },
              { name: '18', value: 18 },
              { name: '19', value: 19 },
              { name: '20', value: 20 },
              { name: '21', value: 21 },
              { name: '22', value: 22 },
              { name: '23', value: 23 },
              { name: '24', value: 24 },
              { name: '25', value: 25 },
            ],
          },
          {
            name: 'reserved_1',
            description:
              'Select the user to reserve in this game invite bracket.',
            type: 'USER',
          },
          {
            name: 'reserved_2',
            description:
              'Select the user to reserve in this game invite bracket.',
            type: 'USER',
          },
          {
            name: 'reserved_3',
            description:
              'Select the user to reserve in this game invite bracket.',
            type: 'USER',
          },
          {
            name: 'reserved_4',
            description:
              'Select the user to reserve in this game invite bracket.',
            type: 'USER',
          },
          {
            name: 'reserved_5',
            description:
              'Select the user to reserve in this game invite bracket.',
            type: 'USER',
          },
          {
            name: 'reserved_6',
            description:
              'Select the user to reserve in this game invite bracket.',
            type: 'USER',
          },
          {
            name: 'reserved_7',
            description:
              'Select the user to reserve in this game invite bracket.',
            type: 'USER',
          },
          {
            name: 'reserved_8',
            description:
              'Select the user to reserve in this game invite bracket.',
            type: 'USER',
          },
          {
            name: 'reserved_9',
            description:
              'Select the user to reserve in this game invite bracket.',
            type: 'USER',
          },
          {
            name: 'reserved_10',
            description:
              'Select the user to reserve in this game invite bracket.',
            type: 'USER',
          },
          {
            name: 'description',
            description:
              'Enter a custom message to be added into this game invite.',
            type: 'STRING',
          },
        ],
      });
    }
  }

  init(client) {
    this.client = client;

    /** @type {Partition[]} */
    const partitions = [];
    const games = this.client.qg.roles.cache
      .filter(r => r.hexColor === constants.colors.game_role)
      .array();
    const games_alphabetical = games.map(r => r.name.toLowerCase()).sort();
    for (const game_name of games_alphabetical) {
      // Initialize the first and the next partition
      if (!partitions.length || partitions[partitions.length - 1].length > 24) {
        partitions.push([]);
      }
      partitions[partitions.length - 1].push(
        games.find(r => r.name.toLowerCase() === game_name),
      );
    }
    for (const partition of partitions) {
      this.registerPartitionAsSubCommand(partition);
    }

    return this;
  }

  /**
   * @typedef {Object} Options
   * @property {string} game
   * @property {number} [player_count]
   * @property {string} [description]
   */

  /**
   * Execute this command.
   * @param {CommandInteraction} interaction The interaction that triggered this command
   * @param {Options} options The options used by this command
   */
  async exec(interaction, options) {
    // Further transform the options to match the properties of a subcommand
    options = options[Object.keys(options)[0]];

    const game_role = this.client.role(options.game);
    if (!game_role) {
      return interaction.reply({
        content: 'Command failed. The game you specified no longer exists.',
        ephemeral: true,
      });
    }

    await interaction.defer({ ephemeral: true });

    const inviteOptions = {
      description: options.description,
      player_count: options.player_count,
      reserved: Array.from(
        new Set(
          [
            options.reserved_1,
            options.reserved_2,
            options.reserved_3,
            options.reserved_4,
            options.reserved_5,
            options.reserved_6,
            options.reserved_7,
            options.reserved_8,
            options.reserved_9,
            options.reserved_10,
          ].filter(r => r && r.toString() !== interaction.member.toString()),
        ),
      ),
    };

    // Check if supplied options are valid
    if (
      typeof inviteOptions.player_count === 'number' &&
      inviteOptions.reserved.length
    ) {
      if (inviteOptions.reserved.length + 1 >= inviteOptions.player_count) {
        return interaction.editReply(
          'You supplied an invalid player count. ' +
            'Your bracket contains more than or equal to the supplied player count.',
        );
      }
    }

    const invite = await this.client.game_manager.createInvite(
      interaction.member,
      game_role,
      inviteOptions,
    );
    return interaction.editReply(
      `Got it! [This bracket](${
        invite.url
      }) will be available on the ${this.client.channel(
        constants.qg.channels.integrations.game_invites,
      )} channel.`,
    );
  }
}
