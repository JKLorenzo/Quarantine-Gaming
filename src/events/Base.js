const { ErrorTicketManager, ProcessQueue } = require('../utils/Base.js');
const onceReady = require('./Ready.js');
const onMessage = require('./Message.js');
const onUserUpdate = require('./UserUpdate.js');
const onGuildMemberAdd = require('./GuildMemberAdd.js');
const onGuildMemberUpdate = require('./GuildMemberUpdate.js');
const onGuildMemberRemove = require('./GuildMemberRemove.js');
const onGuildBanAdd = require('./GuildBanAdd.js');
const onGuildBanRemove = require('./GuildBanRemove.js');
const onRoleCreate = require('./RoleCreate.js');
const onRoleUpdate = require('./RoleUpdate.js');
const onRoleDelete = require('./RoleDelete.js');
const onInviteCreate = require('./InviteCreate.js');
const onPresenceUpdate = require('./PresenceUpdate.js');
const onVoiceStateUpdate = require('./VoiceStateUpdate.js');
const onMessageReactionAdd = require('./MessageReactionAdd.js');
const onMessageReactionRemove = require('./MessageReactionRemove.js');

const ETM = new ErrorTicketManager('BaseEvents');

/**
 * @typedef {import('../structures/Base.js').Client} Client
 */

