import { Collection } from 'discord.js';
import Firebase from 'firebase-admin';
import { FreeGame, PartialMember, PartialRole } from '../types/Base.js';
import {
  ErrorTicketManager,
  ProcessQueue,
  getPercentSimilarity,
  constants,
} from '../utils/Base.js';

/**
 * @typedef {import('../structures/Base').Client} Client
 */

/**
 * @typedef {Object} ImageData
 * @property {string} [small]
 * @property {string} [large]
 */

const ETM = new ErrorTicketManager('Database Manager');

export default class DatabaseManager {
  /**
   * @param {Client} client The QG Client
   */
  constructor(client) {
    this.client = client;
    this.queuers = {
      expired_gameroles: new ProcessQueue(1000),
    };
    Firebase.initializeApp({
      credential: Firebase.credential.cert(
        JSON.parse(
          process.env.FIREBASE_CREDENTIALS.replace(/'/g, '"').replace(
            /\n/g,
            '\\n',
          ),
        ),
      ),
    });
    const Firestore = Firebase.firestore();
    /** @private */
    this.collections = {
      members: Firestore.collection('Members'),
      free_games: Firestore.collection('FreeGames'),
      game_overrides: Firestore.collection('GameOverrides'),
      images: Firestore.collection('Images'),
    };
    /** @private */
    this.data = {
      /** @type {PartialMember[]} */
      members: [],
      game_overrides: {
        /** @type {String[]} */
        whitelisted: [],
        /** @type {String[]} */
        blacklisted: [],
      },
      free_games: {
        /** @type {FreeGame[]} */
        list: [],
        index: 0,
      },
      /** @type {Collection<String, ImageData>} */
      images: new Collection(),
    };
    /** @private */
    this.actions = {
      loadMembers: async () => {
        try {
          this.data.members = [];
          const members_QueSnap = await this.collections.members.get();
          for (const member_QueDocSnap of members_QueSnap.docs) {
            const id = member_QueDocSnap.id;
            this.data.members[id] = new PartialMember({
              id,
              ...member_QueDocSnap.data(),
            });
          }
        } catch (error) {
          this.client.error_manager.mark(
            ETM.create('loadMembers', error, 'actions'),
          );
        }
      },
      loadGameOverrides: async () => {
        try {
          this.data.game_overrides.whitelisted = [];
          this.data.game_overrides.blacklisted = [];
          const game_overrides_QueSnap =
            await this.collections.game_overrides.get();
          for (const game_override_QueDocSnap of game_overrides_QueSnap.docs) {
            switch (game_override_QueDocSnap.data().category) {
              case 'whitelist':
                this.data.game_overrides.whitelisted.push(
                  game_override_QueDocSnap.id,
                );
                break;
              case 'blacklist':
                this.data.game_overrides.blacklisted.push(
                  game_override_QueDocSnap.id,
                );
                break;
            }
          }
        } catch (error) {
          this.client.error_manager.mark(
            ETM.create('loadGameOverrides', error, 'actions'),
          );
        }
      },
      loadFreeGames: async () => {
        try {
          this.data.free_games.list = [];
          this.data.free_games.index = 0;
          const free_games = await this.collections.free_games
            .orderBy('index')
            .get();
          for (const free_game of free_games.docs) {
            const data = free_game.data();
            if (data.index > this.data.free_games.index) {
              this.data.free_games.index = data.index;
            }
            this.data.free_games.list.push(
              new FreeGame({
                ...data,
              }),
            );
          }
          await this.trimFreeGames();
        } catch (error) {
          this.client.error_manager.mark(
            ETM.create('loadFreeGames', error, 'actions'),
          );
        }
      },
      loadImages: async () => {
        try {
          this.data.images = new Collection();
          const images_QueSnap = await this.collections.images.get();
          for (const image_QueDocSnap of images_QueSnap.docs) {
            this.data.images.set(image_QueDocSnap.id, {
              small: image_QueDocSnap.data().small,
              large: image_QueDocSnap.data().large,
            });
          }
        } catch (error) {
          this.client.error_manager.mark(
            ETM.create('loadImages', error, 'actions'),
          );
        }
      },
    };
  }

