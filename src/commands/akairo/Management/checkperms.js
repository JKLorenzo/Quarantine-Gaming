const { MessageEmbed, Permissions, Role } = require('discord.js');
const { Command } = require('discord-akairo');
const { parseMention, constants } = require('../../../utils/Base.js');

/**
 * @typedef {import('../../../structures/Base.js').Client} Client
 * @typedef {import('../../../structures/Base.js').ExtendedMessage} ExtendedMessage
 * @typedef {import('../../../structures/Base.js').ExtendedMember} ExtendedMember
 * @typedef {import('discord.js').GuildChannel} GuildChannel
 * @typedef {import('discord.js').Role} Role
 */

module.exports = class CheckPerms extends Command {
	constructor() {
		super('checkperms', {
			aliases: ['checkperms', 'perms'],
			category: 'Management',
			description: '[Staff] Gets the permissions of a member or a role in a channel.',
			channel: 'guild',
			args: [
				{
					id: 'channel',
					type: 'channel',
					description: 'The target channel/ID.',
					prompt: {
						start: 'Mention the channel or enter the channel ID.',
						retry: 'You must enter a valid channel or channel ID.',
					},
					unordered: true,
				},
				{
					id: 'entity',
					type: (message, phrase) => {
						const role = message.guild.roles.resolve(phrase) || message.guild.roles.resolve(parseMention(phrase));
						const member = message.guild.members.resolve(phrase) || message.guild.members.resolve(parseMention(phrase));
						if (role || member) return role || member;
						return null;
					},
					description: 'The target member/ID or role/ID.',
					prompt: {
						start: 'Mention the member or role, or their corresponding ID.',
						retry: 'You must enter a valid member/ID or role/ID.',
					},
					unordered: true,
				},
				{
					id: 'advanced',
					match: 'flag',
					flag: '--advanced',
				},
			],
		});
	}

	/** @param {ExtendedMessage} message */
	userPermissions(message) {
		/** @type {ExtendedMember} */
		const member = message.member;
		if (!member.hasRole([constants.roles.staff, constants.roles.moderator])) return 'Staff/Moderator';
		return null;
	}

	/**
     * @param {ExtendedMessage} message
     * @param {{channel: GuildChannel, entity: Role | ExtendedMember, advanced: boolean}} args
     */
	exec(message, args) {
		const entity_permissions = args.channel.permissionsFor(args.entity);

		const server_permissions = {
			flags: [
				'ADMINISTRATOR', 'BAN_MEMBERS', 'CHANGE_NICKNAME', 'KICK_MEMBERS', 'MANAGE_EMOJIS',
				'MANAGE_GUILD', 'MANAGE_NICKNAMES', 'VIEW_AUDIT_LOG', 'VIEW_GUILD_INSIGHTS',
			],
			result: new Array(),
		};
		const general_channel_permissions = {
			flags: ['VIEW_CHANNEL', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 'MANAGE_WEBHOOKS'],
			result: new Array(),
		};
		const membership_permissions = {
			flags: ['CREATE_INSTANT_INVITE'],
			result: new Array(),
		};
		const text_channel_permissions = {
			flags: [
				'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES', 'ADD_REACTIONS', 'USE_EXTERNAL_EMOJIS',
				'MENTION_EVERYONE', 'MANAGE_MESSAGES', 'READ_MESSAGE_HISTORY', 'SEND_TTS_MESSAGES',
			],
			result: new Array(),
		};
		const voice_channel_permissions = {
			flags: [
				'CONNECT', 'SPEAK', 'STREAM', 'USE_VAD', 'PRIORITY_SPEAKER',
				'MUTE_MEMBERS',	'DEAFEN_MEMBERS', 'MOVE_MEMBERS',
			],
			result: new Array(),
		};
		const stage_channel_permissions = {
			flags: ['REQUEST_TO_SPEAK'],
			result: new Array(),
		};
		const others_permissions = new Array();

		for (const permission of Object.entries(Permissions.FLAGS).map(entry => entry[0]).sort()) {
			const permission_name = permission.split('_').map(word => {
				if (word == 'TTS') return 'Text-to-Speech';
				if (word == 'VAD') return 'Voice Activity';
				return word.charAt(0).toUpperCase() + word.substring(1).toLowerCase();
			}).join(' ');

			const this_permission = `${entity_permissions.has(permission) ? '✅' : '❌'} - ${permission_name}`;

			if (server_permissions.flags.includes(permission)) {
				server_permissions.result.push(this_permission);
			}
			else if (general_channel_permissions.flags.includes(permission)) {
				general_channel_permissions.result.push(this_permission);
			}
			else if (membership_permissions.flags.includes(permission)) {
				membership_permissions.result.push(this_permission);
			}
			else if (text_channel_permissions.flags.includes(permission)) {
				text_channel_permissions.result.push(this_permission);
			}
			else if (voice_channel_permissions.flags.includes(permission)) {
				voice_channel_permissions.result.push(this_permission);
			}
			else if (stage_channel_permissions.flags.includes(permission)) {
				stage_channel_permissions.result.push(this_permission);
			}
			else {
				others_permissions.push(this_permission);
			}
		}

		const embed = new MessageEmbed({
			author: { name: 'Quarantine Gaming: Permission Flags' },
			title: `${args.entity instanceof Role ? 'Role' : 'Member'} Permissions Report`,
			description: `${args.entity} permissions on ${args.channel} channel.`,
			color: '#ffff00',
			timestamp: new Date(),
		});

		if (args.advanced) embed.addField('Server Permissions', server_permissions.result.join('\n'));
		embed.addField('General Channel Permissions', general_channel_permissions.result.join('\n'));
		embed.addField('Membership Permissions', membership_permissions.result.join('\n'));
		switch(args.channel.type) {
		case 'text':
		case 'news':
		case 'store':
			embed.addField('Text Channel Permissions', text_channel_permissions.result.join('\n'));
			break;
		case 'voice':
			embed.addField('Voice Channel Permissions', voice_channel_permissions.result.join('\n'));
			break;
		case 'category':
			embed.addField('Text Channel Permissions', text_channel_permissions.result.join('\n'));
			embed.addField('Voice Channel Permissions', voice_channel_permissions.result.join('\n '));
			break;
		}
		if (others_permissions.length) embed.addField('Uncategorized Permissions', others_permissions.join('\n'));

		return message.reply(embed).then(reply => {
			reply.delete({ timeout: 60000 }).catch(e => void e);
			message.delete({ timeout: 60000 }).catch(e => void e);
		});
	}
};