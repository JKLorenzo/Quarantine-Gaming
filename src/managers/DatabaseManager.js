// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js');
const Firebase = require('firebase-admin');
const { FreeGame, PartialMember, PartialRole } = require('../types/Base.js');

class DatabaseManager {
	/** @param {import('../app.js')} app */
	constructor(app) {
		this.app = app;
		this.ErrorTicketManager = new app.utils.ErrorTicketManager('Database Manager');
		this.queuers = {
			expired_gameroles: new app.utils.ProcessQueue(1000),
		};
		Firebase.initializeApp({
			credential: Firebase.credential.cert(JSON.parse(process.env.FIREBASE_CREDENTIALS.replace(/'/g, '"').replace(/\n/g, '\\n'))),
		});
		const Firestore = Firebase.firestore();
		/** @private */
		this.collections = {
			members: Firestore.collection('Members'),
			free_games: Firestore.collection('FreeGames'),
			game_overrides: Firestore.collection('GameOverrides'),
		};
		/** @private */
		this.data = {
			/** @type {PartialMember[]} */
			members: new Array(),
			game_overrides: {
				/** @type {String[]} */
				whitelisted: new Array(),
				/** @type {String[]} */
				blacklisted: new Array(),
			},
			free_games: {
				/** @type {FreeGame[]} */
				list: new Array(),
				index: 0,
			},
		};
		/** @private */
		this.actions = {
			loadMembers: async () => {
				this.data.members = new Array();
				const members_QueSnap = await this.collections.members.get();
				for (const member_QueDocSnap of members_QueSnap.docs) {
					const id = member_QueDocSnap.id;
					this.data.members[id] = new PartialMember({
						id,
						...member_QueDocSnap.data(),
					});
				}
			},
			loadGameOverrides: async () => {
				this.data.game_overrides.whitelisted = new Array();
				this.data.game_overrides.blacklisted = new Array();
				const game_overrides_QueSnap = await this.collections.game_overrides.get();
				for (const game_override_QueDocSnap of game_overrides_QueSnap.docs) {
					switch(game_override_QueDocSnap.data().category) {
					case 'whitelisted':
						this.data.game_overrides.whitelisted.push(game_override_QueDocSnap.id);
						break;
					case 'blacklisted':
						this.data.game_overrides.blacklisted.push(game_override_QueDocSnap.id);
						break;
					}
				}
			},
			loadFreeGames: async () => {
				this.data.free_games.list = new Array();
				this.data.free_games.index = 0;
				const free_games = await this.collections.free_games.orderBy('index').get();
				for (const free_game of free_games.docs) {
					const data = free_game.data();
					if (data.index > this.data.free_games.index) this.data.free_games.index = data.index;
					this.data.free_games.list.push(new FreeGame({
						...data,
					}));
				}
				await this.trimFreeGames();
			},
		};
		/** @private */
		this.listeners = {
			game_overrides: {
				start: () => {
					this.collections.game_overrides.onSnapshot(snapshot => {
						for (const change of snapshot.docChanges()) {
							switch (change.type) {
							case 'added':
								switch (change.doc.data().category) {
								case 'whitelisted':
									this.data.game_overrides.whitelisted.push(change.doc.id);
									break;
								case 'blacklisted':
									this.data.game_overrides.blacklisted.push(change.doc.id);
									break;
								}
								break;
							case 'modified':
								switch (change.doc.data().category) {
								case 'whitelisted':
									this.data.game_overrides.blacklisted.splice(this.data.game_overrides.blacklisted.indexOf(change.doc.id), 1);
									this.data.game_overrides.whitelisted.push(change.doc.id);
									break;
								case 'blacklisted':
									this.data.game_overrides.whitelisted.splice(this.data.game_overrides.whitelisted.indexOf(change.doc.id), 1);
									this.data.game_overrides.blacklisted.push(change.doc.id);
									break;
								}
								break;
							case 'removed':
								switch (change.doc.data().category) {
								case 'whitelisted':
									this.data.game_overrides.whitelisted.splice(this.data.game_overrides.whitelisted.indexOf(change.doc.id), 1);
									break;
								case 'blacklisted':
									this.data.game_overrides.blacklisted.splice(this.data.game_overrides.blacklisted.indexOf(change.doc.id), 1);
									break;
								}
								break;
							}
						}
						app.actions.loadGameRoles();
					}, error => {
						this.app.error_manager.mark(this.ErrorTicketManager.create('onGameOverride', error, 'listeners'));
					});
				},
				stop: () => {
					this.collections.game_overrides.onSnapshot(() => void 0);
				},
			},
		};

		this.actions.loadMembers();
		this.actions.loadGameOverrides();
		this.actions.loadFreeGames();
		this.listeners.game_overrides.start();
	}

	/**
     * Gets the member from the database.
     * @param {String} id
     * @returns {PartialMember}
     */
	async getMemberData(id) {
		return this.data.members[id];
	}

	/**
	 * Registers the member on the database.
	 * @param {{id: String, name: String, tagname: String}} data
	 */
	async setMemberData(data) {
		await this.collections.members.doc(data.id).set({
			name: data.name,
			tagname: data.tagname,
		});
		this.data.members[data.id] = new PartialMember(data);
		return this.data.members[data.id];
	}

	/**
	 * Updates the data of this member on the database.
	 * @param {String} id
	 * @param {{name?: String, tagname?: String, inviter?: String, moderator?: String}} data
	 */
	async updateMemberData(id, data) {
		if (!this.getMemberData(id)) throw new RangeError(`Failed to update data with ID: ${id}.`);
		await this.collections.members.doc(id).update(data);
		if (data.name) this.data.members[data.id].name = data.name;
		if (data.tagname) this.data.members[data.id].tagname = data.tagname;
		if (data.inviter) this.data.members[data.id].inviter = data.inviter;
		if (data.moderator) this.data.members[data.id].moderator = data.moderator;
		return this.data.members[data.id].moderator;
	}

	/**
	 *
	 * @param {String} id
	 */
	async getMemberExpiredGameRoles(id) {
		/** @type {PartialRole[]} */
		const expired = new Array();
		try {
			const now = new Date();
			const reference = this.collections.members.doc(id).collection('GameRoles');
			const snapshot = await reference.where('lastUpdated', '<=', now.getTime() - 604800000).get();
			for (const role of snapshot.docs) {
				expired.push(new PartialRole({
					id: role.id,
					name: role.data().name,
					lastUpdated: role.data().lastUpdated,
				}));
			}
		}
		catch (error) {
			this.error_manager.mark(this.ErrorTicketManager.create('getMemberExpiredGameRoles', error));
		}
		return expired;
	}

	/**
	 * Updates the game role of this member on the database.
	 * @param {String} id
	 * @param {{id: String, name: String}} data
	 */
	async updateMemberGameRole(id, data) {
		if (!this.getMemberData(id)) throw new RangeError(`Failed to update game role data with ID: ${id}.`);
		const reference = this.collections.members.doc(id).collection('GameRoles').doc(data.id);
		const snapshot = await reference.get();
		const now = new Date();
		if (snapshot.exists) {
			await reference.update({
				lastUpdated: now.getTime(),
			});
		}
		else {
			await reference.set({
				name: data.name,
				lastUpdated: now.getTime(),
			});
		}
	}

	/**
	 * Deletes the game role of this member on the database.
	 * @param {String} id
	 * @param {String} role_id
	 */
	async deleteMemberGameRole(id, role_id) {
		await this.collections.members.doc(id).collection('GameRoles').doc(role_id).delete();
	}

	/**
	 * Adds this game to the whitelisted games.
	 * @param {String} game_name
	 */
	async gameWhitelist(game_name) {
		try {
			const reference = this.collections.game_overrides.doc(game_name);
			const snapshot = await reference.get();
			if (snapshot.exists) {
				await reference.update({
					category: 'whitelist',
				});
			}
			await reference.set({
				category: 'whitelist',
			});
		}
		catch (error) {
			this.app.error_manager.mark(new this.ErrorTicketManager.create('gameWhitelist', error));
		}
	}

	/**
	 * Adds this game to the blacklisted games.
	 * @param {String} game_name
	 */
	async gameBlacklist(game_name) {
		try {
			const reference = this.collections.game_overrides.doc(game_name);
			const snapshot = await reference.get();
			if (snapshot.exists) {
				await reference.update({
					category: 'blacklist',
				});
			}
			await reference.set({
				category: 'blacklist',
			});
		}
		catch (error) {
			this.app.error_manager.mark(new this.ErrorTicketManager.create('gameBlacklist', error));
		}
	}

	/**
	 * Checks if a game is whitelisted.
	 * @param {String} game_name
	 */
	gameWhitelisted(game_name) {
		return this.data.game_overrides.whitelisted.includes(game_name);
	}

	/**
	 * Checks if a game is blacklisted.
	 * @param {String} game_name
	 */
	gameBlacklisted(game_name) {
		return this.data.game_overrides.blacklisted.includes(game_name);
	}

	/**
	 * Gets the free game from the database.
	 * @param {FreeGame} free_game
	 */
	getFreeGame(free_game) {
		const similarity_threshold = 70;
		for (const this_freegame of this.data.free_games.list) {
			const this_similarity = this.app.utils.getPercentSimilarity(this_freegame.title, free_game.title);
			if (this_similarity >= similarity_threshold || free_game.url.trim().toLowerCase() == this_freegame.url.trim().toLowerCase()) {
				return this_freegame;
			}
		}
		return null;
	}

	/**
	 * Pushes this free game to the database.
	 * @param {FreeGame} free_game
	 */
	async pushFreeGame(free_game) {
		this.data.free_games.list.push(free_game);
		await this.collections.free_games.doc(free_game.id).set({
			...free_game,
			index: ++this.data.free_games.index,
		});
		await this.trimFreeGames();
	}

	async trimFreeGames() {
		while (this.data.free_games.list.length > 5) {
			try {
				const expired_freegame = this.data.free_games.list.shift();
				await this.collections.free_games.doc(expired_freegame.id).delete();
			}
			catch (error) {
				this.app.error_manager.mark(this.ErrorTicketManager.create('notificationTrim', error));
			}
		}
	}
}

module.exports = DatabaseManager;