  async init() {
    try {
      await this.actions.loadMembers();
      await this.actions.loadGameOverrides();
      await this.actions.loadFreeGames();
      await this.actions.loadImages();

      // Add and update members on the database
      for (const member of this.client.qg.members.cache.array()) {
        if (member.user.bot) continue;
        const existing_data = this.getMemberData(member.id);
        if (existing_data) {
          // Update member
          const data = {};
          if (existing_data.name !== member.displayName) {
            data.name = member.displayName;
          }
          if (existing_data.tagname !== member.user.tag) {
            data.tagname = member.user.tag;
          }
          if (Object.keys(data).length) {
            await this.updateMemberData(member.id, data);
          }
        } else {
          // Add member to database
          await this.setMemberData({
            id: member.id,
            name: member.displayName,
            tagname: member.user.tag,
          });
        }
      }
      this.client.message_manager.sendToChannel(
        constants.cs.channels.logs,
        '✅ - Database Manager',
      );
    } catch (error) {
      this.client.message_manager.sendToChannel(
        constants.cs.channels.logs,
        '❌ - Database Manager',
      );
      throw error;
    }
  }

  /**
   * Gets the images from the database.
   * @param {string} id The id of this image
   * @returns {ImageData}
   */
  getImage(id) {
    try {
      return this.data.images.get(id);
    } catch (error) {
      this.client.error_manager.mark(ETM.create('getImage', error));
      throw error;
    }
  }

  /**
   * Stores the images to the database.
   * @param {string} id The id of this image
   * @param {ImageData} data The data of this image
   */
  async updateImage(id, data) {
    try {
      const images = this.getImage(id);
      if (images) {
        await this.collections.images.doc(id).update(data);
      } else {
        await this.collections.images.doc(id).set(data);
      }
      this.data.images.set(id, {
        small: data?.small ?? images?.small,
        large: data?.large ?? images?.large,
      });
    } catch (error) {
      this.client.error_manager.mark(ETM.create('setImage', error));
      throw error;
    }
  }

  /**
   * Gets the member from the database.
   * @param {string} id The ID of the member
   * @returns {PartialMember}
   */
  getMemberData(id) {
    try {
      return this.data.members[id];
    } catch (error) {
      this.client.error_manager.mark(ETM.create('getMemberData', error));
      throw error;
    }
  }

  /**
   * Registers the member on the database.
   * @param {{id: string, name: string, tagname: string}} data The data of this member
   * @returns {Promise<PartialMember>}
   */
  async setMemberData(data) {
    try {
      await this.collections.members.doc(data.id).set({
        name: data.name,
        tagname: data.tagname,
      });
      this.data.members[data.id] = new PartialMember(data);
      return this.data.members[data.id];
    } catch (error) {
      this.client.error_manager.mark(ETM.create('setMemberData', error));
      throw error;
    }
  }

  /**
   * Updates the data of this member on the database.
   * @param {string} id The ID of the member
   * @param {{name: string, tagname: string, inviter: string, moderator: string}} data The data of this member
   */
  async updateMemberData(id, data) {
    try {
      await this.collections.members.doc(id).update(data);
      if (data.name) this.data.members[id].name = data.name;
      if (data.tagname) this.data.members[id].tagname = data.tagname;
      if (data.inviter) this.data.members[id].inviter = data.inviter;
      if (data.moderator) this.data.members[id].moderator = data.moderator;
    } catch (error) {
      this.client.error_manager.mark(ETM.create('updateMemberData', error));
      throw error;
    }
  }

  /**
   * Updates the game role of this member on the database.
   * @param {string} id The ID of the member
   * @param {{id: string, name: string}} data The data of this member
   */
  async updateMemberGameRole(id, data) {
    try {
      const reference = this.collections.members
        .doc(id)
        .collection('GameRoles')
        .doc(data.id);
      const snapshot = await reference.get();
      const now = new Date();
      if (snapshot.exists) {
        await reference.update({
          lastUpdated: now.getTime(),
        });
      } else {
        await reference.set({
          name: data.name,
          lastUpdated: now.getTime(),
        });
      }
    } catch (error) {
      this.client.error_manager.mark(ETM.create('updateMemberGameRole', error));
      throw error;
    }
  }

  /**
   * Gets the expired game role of this member from the database.
   * @param {string} id The ID of the member
   */
  async getMemberExpiredGameRoles(id) {
    /** @type {PartialRole[]} */
    const expired = [];
    try {
      const now = new Date();
      const reference = this.collections.members
        .doc(id)
        .collection('GameRoles');
      const snapshot = await reference
        .where('lastUpdated', '<=', now.getTime() - 604800000)
        .get();
      for (const role of snapshot.docs) {
        expired.push(
          new PartialRole({
            id: role.id,
            name: role.data().name,
            lastUpdated: role.data().lastUpdated,
          }),
        );
      }
    } catch (error) {
      this.error_manager.mark(ETM.create('getMemberExpiredGameRoles', error));
      throw error;
    }
    return expired;
  }

