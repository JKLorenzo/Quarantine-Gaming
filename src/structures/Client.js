import { Client, MessageEmbed } from 'discord.js';
import {
  ChannelManager,
  DatabaseManager,
  DedicatedChannelManager,
  ErrorManager,
  FreeGameManager,
  GameManager,
  InteractionManager,
  GatewayManager,
  MessageManager,
  ReactionManager,
  RoleManager,
  SpeechManager,
} from '../managers/Base.js';
import Methods from '../methods/Base.js';
import { ErrorTicketManager, constants, parseMention } from '../utils/Base.js';

/**
 * @typedef {import('discord.js').Role} Role
 * @typedef {import('discord.js').Message} Message
 * @typedef {import('discord.js').TextChannel} TextChannel
 * @typedef {import('discord.js').GuildMember} GuildMember
 * @typedef {import('discord.js').GuildChannel} GuildChannel
 * @typedef {import('discord.js').ClientOptions} ClientOptions
 * @typedef {import('discord.js').RoleResolvable} RoleResolvable
 * @typedef {import('discord.js').UserResolvable} UserResolvable
 * @typedef {import('discord.js').MessageResolvable} MessageResolvable
 * @typedef {import('discord.js').GuildChannelResolvable} GuildChannelResolvable
 */

const ETM = new ErrorTicketManager('QG Client');

export default class QGClient extends Client {
  /**
   * @param {ClientOptions} clientOptions The options of this client
   */
  constructor(clientOptions) {
    super(clientOptions);

    this.channel_manager = new ChannelManager(this);
    this.database_manager = new DatabaseManager(this);
    this.dedicated_channel_manager = new DedicatedChannelManager(this);
    this.error_manager = new ErrorManager(this);
    this.free_game_manager = new FreeGameManager(this);
    this.game_manager = new GameManager(this);
    this.interaction_manager = new InteractionManager(this);
    this.gateway_manager = new GatewayManager(this);
    this.message_manager = new MessageManager(this);
    this.reaction_manager = new ReactionManager(this);
    this.role_manager = new RoleManager(this);
    this.speech_manager = new SpeechManager(this);

    this.methods = new Methods(this);

    this.once('ready', async () => {
      console.log('Client logged in. Initializing...');
      this.message_manager.sendToChannel(
        constants.cs.channels.logs,
        '[ **ONLINE**  -------------------------->',
      );

      await this.database_manager.init();
      await this.interaction_manager.init();
      await this.gateway_manager.init();
      await this.game_manager.init();
      this.dedicated_channel_manager.init();
      this.free_game_manager.init();

      // Check for streaming members
      const streaming_role = this.role(constants.qg.roles.streaming);
      for (const member of streaming_role.members.array()) {
        if (member.voice.channelID) continue;
        await this.role_manager.remove(member, streaming_role);
      }

      await this.message_manager.sendToChannel(
        constants.cs.channels.logs,
        '[ **INITIALIZED**  -------------------->',
      );

      console.log('Client initialized.');
    });

    this.on('userUpdate', (oldUser, newUser) => {
      try {
        const member = this.member(newUser);

        const changes = [];
        if (oldUser.username !== newUser.username) {
          changes.push(
            `**Username:** \nOld: ${oldUser.username} \nNew: ${newUser.username}\n`,
          );
        }
        if (oldUser.discriminator !== newUser.discriminator) {
          changes.push(
            `**Discriminator:** \nOld: ${oldUser.discriminator} \nNew: ${newUser.discriminator}\n`,
          );
        }
        if (oldUser.displayAvatarURL() !== newUser.displayAvatarURL()) {
          changes.push(
            `**Avatar:** [New Avatar](${newUser.displayAvatarURL()})`,
          );
        }
        if (changes.length) {
          this.message_manager.sendToChannel(
            constants.cs.channels.member_events,
            new MessageEmbed({
              author: { name: 'Quarantine Gaming: User Update' },
              title: member.displayName,
              thumbnail: { url: newUser.displayAvatarURL() },
              description: changes.join('\n'),
              footer: { text: `Reference ID: ${newUser.id}` },
              color: 'BLURPLE',
            }),
          );
        }
      } catch (error) {
        this.error_manager.mark(ETM.create('userUpdate', error));
      }
    });

    this.on('guildMemberUpdate', (oldMember, newMember) => {
      try {
        if (newMember.guild.id !== constants.qg.guild) return;

        /** @type {Role[]} */
        const role_added = [];
        /** @type {Role[]} */
        const role_removed = [];
        if (newMember.roles.cache.size !== oldMember.roles.cache.size) {
          for (const this_role of newMember.roles.cache
            .difference(oldMember.roles.cache)
            .array()) {
            const isNew = newMember.roles.cache.has(this_role.id);
            if (this_role.name.startsWith('Team 🔰')) continue;
            if (this_role.id === constants.qg.roles.streaming) continue;
            if (this_role.hexColor === constants.colors.play_role) continue;
            if (this_role.hexColor === constants.colors.game_role) continue;
            if (isNew) {
              role_added.push(this_role);
            } else {
              role_removed.push(this_role);
            }
          }
        }

        const changes = [];
        if (newMember.displayName !== oldMember.displayName) {
          changes.push(
            `**Nickname:** \nOld: ${oldMember.displayName} \nNew: ${newMember.displayName}\n`,
          );
        }
        if (role_added.length) {
          changes.push(
            `**Role Added:** ${role_added.map(role => role.name).join(', ')}\n`,
          );
        }
        if (role_removed.length) {
          changes.push(
            `**Role Removed:** ${role_removed
              .map(role => role.name)
              .join(', ')}\n`,
          );
        }

        if (changes.length) {
          this.message_manager.sendToChannel(
            constants.cs.channels.member_events,
            new MessageEmbed({
              author: { name: 'Quarantine Gaming: Member Update' },
              title: newMember.displayName,
              thumbnail: { url: newMember.user.displayAvatarURL() },
              description: changes.join('\n'),
              footer: { text: `Reference ID: ${newMember.id}` },
              color: 'BLURPLE',
            }),
          );
        }
      } catch (error) {
        this.error_manager.mark(ETM.create('guildMemberUpdate', error));
      }
    });
  }

