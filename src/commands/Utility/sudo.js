import util from 'util';
import tags from 'common-tags';
import Discord from 'discord.js';
import { SlashCommand } from '../../structures/Base.js';
import { constants } from '../../utils/Base.js';

/**
 * @typedef {import('discord.js').CommandInteraction} CommandInteraction
 */

const nl = '!!NL!!';
const nlPattern = new RegExp(nl, 'g');

export default class Sudo extends SlashCommand {
  constructor() {
    super({
      name: 'sudo',
      description: '[Owner] Execute a command as a superuser.',
      options: [
        {
          name: 'command',
          description: 'Enter the command to execute.',
          type: 'STRING',
          required: true,
        },
      ],
      defaultPermission: false,
      permissions: {
        users: {
          allow: [constants.owner],
        },
      },
    });

    this.lastResult = null;
    Object.defineProperty(this, '_sensitivePattern', {
      value: null,
      configurable: true,
    });
  }

  /**
   * @typedef {Object} Options
   * @property {string} command
   */

  /**
   * Execute this command.
   * @param {CommandInteraction} interaction The interaction that triggered this command
   * @param {Options} options The options used by this command
   */
  async exec(interaction, options) {
    await interaction.defer({ ephemeral: true });

    let command = options.command;

    /* eslint-disable no-unused-vars */
    const lastResult = this.lastResult;
    const doReply = val => {
      if (val instanceof Error) {
        interaction.editReply(`Callback error: \`${val}\``);
      } else {
        const result = this.makeResultMessages(
          val,
          process.hrtime(this.hrStart),
        );
        if (Array.isArray(result)) {
          /** @type {MessageEmbed[]} */
          const embeds = [];
          for (const item of result) {
            embeds.push(
              new Discord.MessageEmbed().setDescription(String(item)),
            );
          }
          interaction.editReply({ embeds: embeds });
        } else {
          interaction.editReply(String(result));
        }
      }
    };

    // Remove any surrounding code blocks before evaluation
    if (command.startsWith('```') && command.endsWith('```')) {
      command = command.replace(/(^.*?\s)|(\n.*$)/g, '');
    }

    // Run the code and measure its execution time
    let hrDiff;
    try {
      const hrStart = process.hrtime();
      this.lastResult = eval(command);
      hrDiff = process.hrtime(hrStart);
    } catch (err) {
      return interaction.editReply(`Error while evaluating: \`${err}\``);
    }

    // Prepare for callback time and respond
    this.hrStart = process.hrtime();
    const result = this.makeResultMessages(this.lastResult, hrDiff, command);
    if (Array.isArray(result)) {
      /** @type {MessageEmbed[]} */
      const embeds = [];
      result.forEach(item =>
        embeds.push(new Discord.MessageEmbed().setDescription(item)),
      );
      return interaction.editReply(String(result));
    } else {
      return interaction.editReply(String(result));
    }
  }

  escapeRegex(str) {
    return str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
  }

  makeResultMessages(result, hrDiff, input = null) {
    const inspected = util
      .inspect(result, { depth: 0 })
      .replace(nlPattern, '\n')
      .replace(this.sensitivePattern, '--snip--');
    const split = inspected.split('\n');
    const last = inspected.length - 1;
    const prependPart =
      inspected[0] !== '{' && inspected[0] !== '[' && inspected[0] !== "'"
        ? split[0]
        : inspected[0];
    const appendPart =
      inspected[last] !== '}' &&
      inspected[last] !== ']' &&
      inspected[last] !== "'"
        ? split[split.length - 1]
        : inspected[last];
    const prepend = `\`\`\`javascript\n${prependPart}\n`;
    const append = `\n${appendPart}\n\`\`\``;
    if (input) {
      return Discord.splitMessage(
        tags.stripIndents`
				*Executed in ${hrDiff[0] > 0 ? `${hrDiff[0]}s ` : ''}${hrDiff[1] / 1000000}ms.*
				\`\`\`javascript
				${inspected}
				\`\`\`
			`,
        { maxLength: 1900, prepend, append },
      );
    } else {
      return Discord.splitMessage(
        tags.stripIndents`
				*Callback executed after ${hrDiff[0] > 0 ? `${hrDiff[0]}s ` : ''}${
          hrDiff[1] / 1000000
        }ms.*
				\`\`\`javascript
				${inspected}
				\`\`\`
			`,
        { maxLength: 1900, prepend, append },
      );
    }
  }

  get sensitivePattern() {
    if (!this._sensitivePattern) {
      const client = this.client;
      let pattern = '';
      if (client.token) pattern += this.escapeRegex(client.token);
      Object.defineProperty(this, '_sensitivePattern', {
        value: new RegExp(pattern, 'gi'),
        configurable: false,
      });
    }
    return this._sensitivePattern;
  }
}