  /**
   * Deletes the game role of this member on the database.
   * @param {string} id The ID of the member
   * @param {string} role_id The ID of the role
   */
  async deleteMemberGameRole(id, role_id) {
    try {
      const doc_ref = this.collections.members
        .doc(id)
        .collection('GameRoles')
        .doc(role_id);
      await doc_ref.delete();
    } catch (error) {
      this.client.error_manager.mark(ETM.create('deleteMemberGameRole', error));
      throw error;
    }
  }

  /**
   * Adds this game to the whitelisted games.
   * @param {string} game_name The name of the game
   */
  async gameWhitelist(game_name) {
    try {
      game_name = game_name.toLowerCase();
      const reference = this.collections.game_overrides.doc(game_name);
      const snapshot = await reference.get();
      if (snapshot.exists) {
        await reference.update({
          category: 'whitelist',
        });
      } else {
        await reference.set({
          category: 'whitelist',
        });
      }
      if (this.gameBlacklisted(game_name)) {
        this.data.game_overrides.blacklisted.splice(
          this.data.game_overrides.blacklisted.indexOf(game_name),
          1,
        );
      }
      this.data.game_overrides.whitelisted.push(game_name);
      await this.client.game_manager.reload();
      return true;
    } catch (error) {
      this.client.error_manager.mark(new ETM.create('gameWhitelist', error));
      return false;
    }
  }

  /**
   * Adds this game to the blacklisted games.
   * @param {string} game_name The name of the game
   */
  async gameBlacklist(game_name) {
    try {
      game_name = game_name.toLowerCase();
      const reference = this.collections.game_overrides.doc(game_name);
      const snapshot = await reference.get();
      if (snapshot.exists) {
        await reference.update({
          category: 'blacklist',
        });
      } else {
        await reference.set({
          category: 'blacklist',
        });
      }
      if (this.gameWhitelisted(game_name)) {
        this.data.game_overrides.whitelisted.splice(
          this.data.game_overrides.whitelisted.indexOf(game_name),
          1,
        );
      }
      this.data.game_overrides.blacklisted.push(game_name);
      await this.client.game_manager.reload();
      return true;
    } catch (error) {
      this.client.error_manager.mark(new ETM.create('gameBlacklist', error));
      return false;
    }
  }

  /**
   * Checks if a game is whitelisted.
   * @param {string} game_name The name of the game
   * @returns {boolean}
   */
  gameWhitelisted(game_name) {
    try {
      return this.data.game_overrides.whitelisted.includes(
        game_name.toLowerCase(),
      );
    } catch (error) {
      this.client.error_manager.mark(ETM.create('gameWhitelisted', error));
      throw error;
    }
  }

  /**
   * Checks if a game is blacklisted.
   * @param {string} game_name The name of the game
   * @returns {boolean}
   */
  gameBlacklisted(game_name) {
    try {
      return this.data.game_overrides.blacklisted.includes(
        game_name.toLowerCase(),
      );
    } catch (error) {
      this.client.error_manager.mark(ETM.create('gameBlacklisted', error));
      throw error;
    }
  }

  /**
   * Gets the free game from the database.
   * @param {FreeGame} free_game The name of the free game
   * @returns {FreeGame}
   */
  getFreeGame(free_game) {
    const similarity_threshold = 70;
    for (const this_freegame of this.data.free_games.list) {
      const this_similarity = getPercentSimilarity(
        this_freegame.title,
        free_game.title,
      );
      if (
        this_similarity >= similarity_threshold ||
        free_game.url.trim().toLowerCase() ===
          this_freegame.url.trim().toLowerCase()
      ) {
        return this_freegame;
      }
    }
    return null;
  }

  /**
   * Pushes this free game to the database.
   * @param {FreeGame} free_game The name of the free game
   */
  async pushFreeGame(free_game) {
    try {
      this.data.free_games.list.push(free_game);
      await this.collections.free_games.doc(free_game.id).set({
        ...free_game,
        index: ++this.data.free_games.index,
      });
      await this.trimFreeGames();
    } catch (error) {
      this.client.error_manager.mark(ETM.create('pushFreeGame', error));
      throw error;
    }
  }

  async trimFreeGames() {
    while (this.data.free_games.list.length > 5) {
      try {
        const expired_freegame = this.data.free_games.list.shift();
        await this.collections.free_games.doc(expired_freegame.id).delete();
      } catch (error) {
        this.client.error_manager.mark(ETM.create('trimFreeGames', error));
        throw error;
      }
    }
  }
}
