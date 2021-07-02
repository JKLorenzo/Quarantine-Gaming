import { Client, Guild, Intents, Structures } from 'discord.js';
import ExtendedGuild from './ExtendedGuild.js';
import ExtendedMember from './ExtendedMember.js';
import ExtendedMessage from './ExtendedMessage.js';
import ChannelManager from '../managers/ChannelManager.js';
import ErrorManager from '../managers/ErrorManager.js';
import MessageManager from '../managers/MessageManager.js';
import ReactionManager from '../managers/ReactionManager.js';
import RoleManager from '../managers/RoleManager.js';
import SpeechManager from '../managers/SpeechManager.js';
import constants from '../utils/Constants.js';

Structures.extend('Guild', () => ExtendedGuild);
Structures.extend('GuildMember', () => ExtendedMember);
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
    return this.guilds.cache.get(constants.qg.guild)!;
  }

  get cs(): Guild {
    return this.guilds.cache.get(constants.cs.guild)!;
  }
}
