import { MessageEmbed, Permissions } from 'discord.js';
import {
  ErrorTicketManager,
  ProcessQueue,
  parseMention,
  sleep,
  constants,
  generateColor,
  contains,
} from '../utils/Base.js';

/**
 * @typedef {import('discord.js').Role} Role
 * @typedef {import('discord.js').VoiceState} VoiceState
 * @typedef {import('discord.js').GuildMember} GuildMember
 * @typedef {import('discord.js').TextChannel} TextChannel
 * @typedef {import('discord.js').VoiceChannel} VoiceChannel
 * @typedef {import('discord.js').CategoryChannel} CategoryChannel
 * @typedef {import('../structures/Base').Client} Client
 */

const ETM = new ErrorTicketManager('Dedicated Channel Manager');
const { VIEW_CHANNEL, CONNECT } = Permissions.FLAGS;

/**
 * @param {Client} client The QG Client
 * @param {TextChannel} text_channel The dedicated text channel
 * @param {VoiceChannel} voice_channel The dedicated voice channel
 * @param {string} name The name of the channel
 */
async function displayInfo(client, text_channel, voice_channel, name) {
  await client.message_manager.sendToChannel(
    text_channel,
    new MessageEmbed({
      author: { name: 'Quarantine Gaming: Dedicated Channels' },
      title: `Voice and Text Channels for ${name}`,
      description: [
        '\u200b 🔹 Only members who are in this voice channel can view this text channel.',
        `\u200b 🔹 ${voice_channel} voice and ${text_channel} text channels will automatically be ` +
          `deleted once everyone is disconnected from these channels.`,
        `\u200b 🔹 This channel will be renamed automatically depending on the game the members in ` +
          `this channel are playing. When multiple games are being played, the game with the highest ` +
          `number of players will be chosen.`,
        `**Useful Commands for Dedicated Channels:**\n${[
          '\u200b \u200b \u200b \u200b 📎 `/dedicate custom_name: <name>` to rename this channel to a custom name.',
          '\u200b \u200b \u200b \u200b 🔒 `/dedicate lock: True` to lock this channel.',
          '\u200b \u200b \u200b \u200b 🔓 `/dedicate lock: False` to unlock this channel.',
          '\u200b \u200b \u200b \u200b 🚏 `/transfer <member>` to transfer members from other voice channel ' +
            'to this channel regardless whether this channel is locked or unlocked.',
        ].join('\n\n')}`,
        `Note: ${client.role(constants.qg.roles.staff)}, ${client.role(
          constants.qg.roles.moderator,
        )}, ` +
          `and ${client.role(
            constants.qg.roles.music_bot,
          )} can interact with these channels.`,
      ].join('\n\n'),
      color: 'BLURPLE',
    }),
  );
}

export default class DedicatedChannelManager {
  /**
   * @param {Client} client The QG Client
   */
  constructor(client) {
    this.client = client;
    this.queuer = new ProcessQueue(1000);
  }

  init() {
    this.clean();

    this.client.on('voiceStateUpdate', (oldState, newState) => {
      // Block updates on the same channel
      if (newState.channelID === oldState.channelID) return;
      this.processVoiceStateUpdate(oldState, newState);
    });

    // Auto dedicate every 5 minutes
    setInterval(() => {
      this.autoDedicate();
    }, 300000);
  }

  /**
   * Automatically dedicates all channels.
   */
  autoDedicate() {
    try {
      /** @type {CategoryChannel} */
      const dedicated_voice_channels_category = this.client.channel(
        constants.qg.channels.category.dedicated_voice,
      );
      /** @type {CategoryChannel} */
      const public_voice_channels_category = this.client.channel(
        constants.qg.channels.category.voice,
      );
      /** @type {VoiceChannel[]} */
      const channels_for_dedication = [
        ...dedicated_voice_channels_category.children.array(),
        ...public_voice_channels_category.children.array(),
      ];
      for (const this_channel of channels_for_dedication) {
        const members = this_channel.members.array();
        if (!members.length) continue;

        const game = this.client.methods.getMostPlayedGame(members);
        if (
          game &&
          !this_channel.name.substring(2).startsWith(game.substring(5))
        ) {
          if (this_channel.name.startsWith('🔰')) {
            if (
              this.client.qg.roles.cache.some(
                r =>
                  r.hexColor === constants.colors.game_role &&
                  contains(this_channel.name, r.name),
              )
            ) {
              this.create(this_channel, game.substring(5));
            }
          } else {
            this.create(this_channel, game.substring(5));
          }
        }
      }
    } catch (error) {
      this.client.error_manager.mark(ETM.create('autoDedicate', error));
    }
  }

