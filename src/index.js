const { CommandoClient } = require('discord.js-commando');
const Discord = require('discord.js');
const path = require('path');
const app = require('./modules/app.js');
const fs = require('fs');
const channel_manager = require('./modules/channel_manager.js');
const classes = require('./modules/classes.js');
const constants = require('./modules/constants.js');
const database = require('./modules/database.js');
const error_manager = require('./modules/error_manager.js');
const functions = require('./modules/functions.js');
const general = require('./modules/general.js');
const message_manager = require('./modules/message_manager.js');
const reaction_manager = require('./modules/reaction_manager.js');
const role_manager = require('./modules/role_manager.js');
const speech = require('./modules/speech.js');

const ErrorTicketManager = new classes.ErrorTicketManager('index.js');

const client = new CommandoClient({
	commandPrefix: '!',
	owner: constants.owner,
	partials: [
		'MESSAGE', 'CHANNEL', 'REACTION',
	],
});

client.registry
	.registerDefaultTypes()
	.registerGroups([
		['management', 'Server Management'],
		['services', 'Server Services'],
		['experience', 'Game Experience Extensions'],
	])
	.registerDefaultGroups()
	.registerDefaultCommands({
		eval: false,
		prefix: false,
		commandState: false,
	})
	.registerCommandsIn(path.join(__dirname, 'commands'));

client.modules = {
	app: app,
	channel_manager: channel_manager,
	database: database,
	error_manager: error_manager,
	general: general,
	message_manager: message_manager,
	reaction_manager: reaction_manager,
	role_manager: role_manager,
	speech: speech,
};

async function uploadLocalEmojis() {
	try {
		const emojis_dir = path.join(__dirname, 'emojis');
		if (fs.existsSync(emojis_dir)) {
			const emojis = fs.readdirSync(emojis_dir);
			for (const emoji of emojis) {
				const emoji_path = path.join(emojis_dir, emoji);
				const emoji_name = path.parse(emoji_path).name;
				if (emoji_name && emoji_path) {
					try {
						console.log(`uploadLocalEmojis: Uploading ${emoji_name}`);
						const response = await app.guild().emojis.create(emoji_path, emoji_name, {
							reason: 'Local Emoji Upload',
						});
						if (response) {
							console.log(`uploadLocalEmojis: Finished uploading ${emoji_name}`);
						}
						else {
							console.error(`uploadLocalEmojis: Failed to upload ${emoji_name}`);
						}
					}
					catch (error) {
						console.error(`uploadLocalEmojis: Failed to upload ${emoji_name}`);
					}
					await functions.sleep(5000);
				}
			}
		}
	}
	catch (error) {
		console.error(`uploadLocalEmojis: Failed with error ${error}`);
	}
}

client.once('ready', async () => {
	console.log('Startup: Initializing');
	try {
		await client.user.setActivity('Startup', {
			type: 'WATCHING',
		});

		// Initialize Modules
		channel_manager.initialize(client);
		await database.initialize(client);
		general.initialize(client);
		message_manager.initialize(client);
		reaction_manager.initialize(client);
		role_manager.initialize(client);
		speech.initialize(client);
		error_manager.initialize(client);
		await app.initialize(client);
		uploadLocalEmojis();
	}
	catch (error) {
		console.error(`Startup: Failed with error ${error}`);
		await client.user.setActivity('Startup Failed', {
			type: 'WATCHING',
		});
	}
});

client.on('message', (incoming_message) => {
	if (app.isInitialized()) {
		message_manager.process(incoming_message);
	}
});

client.on('userUpdate', (oldUser, newUser) => {
	if (app.isInitialized()) {
		try {
			const embed = new Discord.MessageEmbed();
			embed.setAuthor('Quarantine Gaming: Member Submanager');
			embed.setTitle('User Update');
			embed.setThumbnail(newUser.displayAvatarURL());
			embed.addField('User:', newUser);

			// Avatar
			if (oldUser.displayAvatarURL() != newUser.displayAvatarURL()) {
				embed.addField('Avatar:', `New [Avatar](${newUser.displayAvatarURL()})`);
			}

			// Username
			if (oldUser.username != newUser.username) {
				embed.addField('Username:', `Old: ${oldUser.username}\nNew: ${newUser.username}`);
			}

			// Tag
			if (oldUser.tag != newUser.tag) {
				embed.addField('Tag:', `Old: ${oldUser.tag}\nNew: ${newUser.tag}`);
			}

			embed.setFooter(`Reference ID: ${newUser.id}`);
			embed.setTimestamp();
			embed.setColor('#64ffd4');
			if (embed.fields.length > 1) message_manager.sendToChannel(constants.channels.qg.logs, embed);
		}
		catch (error) {
			error_manager.mark(ErrorTicketManager.create('userUpdate', error));
		}
	}
});

