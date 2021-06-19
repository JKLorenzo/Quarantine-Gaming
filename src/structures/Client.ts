import {
  Channel,
  Client,
  Guild,
  GuildChannel,
  GuildChannelResolvable,
  GuildMember,
  Intents,
  Message,
  MessageResolvable,
  Role,
  RoleResolvable,
  Structures,
  UserResolvable,
} from 'discord.js';
import ExtendedMessage from './ExtendedMessage.js';
import ChannelManager from '../managers/ChannelManager.js';
import ErrorManager from '../managers/ErrorManager.js';
import MessageManager from '../managers/MessageManager.js';
import ReactionManager from '../managers/ReactionManager.js';
import RoleManager from '../managers/RoleManager.js';
import SpeechManager from '../managers/SpeechManager.js';
import constants from '../utils/Constants.js';
import { parseMention } from '../utils/Functions.js';

Structures.extend('Message', () => ExtendedMessage);

export default class extends Client {
  readonly channel_manager: ChannelManager;
  readonly error_manager: ErrorManager;
  readonly message_manager: MessageManager;
  readonly reaction_manager: ReactionManager;
  readonly role_manager: RoleManager;
  readonly speech_manager: SpeechManager;

  constructor() {
    super({
      allowedMentions: {
        parse: ['everyone', 'roles', 'users'],
        repliedUser: true,
      },
      intents: [
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_BANS,
        Intents.FLAGS.GUILD_EMOJIS,
        Intents.FLAGS.GUILD_INVITES,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_PRESENCES,
        Intents.FLAGS.GUILD_VOICE_STATES,
      ],
      partials: ['MESSAGE', 'CHANNEL'],
      presence: {
        activities: [
          {
            name: '/commands',
            type: 'LISTENING',
          },
        ],
        status: 'online',
        afk: false,
      },
    });

    this.channel_manager = new ChannelManager(this);
    this.error_manager = new ErrorManager(this);
    this.message_manager = new MessageManager(this);
    this.reaction_manager = new ReactionManager(this);
    this.role_manager = new RoleManager(this);
    this.speech_manager = new SpeechManager(this);
  }

  get qg(): Guild {
    return this.guilds.cache.get(`${constants.qg.guild}`)!;
  }

  get cs(): Guild {
    return this.guilds.cache.get(`${constants.cs.guild}`)!;
  }

  channel(channel: GuildChannelResolvable): Channel | GuildChannel | null {
    const parsed_channel = parseMention(channel);
    return (
      this.qg.channels.resolve(parsed_channel) ??
      this.cs.channels.resolve(parsed_channel)
    );
  }

  member(user: UserResolvable): GuildMember | null {
    const parsed_user = parseMention(user);
    return (
      this.qg.members.resolve(parsed_user) ??
      this.cs.members.resolve(parsed_user)
    );
  }

  role(role: RoleResolvable): Role | null {
    const parsed_role = parseMention(role);
    return (
      this.qg.roles.resolve(parsed_role) ?? this.cs.roles.resolve(parsed_role)
    );
  }

  message(
    channel: GuildChannelResolvable,
    message: MessageResolvable,
  ): Message | null {
    const this_channel = this.channel(channel);
    return this_channel?.isText()
      ? this_channel.messages.resolve(message)
      : null;
  }
}