  /**
   * Creates a dedicated channel.
   * @param {VoiceChannel} channel_origin The channel to dedicate
   * @param {string} name The name of the channel to create
   * @typedef {Object} DedicateData
   * @property {Role} team_role
   * @property {TextChannel} text_channel
   * @property {VoiceChannel} voice_channel
   * @property {Promise<void>} transfer_process
   * @returns {Promise<DedicateData>}
   */
  create(channel_origin, name) {
    return this.queuer.queue(async () => {
      if (!channel_origin?.members.size) return;
      try {
        const channel_name = `🔰${name}`;
        if (
          channel_origin.parentID ===
          constants.qg.channels.category.dedicated_voice
        ) {
          // Block renaming of channel with the same or custom name
          if (!name || channel_origin.name === channel_name) return;

          // Rename
          await channel_origin.setName(channel_name);
          /** @type {CategoryChannel} */
          const dedicated_text_channels_category = this.client.channel(
            constants.qg.channels.category.dedicated,
          );
          /** @type {Array<TextChannel>} */
          const dedicated_text_channels =
            dedicated_text_channels_category.children.array();
          const dedicated_text_channel = dedicated_text_channels.find(
            channel =>
              channel.topic &&
              parseMention(channel.topic.split(' ')[0]) === channel_origin.id,
          );
          await dedicated_text_channel.setName(channel_name);
          const team_role = this.client.role(
            dedicated_text_channel.topic.split(' ')[1],
          );
          await team_role.setName(`Team ${channel_name}`);

          displayInfo(
            this.client,
            dedicated_text_channel,
            channel_origin,
            channel_name,
          );

          return {
            team_role: team_role,
            text_channel: dedicated_text_channel,
            voice_channel: channel_origin,
          };
        } else {
          // Notify
          const this_speech = this.client.speech_manager.say(
            channel_origin,
            `You will be transferred to ${name} dedicated channel. Please wait.`,
          );

          const team_role = await this.client.role_manager.create({
            name: `Team ${channel_name}`,
            position:
              this.client.role(constants.qg.roles.streaming).position + 1,
            hoist: true,
            color: generateColor({ min: 100 }).toHex(),
          });

          const dedicated_voice_channel =
            await this.client.channel_manager.create(channel_name, {
              type: 'voice',
              parent: constants.qg.channels.category.dedicated_voice,
              permissionOverwrites: [
                {
                  id: constants.qg.roles.everyone,
                  deny: [VIEW_CHANNEL],
                },
                {
                  id: constants.qg.roles.member,
                  allow: [VIEW_CHANNEL],
                },
                {
                  id: constants.qg.roles.moderator,
                  allow: [CONNECT],
                },
                {
                  id: constants.qg.roles.music_bot,
                  allow: [VIEW_CHANNEL],
                },
              ],
              bitrate: 128000,
            });

          const dedicated_text_channel =
            await this.client.channel_manager.create(channel_name, {
              type: 'text',
              parent: constants.qg.channels.category.dedicated,
              permissionOverwrites: [
                {
                  id: constants.qg.roles.everyone,
                  deny: [VIEW_CHANNEL],
                },
                {
                  id: constants.qg.roles.moderator,
                  allow: [VIEW_CHANNEL],
                },
                {
                  id: constants.qg.roles.music_bot,
                  allow: [VIEW_CHANNEL],
                },
                {
                  id: team_role.id,
                  allow: [VIEW_CHANNEL],
                },
              ],
              topic: `${dedicated_voice_channel} ${team_role}`,
            });

          displayInfo(
            this.client,
            dedicated_text_channel,
            dedicated_voice_channel,
            channel_name,
          );

          // Delay for ~5 seconds
          await this_speech;
          await sleep(5000);

          // Sort streamers from members and transfer
          const [streamers, members] = channel_origin.members.partition(
            this_member =>
              this_member.roles.cache.has(constants.qg.roles.streaming),
          );
          const transferProcess = this.client.methods.voiceChannelTransfer(
            dedicated_voice_channel,
            [...streamers.array(), ...members.array()],
          );
          return {
            team_role: team_role,
            text_channel: dedicated_text_channel,
            voice_channel: dedicated_voice_channel,
            transfer_process: transferProcess,
          };
        }
      } catch (error) {
        return this.client.error_manager.mark(ETM.create('create', error));
      }
    });
  }

