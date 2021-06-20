import Channel_Manager from '../managers/ChannelManager.js';
import Database_Manager from '../managers/DatabaseManager.js';
import Error_Manager from '../managers/ErrorManager.js';
import Message_Manager from '../managers/MessageManager.js';
import Reaction_Manager from '../managers/ReactionManager.js';
import Role_Manager from '../managers/RoleManager.js';
import Speech_Manager from '../managers/SpeechManager.js';
import { PartialRole } from '../structures/Interfaces.js';

declare module 'discord.js' {
  interface Client {
    readonly channel_manager: Channel_Manager;
    readonly database_manager: Database_Manager;
    readonly error_manager: Error_Manager;
    readonly message_manager: Message_Manager;
    readonly reaction_manager: Reaction_Manager;
    readonly role_manager: Role_Manager;
    readonly speech_manager: Speech_Manager;

    qg: Guild;
    cs: Guild;

    channel(channel: GuildChannelResolvable): Channel | GuildChannel | null;
    member(user: UserResolvable): GuildMember | null;
    role(role: RoleResolvable): Role | null;
    message(
      channel: GuildChannelResolvable,
      message: MessageResolvable,
    ): Message | null;
  }

  interface Message {
    delete(options?: { timeout: number }): Promise<Message>;
  }

  interface GuildMember {
    register(inviter: GuildMember, moderator: GuildMember): Promise<void>;

    fetchInviter(): Promise<GuildMember | null>;
    fetchModerator(): Promise<GuildMember | null>;

    fetchExpiredGameRoles(): Promise<PartialRole[]>;
    updateGameRole(role: Role): Promise<void>;
    deleteGameRole(id: `${bigint}`): Promise<void>;
  }
}
