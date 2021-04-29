const { MessageEmbed } = require('discord.js');
const { Command } = require('discord-akairo');
const { parseMention, constants } = require('../../utils/Base.js');

/**
 * @typedef {import('../../structures/Base.js').Client} Client
 * @typedef {import('../../structures/Base.js').ExtendedMessage} ExtendedMessage
 * @typedef {import('../../structures/Base.js').ExtendedMember} ExtendedMember
 * @typedef {import('discord.js').GuildChannel} GuildChannel
 * @typedef {import('discord.js').Role} Role
 */

module.exports = class CheckRole extends Command {
	constructor() {
		super('checkrole', {
			aliases: ['checkrole'],
			category: 'Management',
			description: '[Mod] Gets the permissions of a member or a role in a channel.',
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
			],
		});
	}

	/** @param {ExtendedMessage} message */
	userPermissions(message) {
		/** @type {ExtendedMember} */
		const member = message.member;
		if (!member.hasRole(constants.roles.staff)) return 'Staff';
		return null;
	}

	/**
     * @param {ExtendedMessage} message
     * @param {{channel: GuildChannel, entity: Role | ExtendedMember}} args
     */
	exec(message, args) {
		const entity_permissions = args.channel.permissionsFor(args.entity);
		const embed = new MessageEmbed({
			author: { name: 'Quarantine Gaming: Permission Flags' },
			title: 'Entity Permission Report',
			description: `${args.entity} permissions on ${args.channel} channel.`,
			color: '#ffff00',
			timestamp: new Date(),
		});

		// General Permissions
		const general_permissions = new Array();
		for (const this_permission of Object.entries(constants.permissions.general)) {
			general_permissions.push({
				name: this_permission[0].split('_').map(text => text.substring(0, 1).toUpperCase() + text.slice(1).toLowerCase()).join(' '),
				value: entity_permissions.has(this_permission[1]),
			});
		}
		embed.addField('General Category Permissions', general_permissions.map(permission => `${permission.name}: ${permission.value ? '✅' : '❌'}`).join('\n'));
		// Type-Specific Permissions
		const type_specific_permissions = new Array();
		switch (args.channel.type) {
		case 'text':
			for (const this_permission of Object.entries(constants.permissions.text)) {
				type_specific_permissions.push({
					name: this_permission[0].split('_').map(text => text.substring(0, 1).toUpperCase() + text.slice(1).toLowerCase()).join(' '),
					value: entity_permissions.has(this_permission[1]),
				});
			}
			embed.addField('Text Channel Permissions', type_specific_permissions.map(permission => `${permission.name}: ${permission.value ? '✅' : '❌'}`).join('\n'));
			break;
		case 'voice':
			for (const this_permission of Object.entries(constants.permissions.voice)) {
				type_specific_permissions.push({
					name: this_permission[0].split('_').map(text => text.substring(0, 1).toUpperCase() + text.slice(1).toLowerCase()).join(' '),
					value: entity_permissions.has(this_permission[1]),
				});
			}
			embed.addField('Voice Channel Permissions', type_specific_permissions.map(permission => `${permission.name}: ${permission.value ? '✅' : '❌'}`).join('\n'));
			break;
		}

		return message.reply(embed);
	}
};