client.on('guildMemberUpdate', (oldMember, newMember) => {
	if (app.isInitialized()) {
		try {
			const embed = new Discord.MessageEmbed();
			embed.setAuthor('Quarantine Gaming: Member Submanager');
			embed.setTitle('Member Update');
			embed.setThumbnail(newMember.user.displayAvatarURL());
			embed.addField('User:', newMember);

			// Display Name
			if (newMember.displayName != oldMember.displayName) {
				embed.addField('Display Name', `Old: ${oldMember.displayName}\nNew: ${newMember.displayName}`);
			}

			// Role
			if (newMember.roles.cache.size != oldMember.roles.cache.size) {
				const added = new Array(), removed = new Array();
				for (const this_role of newMember.roles.cache.difference(oldMember.roles.cache).array()) {
					if (functions.contains(this_role.name, ['Play', 'Text', 'Team']) || functions.contains(this_role.id, [constants.roles.dedicated, constants.roles.streaming])) {
						continue;
					}
					newMember.roles.cache.has(this_role.id) ? added.push(this_role.name) : removed.push(this_role.name);
				}
				if (added.length > 0) {
					embed.addField('Role Added:', added.join(', '));
				}
				if (removed.length > 0) {
					embed.addField('Role Removed:', removed.join(', '));
				}
			}

			embed.setFooter(`Reference ID: ${newMember.id}`);
			embed.setTimestamp();
			embed.setColor('#64ffd4');
			if (embed.fields.length > 1) message_manager.sendToChannel(constants.channels.qg.logs, embed);
		}
		catch (error) {
			error_manager.mark(ErrorTicketManager.create('guildMemberUpdate', error));
		}
	}
});

client.on('guildMemberAdd', (this_member) => {
	if (app.isInitialized()) {
		try {
			if (!this_member.user.bot) general.memberScreening(this_member);

			const created_day = this_member.user.createdAt;
			const created_day_difference = functions.compareDate(created_day);
			let estimated_difference = 'a few seconds ago';
			if (created_day_difference.days > 0) {
				estimated_difference = created_day_difference.days + ' days ago';
			}
			else if (created_day_difference.hours > 0) {
				estimated_difference = created_day_difference.hours + ' hours ago';
			}
			else if (created_day_difference.minutes > 0) {
				estimated_difference = created_day_difference.minutes + ' minutes ago';
			}

			const embed = new Discord.MessageEmbed();
			embed.setAuthor('Quarantine Gaming: Member Submanager');
			embed.setTitle('New Member');
			embed.setThumbnail(this_member.user.displayAvatarURL());
			embed.addField('User:', this_member);
			embed.addField('Account Created:', `${created_day.toUTCString().replace('GMT', 'UTC')} (${estimated_difference})`);
			embed.setFooter(`Reference ID: ${this_member.id}`);
			embed.setTimestamp();
			embed.setColor('#64ffd4');
			message_manager.sendToChannel(constants.channels.qg.logs, embed);
		}
		catch (error) {
			error_manager.mark(ErrorTicketManager.create('guildMemberAdd', error));
		}
	}
});

client.on('roleCreate', (this_role) => {
	if (app.isInitialized()) {
		try {
			if (functions.contains(this_role.name, ['Play', 'Text', 'Team']) || functions.contains(this_role.id, [constants.roles.dedicated, constants.roles.streaming])) {
				return;
			}
			const embed = new Discord.MessageEmbed();
			embed.setAuthor('Quarantine Gaming: Role Submanager');
			embed.setTitle('Role Created');
			embed.addField('Name:', this_role.name, true);
			embed.addField('Mentionable:', this_role.mentionable, true);
			embed.addField('Hoisted:', this_role.hoist, true);
			embed.setFooter(`Reference ID: ${this_role.id}`);
			embed.setTimestamp();
			embed.setColor(this_role.color);
			message_manager.sendToChannel(constants.channels.qg.logs, embed);
		}
		catch (error) {
			error_manager.mark(ErrorTicketManager.create('roleCreate', error));
		}
	}
});