module.exports = class BaseEvents {
	/** @param {Client} client */
	constructor(client) {
		this.client = client;

		this.onceReady = {
			emitted: false,
			event: this.client.once('ready', async () => {
				try {
					if (this.onceReady.emitted) throw new Error('Event already emitted.');
					this.onceReady.emitted = true;
					await onceReady(this.client);
				}
				catch(error) {
					this.client.error_manager.mark(ETM.create('ready', error));
				}
			}),
		};

		this.onMessage = {
			queuer: new ProcessQueue(1000),
			event: this.client.on('message', (message) => {
				this.onMessage.queuer.queue(async () => {
					try {
						await onMessage(this.client, message);
					}
					catch(error) {
						this.client.error_manager.mark(ETM.create('message', error));
					}
				});
			}),
		};

		this.onUserUpdate = {
			queuer: new ProcessQueue(1000),
			event:  this.client.on('userUpdate', (oldUser, newUser) => {
				this.onUserUpdate.queuer.queue(async () => {
					try {
						await onUserUpdate(this.client, oldUser, newUser);
					}
					catch(error) {
						this.client.error_manager.mark(ETM.create('userUpdate', error));
					}
				});
			}),
		};

		this.onGuildMemberAdd = {
			queuer: new ProcessQueue(1000),
			event: this.client.on('guildMemberAdd', (member) => {
				this.onGuildMemberAdd.queuer.queue(async () => {
					try {
						await onGuildMemberAdd(this.client, member);
					}
					catch(error) {
						this.client.error_manager.mark(ETM.create('guildMemberAdd', error));
					}
				});
			}),
		};

		this.onGuildMemberUpdate = {
			queuer: new ProcessQueue(1000),
			event: this.client.on('guildMemberUpdate', (oldMember, newMember) => {
				this.onGuildMemberUpdate.queuer.queue(async () => {
					try {
						await onGuildMemberUpdate(this.client, oldMember, newMember);
					}
					catch(error) {
						this.client.error_manager.mark(ETM.create('guildMemberUpdate', error));
					}
				});
			}),
		};

		this.onGuildMemberRemove = {
			queuer: new ProcessQueue(1000),
			event: this.client.on('guildMemberRemove', (member) => {
				this.onGuildMemberRemove.queuer.queue(async () => {
					try {
						await onGuildMemberRemove(this.client, member);
					}
					catch(error) {
						this.client.error_manager.mark(ETM.create('guildMemberRemove', error));
					}
				});
			}),
		};

		this.onGuildBanAdd = {
			queuer: new ProcessQueue(1000),
			event: this.client.on('guildBanAdd', (guild, user) => {
				if (guild.id != this.client.guild.id) return;
				this.onGuildBanAdd.queuer.queue(async () => {
					try {
						await onGuildBanAdd(this.client, user);
					}
					catch(error) {
						this.client.error_manager.mark(ETM.create('guildBanAdd', error));
					}
				});
			}),
		};

		this.onGuildBanRemove = {
			queuer: new ProcessQueue(1000),
			event: this.client.on('guildBanRemove', (guild, user) => {
				if (guild.id != this.client.guild.id) return;
				this.onGuildBanRemove.queue.queue(async () => {
					try {
						await onGuildBanRemove(this.client, user);
					}
					catch(error) {
						this.client.error_manager.mark(ETM.create('guildBanRemove', error));
					}
				});
			}),
		};

		this.onRoleCreate = {
			queuer: new ProcessQueue(1000),
			event: this.client.on('roleCreate', (role) => {
				if (role.guild.id != this.client.guild.id) return;
				this.onRoleCreate.queuer.queue(async () => {
					try {
						await onRoleCreate(this.client, role);
					}
					catch(error) {
						this.client.error_manager.mark(ETM.create('roleCreate', error));
					}
				});
			}),
		};

		this.onRoleUpdate = {
			queuer: new ProcessQueue(1000),
			event: this.client.on('roleUpdate', (oldRole, newRole) => {
				if (newRole.guild.id != this.client.guild.id) return;
				this.onRoleUpdate.queuer.queue(async () => {
					try {
						await onRoleUpdate(this.client, oldRole, newRole);
					}
					catch(error) {
						this.client.error_manager.mark(ETM.create('roleUpdate', error));
					}
				});
			}),
		};

		this.onRoleDelete = {
			queuer: new ProcessQueue(1000),
			event: this.client.on('roleDelete', (role) => {
				if (role.guild.id != this.client.guild.id) return;
				this.onRoleDelete.queuer.queue(async () => {
					try {
						await onRoleDelete(this.client, role);
					}
					catch(error) {
						this.client.error_manager.mark(ETM.create('roleDelete', error));
					}
				});
			}),
		};

		this.onInviteCreate = {
			queuer: new ProcessQueue(1000),
			event: this.client.on('inviteCreate', (invite) => {
				if (invite.guild.id != this.client.guild.id) return;
				this.onInviteCreate.queuer.queue(async () => {
					try {
						await onInviteCreate(this.client, invite);
					}
					catch(error) {
						this.client.error_manager.mark(ETM.create('inviteCreate', error));
					}
				});
			}),
		};

		this.onPresenceUpdate = {
			queuer: new ProcessQueue(1000),
			event: this.client.on('presenceUpdate', (oldPresence, newPresence) => {
				if (newPresence.member.guild.id != this.client.guild.id || newPresence.member.user.bot) return;
				this.onPresenceUpdate.queuer.queue(async () => {
					try {
						await onPresenceUpdate(this.client, oldPresence, newPresence);
					}
					catch(error) {
						this.client.error_manager.mark(ETM.create('presenceUpdate', error));
					}
				});
			}),
		};

		this.onVoiceStateUpdate = {
			queuer: new ProcessQueue(1000),
			event: this.client.on('voiceStateUpdate', (oldState, newState) => {
				if (newState.guild.id != this.client.guild.id) return;
				this.onVoiceStateUpdate.queuer.queue(async () => {
					try {
						await onVoiceStateUpdate(this.client, oldState, newState);
					}
					catch(error) {
						this.client.error_manager.mark(ETM.create('voiceStateUpdate', error));
					}
				});
			}),
		};

		this.onMessageReactionAdd = {
			queuer: new ProcessQueue(1000),
			event: this.client.on('messageReactionAdd', (reaction, user) => {
				this.onMessageReactionAdd.queuer.queue(async () => {
					try {
						if (reaction.partial) reaction = await reaction.fetch();
						const message = await reaction.message.fetch();
						if (message.author.id != client.user.id || user.id == client.user.id) return;
						await onMessageReactionAdd(this.client, message, reaction, user);
					}
					catch(error) {
						this.client.error_manager.mark(ETM.create('messageReactionAdd', error));
					}
				});
			}),
		};

		this.onMessageReactionRemove = {
			queuer: new ProcessQueue(1000),
			event: this.client.on('messageReactionRemove', (reaction, user) => {

				this.onMessageReactionRemove.queuer.queue(async () => {
					try {
						if (reaction.partial) reaction = await reaction.fetch();
						const message = await reaction.message.fetch();
						if (message.author.id != client.user.id || user.id == client.user.id) return;
						await onMessageReactionRemove(this.client, message, reaction, user);
					}
					catch(error) {
						this.client.error_manager.mark(ETM.create('messageReactionRemove', error));
					}
				});
			}),
		};
	}
};