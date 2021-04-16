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

module.exports = class BaseEvents {
	/** @param {import('../app.js')} app */
	constructor(app) {
		this.app = app;
		this.ErrorTicketManager = new app.utils.ErrorTicketManager('Base Events');

		this.onMessage = {
			queuer: new app.utils.ProcessQueue(1000),
			event: app.client.on('message', (message) => {
				this.onMessage.queuer.queue(async () => {
					try {
						await onMessage(message);
					}
					catch(error) {
						app.error_manager.mark(this.ErrorTicketManager.create('message', error));
					}
				});
			}),
		};

		this.onUserUpdate = {
			queuer: new app.utils.ProcessQueue(1000),
			event:  app.client.on('userUpdate', (oldUser, newUser) => {
				this.onUserUpdate.queuer.queue(async () => {
					try {
						await onUserUpdate(app, oldUser, newUser);
					}
					catch(error) {
						app.error_manager.mark(this.ErrorTicketManager.create('userUpdate', error));
					}
				});
			}),
		};

		this.onGuildMemberAdd = {
			queuer: new app.utils.ProcessQueue(1000),
			event: app.client.on('guildMemberAdd', (member) => {
				this.onGuildMemberAdd.queuer.queue(async () => {
					try {
						await onGuildMemberAdd(app, member);
					}
					catch(error) {
						app.error_manager.mark(this.ErrorTicketManager.create('guildMemberAdd', error));
					}
				});
			}),
		};

		this.onGuildMemberUpdate = {
			queuer: new app.utils.ProcessQueue(1000),
			event: app.client.on('guildMemberUpdate', (oldMember, newMember) => {
				this.onGuildMemberUpdate.queuer.queue(async () => {
					try {
						await onGuildMemberUpdate(app, oldMember, newMember);
					}
					catch(error) {
						app.error_manager.mark(this.ErrorTicketManager.create('guildMemberUpdate', error));
					}
				});
			}),
		};

		this.onGuildMemberRemove = {
			queuer: new app.utils.ProcessQueue(1000),
			event: app.client.on('guildMemberRemove', (member) => {
				this.onGuildMemberRemove.queuer.queue(async () => {
					try {
						await onGuildMemberRemove(app, member);
					}
					catch(error) {
						app.error_manager.mark(this.ErrorTicketManager.create('guildMemberRemove', error));
					}
				});
			}),
		};

		this.onGuildBanAdd = {
			queuer: new app.utils.ProcessQueue(1000),
			event: app.client.on('guildBanAdd', (guild, user) => {
				if (guild.id != app.guild.id) return;
				this.onGuildBanAdd.queuer.queue(async () => {
					try {
						await onGuildBanAdd(app, user);
					}
					catch(error) {
						app.error_manager.mark(this.ErrorTicketManager.create('guildBanAdd', error));
					}
				});
			}),
		};

		this.onGuildBanRemove = {
			queuer: new app.utils.ProcessQueue(1000),
			event: app.client.on('guildBanRemove', (guild, user) => {
				if (guild.id != this.app.guild.id) return;
				this.onGuildBanRemove.queue.queue(async () => {
					try {
						await onGuildBanRemove(app, user);
					}
					catch(error) {
						app.error_manager.mark(this.ErrorTicketManager.create('guildBanRemove', error));
					}
				});
			}),
		};

		this.onRoleCreate = {
			queuer: new app.utils.ProcessQueue(1000),
			event: app.client.on('roleCreate', (role) => {
				if (role.guild.id != app.guild.id) return;
				this.onRoleCreate.queuer.queue(async () => {
					try {
						await onRoleCreate(app, role);
					}
					catch(error) {
						app.error_manager.mark(this.ErrorTicketManager.create('roleCreate', error));
					}
				});
			}),
		};

		this.onRoleUpdate = {
			queuer: new app.utils.ProcessQueue(1000),
			event: app.client.on('roleUpdate', (oldRole, newRole) => {
				if (newRole.guild.id != app.guild.id) return;
				this.onRoleUpdate.queuer.queue(async () => {
					try {
						await onRoleUpdate(app, oldRole, newRole);
					}
					catch(error) {
						app.error_manager.mark(this.ErrorTicketManager.create('roleUpdate', error));
					}
				});
			}),
		};

		this.onRoleDelete = {
			queuer: new app.utils.ProcessQueue(1000),
			event: app.client.on('roleDelete', (role) => {
				if (role.guild.id != app.guild.id) return;
				this.onRoleDelete.queuer.queue(async () => {
					try {
						await onRoleDelete(app, role);
					}
					catch(error) {
						app.error_manager.mark(this.ErrorTicketManager.create('roleDelete', error));
					}
				});
			}),
		};

		this.onInviteCreate = {
			queuer: new app.utils.ProcessQueue(1000),
			event: app.client.on('inviteCreate', (invite) => {
				if (invite.guild.id != app.guild.id) return;
				this.onInviteCreate.queuer.queue(async () => {
					try {
						await onInviteCreate(app, invite);
					}
					catch(error) {
						app.error_manager.mark(this.ErrorTicketManager.create('inviteCreate', error));
					}
				});
			}),
		};

		this.onPresenceUpdate = {
			queuer: new app.utils.ProcessQueue(1000),
			event: app.client.on('presenceUpdate', (oldPresence, newPresence) => {
				if (newPresence.member.guild.id != app.guild.id || newPresence.member.user.bot) return;
				this.onPresenceUpdate.queuer.queue(async () => {
					try {
						await onPresenceUpdate(app, oldPresence, newPresence);
					}
					catch(error) {
						app.error_manager.mark(this.ErrorTicketManager.create('presenceUpdate', error));
					}
				});
			}),
		};

		this.onVoiceStateUpdate = {
			queuer: new app.utils.ProcessQueue(1000),
			event: app.client.on('voiceStateUpdate', (oldState, newState) => {
				if (newState.guild.id != app.guild.id) return;
				this.onVoiceStateUpdate.queuer.queue(async () => {
					try {
						await onVoiceStateUpdate(app, oldState, newState);
					}
					catch(error) {
						app.error_manager.mark(this.ErrorTicketManager.create('voiceStateUpdate', error));
					}
				});
			}),
		};

		this.onMessageReactionAdd = {
			queuer: new app.utils.ProcessQueue(1000),
			event: app.client.on('messageReactionAdd', (reaction, user) => {
				if (reaction.message.author.id != app.client.user.id || user.id == app.client.user.id) return;
				this.onMessageReactionAdd.queuer.queue(async () => {
					try {
						if (reaction.partial) reaction = await reaction.fetch();
						const message = await reaction.message.fetch();
						await onMessageReactionAdd(app, message, reaction, user);
					}
					catch(error) {
						app.error_manager.mark(this.ErrorTicketManager.create('messageReactionAdd', error));
					}
				});
			}),
		};

		this.onMessageReactionRemove = {
			queuer: new app.utils.ProcessQueue(1000),
			event: app.client.on('messageReactionRemove', (reaction, user) => {
				if (reaction.message.author.id != app.client.user.id || user.id == app.client.user.id) return;
				this.onMessageReactionRemove.queuer.queue(async () => {
					try {
						if (reaction.partial) reaction = await reaction.fetch();
						const message = await reaction.message.fetch();
						await onMessageReactionRemove(app, message, reaction, user);
					}
					catch(error) {
						app.error_manager.mark(this.ErrorTicketManager.create('messageReactionRemove', error));
					}
				});
			}),
		};
	}
};