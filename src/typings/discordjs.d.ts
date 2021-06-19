import Channel_Manager from '../managers/ChannelManager.js';
import Error_Manager from '../managers/ErrorManager.js';
import Message_Manager from '../managers/MessageManager.js';
import Reaction_Manager from '../managers/ReactionManager.js';
import Role_Manager from '../managers/RoleManager.js';
import Speech_Manager from '../managers/SpeechManager.js';

declare module 'discord.js' {
  interface Message {
    delete(options?: { timeout: number }): Promise<Message>;
  }

  interface Client {
    readonly channel_manager: Channel_Manager;
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
}