client.on('roleDelete', (this_role) => {
	if (app.isInitialized()) {
		try {
			if (functions.contains(this_role.name, ['Play', 'Text', 'Team']) || functions.contains(this_role.id, [constants.roles.dedicated, constants.roles.streaming])) {
				return;
			}
			const embed = new Discord.MessageEmbed();
			embed.setAuthor('Quarantine Gaming: Role Submanager');
			embed.setTitle('Role Deleted');
			embed.addField('Name:', this_role.name, true);
			embed.setTimestamp();
			embed.setColor(this_role.color);
			message_manager.sendToChannel(constants.channels.qg.logs, embed);
		}
		catch (error) {
			error_manager.mark(ErrorTicketManager.create('roleDelete', error));
		}
	}
});

client.on('inviteCreate', (invite) => {
	if (app.isInitialized()) {
		try {
			app.addInvite(invite);

			const embed = new Discord.MessageEmbed();
			embed.setAuthor('Quarantine Gaming: Invite Submanager');
			embed.setTitle('New Invite Created');
			if (invite.inviter) {
				embed.addField('Inviter:', invite.inviter, true);
				embed.setThumbnail(invite.inviter.displayAvatarURL());
			}
			if (invite.targetUser) embed.addField('Target User:', invite.targetUser, true);
			embed.addFields([
				{ name: 'Channel:', value: invite.channel, inline: true },
				{ name: 'Code:', value: invite.code, inline: true },
			]);
			if (invite.maxUses) {
				embed.addField('Max Uses:', invite.maxUses, true);
			}
			else {
				embed.addField('Max Uses:', 'Infinite', true);
			}
			if (invite.expiresTimestamp) {
				embed.setTimestamp(invite.expiresTimestamp);
				embed.setFooter('Expires ');
			}
			else {
				embed.setFooter('NO EXPIRATION DATE ⚠');
			}
			embed.setColor('#25c081');
			message_manager.sendToChannel(constants.channels.server.management, embed);
		}
		catch (error) {
			error_manager.mark(ErrorTicketManager.create('inviteCreate', error));
		}
	}
});

client.on('presenceUpdate', (oldPresence, newPresence) => {
	if (app.isInitialized()) {
		try {
			const member = newPresence.member ? newPresence.member : oldPresence.member;
			if (!member.user.bot) {
				if (newPresence.status == 'offline') {
					general.memberOffline(member);
				}

				// Sort Changed Activities
				let oldActivities = new Array(), newActivities = new Array();
				if (oldPresence) oldActivities = oldPresence.activities.map(activity => activity.name.trim());
				if (newPresence) newActivities = newPresence.activities.map(activity => activity.name.trim());
				const acitivityDifference = functions.compareArray(oldActivities, newActivities).map(activity_name => {
					if (newActivities.includes(activity_name)) {
						return {
							activity: newPresence.activities.find(activity => activity.name.trim() == activity_name),
							new: true,
						};
					}
					else {
						return {
							activity: oldPresence.activities.find(activity => activity.name.trim() == activity_name),
							new: false,
						};
					}
				});
				for (const data of acitivityDifference) {
					general.memberActivityUpdate(member, data);
				}
			}
		}
		catch (error) {
			error_manager.mark(ErrorTicketManager.create('presenceUpdate', error));
		}
	}
});

client.on('voiceStateUpdate', (oldState, newState) => {
	if (app.isInitialized()) {
		try {
			const member = newState.member ? newState.member : oldState.member;
			if (!member.user.bot && oldState.channel != newState.channel) {
				general.memberVoiceUpdate(member, oldState, newState);
			}
		}
		catch (error) {
			error_manager.mark(ErrorTicketManager.create('voiceStateUpdate', error));
		}
	}
});