  /**
   * Removes unused dedicated channel.
   * @returns {Promise<null>}
   */
  clean() {
    return this.queuer.queue(async () => {
      try {
        // Delete unused roles
        let promises = [];
        const team_roles = this.client.qg.roles.cache.filter(r => {
          if (r.name.startsWith('Team 🔰')) {
            if (r.members.size === 0) return true;
            /** @type {CategoryChannel} */
            const dedicated_text_category = this.client.channel(
              constants.qg.channels.category.dedicated,
            );
            return !dedicated_text_category.children?.some(c => {
              if (c.isText()) {
                const data = c.topic.split(' ');
                return this.client.role(data[1])?.id === r.id;
              }
              return false;
            });
          }
          return false;
        });
        for (const team_role of team_roles.array()) {
          promises.push(this.client.role_manager.delete(team_role));
        }
        await Promise.all(promises);

        // Delete unused voice channels
        promises = [];
        /** @type {CategoryChannel} */
        const voice_channel_category = this.client.channel(
          constants.qg.channels.category.dedicated_voice,
        );
        const voice_channels = voice_channel_category.children.filter(
          c => c.members.size === 0,
        );
        for (const voice_channel of voice_channels.array()) {
          promises.push(this.client.channel_manager.delete(voice_channel));
        }
        await Promise.all(promises);

        // Delete unused text channels
        promises = [];
        /** @type {CategoryChannel} */
        const text_channel_category = this.client.channel(
          constants.qg.channels.category.dedicated,
        );
        const text_channels = text_channel_category.children.filter(c => {
          if (c.isText()) {
            if (!c.topic) return true;
            const data = c.topic.split(' ');
            if (!this.client.channel(data[0])) return true;
            if (!this.client.role(data[1])) return true;
          }
          return false;
        });
        for (const text_channel of text_channels.array()) {
          promises.push(this.client.channel_manager.delete(text_channel));
        }
        await Promise.all(promises);
      } catch (error) {
        this.client.error_manager.mark(ETM.create('load', error));
      }
    });
  }

  /**
   * @private
   * @param {VoiceState} oldState The old voice state
   * @param {VoiceState} newState The new voice state
   */
  async processVoiceStateUpdate(oldState, newState) {
    const member = newState.member;
    try {
      if (
        oldState.channel?.parent?.id ===
        constants.qg.channels.category.dedicated_voice
      ) {
        const text_channel = this.client
          .channel(constants.qg.channels.category.dedicated)
          .children.find(
            channel =>
              channel.type === 'text' &&
              channel.topic &&
              parseMention(channel.topic.split(' ')[0]) === oldState.channelID,
          );
        const linked_data = text_channel.topic.split(' ');
        const team_role = this.client.role(linked_data[1]);

        if (
          oldState.channel.members.size > 0 &&
          !(
            oldState.channel.members.size === 1 &&
            oldState.channel.members.first().user.bot
          )
        ) {
          this.client.role_manager.remove(member, team_role);
          this.client.message_manager.sendToChannel(
            text_channel,
            new MessageEmbed({
              author: { name: 'Quarantine Gaming: Dedicated Channels' },
              title: oldState.channel.name,
              thumbnail: { url: member.user.displayAvatarURL() },
              description: `${oldState.member} left this channel.`,
              footer: { text: `${member.user.tag} (${member.user.id})` },
              timestamp: new Date(),
              color: 'RED',
            }),
          );
        } else {
          await this.client.role_manager.delete(team_role);
          await this.client.channel_manager.delete(oldState.channel);
          await this.client.channel_manager.delete(text_channel);
        }
      }

      if (newState.channel) {
        // Check if members are streaming
        const streamers = [];
        for (const this_member of newState.channel.members.array()) {
          if (
            member.user.id !== this_member.user.id &&
            this_member.roles.cache.has(constants.qg.roles.streaming)
          ) {
            streamers.push(this_member);
          }
        }

        // Notify member
        if (streamers.length > 0) {
          this.client.message_manager.sendToUser(
            member,
            new MessageEmbed({
              author: { name: 'Quarantine Gaming: Information' },
              title: `${
                streamers.length > 1
                  ? `${streamers
                      .map(this_member => this_member.displayName)
                      .join(' and ')} are`
                  : `${streamers.map(
                      this_member => this_member.displayName,
                    )} is`
              } currently Streaming`,
              thumbnail: { url: member.user.displayAvatarURL() },
              description:
                'Please observe proper behavior on your current voice channel.',
              image: { url: constants.images.streaming_banner },
              color: 'YELLOW',
            }),
          );
        }

        if (
          newState.channel.parent?.id ===
          constants.qg.channels.category.dedicated_voice
        ) {
          const text_channel = this.client
            .channel(constants.qg.channels.category.dedicated)
            .children.find(
              channel =>
                channel.topic &&
                parseMention(channel.topic.split(' ')[0]) ===
                  newState.channelID,
            );
          const linked_data = text_channel.topic.split(' ');
          const team_role = this.client.role(linked_data[1]);

          // Add Text Role
          if (!member.roles.cache.has(team_role.id)) {
            this.client.role_manager.add(member, team_role);
            this.client.message_manager.sendToChannel(
              text_channel,
              new MessageEmbed({
                author: { name: 'Quarantine Gaming: Dedicated Channels' },
                title: newState.channel.name,
                thumbnail: { url: newState.member.user.displayAvatarURL() },
                description: `${newState.member} joined this channel.`,
                footer: {
                  text: `${newState.member.user.tag} (${newState.member.user.id})`,
                },
                timestamp: new Date(),
                color: 'GREEN',
              }),
            );
          }
        }
      } else if (member.roles.cache.has(constants.qg.roles.streaming)) {
        this.client.role_manager.remove(member, constants.qg.roles.streaming);
      }
    } catch (error) {
      this.client.error_manager.mark(
        ETM.create('processVoiceStateUpdate', error),
      );
    }
  }
}
