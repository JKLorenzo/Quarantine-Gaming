import { Client, Collection } from 'discord.js';
import Firebase from 'firebase-admin';
import {
  Game,
  GameData,
  PartialMember,
  PartialMemberData,
  PartialRole,
  PartialRoleData,
} from '../structures/Interfaces.js';
import ProcessQueue from '../utils/ProcessQueue.js';

export default class DatabaseManager {
  public client: Client;
  public queuer: ProcessQueue;
  private members: FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>;
  private games: FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>;
  private free_games: FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>;
  private images: FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>;

  constructor(client: Client) {
    this.client = client;
    this.queuer = new ProcessQueue();

    Firebase.initializeApp({
      credential: Firebase.credential.cert(
        JSON.parse(
          process.env
            .FIREBASE_CREDENTIALS!.replace(/'/g, '"')
            .replace(/\n/g, '\\n'),
        ),
      ),
    });

    const Firestore = Firebase.firestore();
    this.members = Firestore.collection('Members');
    this.games = Firestore.collection('Games');
    this.free_games = Firestore.collection('FreeGames');
    this.images = Firestore.collection('Images');
  }

  async getMemberData(id: `${bigint}`): Promise<PartialMember | undefined> {
    const member_DocSnap = await this.members.doc(id).get();

    if (member_DocSnap.exists) {
      const data = member_DocSnap.data() as PartialMember;

      const roles_QueSnap = await member_DocSnap.ref.collection('roles').get();
      const this_roles = new Collection<string, PartialRole>();
      if (!roles_QueSnap.empty) {
        for (const role_QueDocSnap of roles_QueSnap.docs) {
          const role_data = role_QueDocSnap.data() as PartialRoleData;
          this_roles.set(role_QueDocSnap.id, {
            id: `${BigInt(role_QueDocSnap.id)}`,
            name: role_data.name!,
            lastUpdated: role_data.lastUpdated!,
          });
        }
      }

      return {
        id: `${BigInt(member_DocSnap.id)}`,
        name: data.name,
        tagname: data.tagname,
        inviter: data.inviter,
        moderator: data.moderator,
        roles: this_roles,
      };
    }
  }

  async updateMemberData(
    id: `${bigint}`,
    data: PartialMemberData,
  ): Promise<void> {
    const member_DocSnap = await this.members.doc(id).get();

    const member_data = {} as PartialMemberData;
    if (data.name) member_data.name = data.name;
    if (data.tagname) member_data.name = data.tagname;
    if (data.inviter) member_data.name = data.inviter;
    if (data.moderator) member_data.name = data.moderator;

    if (member_DocSnap.exists) {
      await member_DocSnap.ref.update(member_data);
    } else {
      await member_DocSnap.ref.set(member_data);
    }
  }

  async updateMemberGameRole(
    id: `${bigint}`,
    role_id: `${bigint}`,
    data: PartialRoleData,
  ): Promise<void> {
    const role_DocSnap = await this.members
      .doc(id)
      .collection('roles')
      .doc(role_id)
      .get();

    const role_data = {} as PartialRoleData;
    if (data.name) role_data.name = data.name;
    if (data.lastUpdated) role_data.lastUpdated = data.lastUpdated;

    if (role_DocSnap.exists) {
      await role_DocSnap.ref.update(role_data);
    } else {
      await role_DocSnap.ref.set(role_data);
    }
  }

  async deleteMemberGameRole(
    id: `${bigint}`,
    role_id: `${bigint}`,
  ): Promise<void> {
    const role_DocSnap = await this.members
      .doc(id)
      .collection('roles')
      .doc(role_id)
      .get();

    if (role_DocSnap.exists) {
      await role_DocSnap.ref.delete();
    }
  }

  async getGame(name: string): Promise<Game | undefined> {
    const member_QueSnap = await this.members.where('name', '==', name).get();

    if (!member_QueSnap.empty) {
      const member_QueDocSnap = member_QueSnap.docs[0];
      const data = member_QueDocSnap.data() as Game;
      return {
        name: data.name,
        icon: data.icon,
        banner: data.banner,
        status: data.status,
      };
    }
  }

  async updateGame(name: string, data: GameData): Promise<void> {
    const member_QueSnap = await this.games.where('name', '==', name).get();

    const member_QueDocSnap = member_QueSnap.docs[0];
    if (!member_QueSnap.empty && member_QueDocSnap?.exists) {
      await member_QueDocSnap.ref.update(data);
    } else {
      await this.games.add({ name, ...data });
    }
  }
}