client.on('messageReactionAdd', async (reaction, user) => {
	if (app.isInitialized()) {
		try {
			if (reaction.partial) await reaction.fetch();
			if (reaction.message.partial) await reaction.message.fetch();
			const this_message = reaction.message;
			const this_member = app.member(user.id);

			if (this_member && !this_member.user.bot && this_message && this_message.embeds.length > 0 && this_message.author.id == constants.me) {
				reaction_manager.onReactionAdd(this_message, this_message.embeds[0], reaction.emoji, this_member);
			}
		}
		catch (error) {
			error_manager.mark(ErrorTicketManager.create('messageReactionAdd', error));
		}
	}
});

client.on('messageReactionRemove', async (reaction, user) => {
	if (app.isInitialized()) {
		try {
			if (reaction.partial) await reaction.fetch();
			if (reaction.message.partial) await reaction.message.fetch();
			const this_message = reaction.message;
			const this_member = app.member(user.id);

			if (this_member && !this_member.user.bot && this_message && this_message.embeds.length > 0 && this_message.author.id == constants.me) {
				reaction_manager.onReactionRemove(this_message, this_message.embeds[0], reaction.emoji, this_member);
			}
		}
		catch (error) {
			error_manager.mark(ErrorTicketManager.create('messageReactionRemove', error));
		}
	}
});

client.on('emojiCreate', (emoji) => {
	if (app.isInitialized()) {
		try {
			const embed = new Discord.MessageEmbed();
			embed.setAuthor('Quarantine Gaming: Emoji Submanager');
			embed.setTitle('Emoji Created');
			embed.addField('Name:', emoji.name);
			embed.setThumbnail(emoji.url);
			embed.setColor('#6464ff');
			embed.setTimestamp();
			message_manager.sendToChannel(constants.channels.qg.logs, embed);
		}
		catch (error) {
			error_manager.mark(ErrorTicketManager.create('emojiCreate', error));
		}
	}
});

client.on('emojiUpdate', (oldEmoji, newEmoji) => {
	if (app.isInitialized()) {
		try {
			const embed = new Discord.MessageEmbed();
			embed.setAuthor('Quarantine Gaming: Emoji Submanager');
			embed.setTitle('Emoji Updated');
			if (oldEmoji.name != newEmoji.name) {
				embed.addField('Old Name:', oldEmoji.name);
				embed.addField('Updated Name:', newEmoji.name);
				embed.setThumbnail(newEmoji.url);
				embed.setColor('#6464ff');
				embed.setTimestamp();
				message_manager.sendToChannel(constants.channels.qg.logs, embed);
			}
		}
		catch (error) {
			error_manager.mark(ErrorTicketManager.create('emojiCreate', error));
		}
	}
});

client.on('emojiDelete', (emoji) => {
	if (app.isInitialized()) {
		try {
			const embed = new Discord.MessageEmbed();
			embed.setAuthor('Quarantine Gaming: Emoji Submanager');
			embed.setTitle('Emoji Deleted');
			embed.addField('Name:', emoji.name);
			embed.addField('ID:', emoji.id);
			embed.setColor('#6464ff');
			embed.setTimestamp();
			message_manager.sendToChannel(constants.channels.qg.logs, embed);
		}
		catch (error) {
			error_manager.mark(ErrorTicketManager.create('emojiCreate', error));
		}
	}
});

client.on('rateLimit', (rateLimitInfo) => {
	console.error('Client RateLimit:');
	console.error(rateLimitInfo);
	if (app.isInitialized()) {
		try {
			const embed = new Discord.MessageEmbed();

			embed.setAuthor('Quarantine Gaming: Telemetry');
			embed.setTitle('The client hits a rate limit while making a request.');
			embed.addField('Timeout', rateLimitInfo.timeout);
			embed.addField('Limit', rateLimitInfo.limit);
			embed.addField('Method', rateLimitInfo.method);
			embed.addField('Path', rateLimitInfo.path);
			embed.addField('Route', rateLimitInfo.route);
			embed.setColor('#ffff00');
			embed.setTimestamp();
			message_manager.sendToChannel(constants.channels.qg.logs, embed);
		}
		catch (error) {
			error_manager.mark(ErrorTicketManager.create('rateLimit', error));
		}
	}
});

client.on('debug', info => {
	console.log(`Client Debug: ${info}`);
});

client.on('error', (error) => {
	console.error(`Client Error: ${error}`);
	if (app.isInitialized()) {
		error_manager.mark(ErrorTicketManager.create('Client Error', error));
	}
});

console.log('Startup: Logging in');
client.login(process.env.BOT_TOKEN);