  /**
   * Gets the  Quarantine Gaming guild.
   */
  get qg() {
    return this.guilds.cache.get(constants.qg.guild);
  }

  /**
   * Gets the Control Server guild.
   */
  get cs() {
    return this.guilds.cache.get(constants.cs.guild);
  }

  /**
   * Resolves a Guild Channel Resolvable to a Guild Channel object.
   * @param {GuildChannelResolvable} channel The channel to resolve
   * @returns {GuildChannel}
   */
  channel(channel) {
    return (
      this.qg.channels.resolve(channel) ??
      this.qg.channels.resolve(parseMention(channel)) ??
      this.cs.channels.resolve(channel) ??
      this.cs.channels.resolve(parseMention(channel))
    );
  }

  /**
   * Resolves a User Resolvable to an Extended Member object.
   * @param {UserResolvable} user The user to resolve
   * @returns {GuildMember}
   */
  member(user) {
    return (
      this.qg.members.resolve(user) ??
      this.qg.members.resolve(parseMention(user)) ??
      this.cs.members.resolve(user) ??
      this.cs.members.resolve(parseMention(user))
    );
  }

  /**
   * Resolves a Role Resolvable to a Role object.
   * @param {RoleResolvable} role The role to resolve
   * @returns {Role}
   */
  role(role) {
    return (
      this.qg.roles.resolve(role) ??
      this.qg.roles.resolve(parseMention(role)) ??
      this.cs.roles.resolve(role) ??
      this.cs.roles.resolve(parseMention(role))
    );
  }

  /**
   * Resolves a Message Resolvable to a Message object.
   * @param {GuildChannelResolvable} channel The channel where the message is sent
   * @param {MessageResolvable} message The message to resolve
   * @returns {Message}
   */
  message(channel, message) {
    /** @type {TextChannel} */
    const this_channel = this.channel(channel);
    if (this_channel) return this_channel.messages.resolve(message);
    return null;
  }
}
