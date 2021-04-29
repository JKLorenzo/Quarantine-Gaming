const { Command } = require('discord-akairo');
const { MessageEmbed } = require('discord.js');
const { fetchImage, generateColor, constants } = require('../../utils/Base.js');

/**
 * @typedef {import('../../structures/Base.js').Client} Client
 * @typedef {import('../../structures/Base.js').ExtendedMessage} ExtendedMessage
 * @typedef {import('../../structures/Base.js').ExtendedMember} ExtendedMember
 * @typedef {import('discord.js').Role} Role
 */

module.exports = class Invite extends Command {
	constructor() {
		super('invite', {
			aliases: ['invite'],
			category: 'Services',
			description: 'Invite members to play a game.',
			args: [
				{
					id: 'count',
					type: (message, phrase) => {
						if (isNaN(phrase)) return null;
						const count = parseInt(phrase);
						if (count >= 1 && count <= 25) return count;
						return null;
					},
					match: 'option',
					flag: '--',
				},
				{
					id: 'data',
					type: (message, content) => {
						const roles = message.mentions.roles.filter(role => role.hexColor == constants.colors.game_role_mentionable).array();
						if (roles.length == 0) return null;
						return {
							game_roles: roles,
							remarks: content.split(' ').map(word => {
								if (word.startsWith('<') || word.endsWith('>')) return '';
								return word;
							}).join(' ').trim(),
						};
					},
					description: 'The game role mentionable.',
					match: 'rest',
					prompt: {
						start: 'Enter the game role or game roles representing the game you wanted to create an invite with.',
						retry: 'You must enter a valid game role mentionable.',
					},
				},
			],
		});
	}

	/**
     * @param {ExtendedMessage} message
     * @param {{count: number, data: {game_roles: Role[], remarks: string}}} args
     */
	async exec(message, args) {
		/** @type {Client} */
		const client = message.client;

		const reply = await message.reply('Please wait...');
		const game_invites_channel = client.channel(constants.channels.integrations.game_invites);

		for (const game_role_mentionable of args.data.game_roles) {
			const game_role = client.guild.roles.cache.find(role => role.hexColor == constants.colors.game_role && game_role_mentionable.name.startsWith(role.name));
			const image = await fetchImage(game_role.name);
			const embed = new MessageEmbed({
				author: { name: 'Quarantine Gaming: Game Coordinator' },
				title: game_role.name,
				thumbnail: { url: image.small },
				description: args.data.remarks,
				fields: [
					{ name: 'Player 1', value: message.member },
				],
				image: { url: image.large },
				color: generateColor().toHex(),
				footer: { text: 'Join this bracket by reacting below.' },
			});

			const members = message.mentions.members.filter(member => !member.user.bot).array();
			const slots = (args.count ? args.count : 0) - 1;
			for (let index = 0; index < slots; index++) {
				embed.addField(`Player ${index + 2}`, members[index] ? members[index] : '\u200b');
			}

			const this_invite = await client.message_manager.sendToChannel(game_invites_channel, { content: `${message.member.displayName} is inviting you to play ${game_role}.`, embed: embed });
			const coordinator_emoji = client.guild.emojis.cache.find(this_emoji => this_emoji.name == 'blob_party');
			await client.reaction_manager.add(this_invite, coordinator_emoji);
			this_invite.delete({ timeout: 1800000 }).catch(e => void e);
		}

		return reply.edit(`All done! Your game invite will be available on the ${game_invites_channel} channel.`).then(() => {
			message.delete({ timeout: 30000 }).catch(e => void e);
			reply.delete({ timeout: 30000 }).catch(e => void e);
		});
	}
};