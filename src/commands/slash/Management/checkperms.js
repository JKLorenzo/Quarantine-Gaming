const { MessageEmbed, Permissions, Role } = require('discord.js');
const { SlashCommand } = require('../../../structures/Base.js');
const { constants } = require('../../../utils/Base.js');

/**
 * @typedef {import('../../../structures/Base.js').Client} Client
 * @typedef {import('../../../structures/Base.js').ExtendedMember} ExtendedMember
 * @typedef {import('discord.js').CommandInteraction} CommandInteraction
 * @typedef {import('discord.js').GuildChannel} GuildChannel
 */

module.exports = class CheckPerms extends SlashCommand {
	constructor() {
		super({
			name: 'checkperms',
			description: '[Mod] Gets the permission of a member or a role.',
			options: [
				{
					name: 'userperms',
					description: 'Gets the permission of the user.',
					type: 'SUB_COMMAND',
					options: [
						{
							name: 'user',
							description: 'The target user to check the permissions.',
							type: 'USER',
							required: true,
						},
						{
							name: 'channel',
							description: 'The channel to check the permissions from.',
							type: 'CHANNEL',
							required: true,
						},
						{
							name: 'advanced',
							description: 'Include server permissions.',
							type: 'BOOLEAN',
						},
					],
				},
				{
					name: 'roleperms',
					description: 'Gets the permission of the role.',
					type: 'SUB_COMMAND',
					options: [
						{
							name: 'role',
							description: 'The target role to check the permissions.',
							type: 'ROLE',
							required: true,
						},
						{
							name: 'channel',
							description: 'The channel to check the permissions from.',
							type: 'CHANNEL',
							required: true,
						},
						{
							name: 'advanced',
							description: 'Include server permissions.',
							type: 'BOOLEAN',
						},
					],
				},
			],
			defaultPermission: false,
			permissions: {
				roles: {
					allow: [
						constants.roles.staff,
						constants.roles.moderator,
					],
				},
			},
		});
	}

	/**
	 * @param {CommandInteraction} interaction
	 * @param {{userperms?: {user: ExtendedMember, channel: GuildChannel, advanced?: boolean}, roleperms?: {role: Role, channel: GuildChannel, advanced?: boolean}}} options
	 */
	async exec(interaction, options) {
		await interaction.defer();

		const args = options.userperms || options.roleperms;
		const target = args.user || args.role;
		const channel = args.channel;
		const advanced = args.advanced;

		const entity_permissions = channel.permissionsFor(target);

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
			title: `${target instanceof Role ? 'Role' : 'Member'} Permissions Report`,
			description: `${target} permissions on ${channel} channel.`,
			color: '#ffff00',
			timestamp: new Date(),
		});

		if (advanced) embed.addField('Server Permissions', server_permissions.result.join('\n'));
		embed.addField('General Channel Permissions', general_channel_permissions.result.join('\n'));
		embed.addField('Membership Permissions', membership_permissions.result.join('\n'));
		switch(channel.type) {
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

		interaction.editReply(embed);
	}
};