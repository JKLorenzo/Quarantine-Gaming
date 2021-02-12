// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js');
const Commando = require('discord.js-commando');
const functions = require('../../modules/functions.js');
const constants = require('../../modules/constants.js');
/** @type {import('../../modules/app.js')} */
let app;
/** @type {import('../../modules/general.js')} */
let general;

module.exports = class PlayCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'play',
			group: 'services',
			memberName: 'play',
			aliases: ['p', 'g'],
			description: 'Invite members to play a game.',
			guildOnly: true,
			args: [
				{
					key: 'role',
					prompt: 'Mention the play role you want to play.',
					type: 'role',
					validate: role => {
						// Link
						app = this.client.modules.app;

						const game_role = app.role(role);
						if (game_role) {
							return game_role.hexColor == '#00fffe' && functions.contains(game_role.name, ' ⭐');
						}
						else {
							return false;
						}
					},
				},
				{
					key: 'input',
					prompt: '[Optional] Enter the number of players you\'re looking for, including yourself. (Range: 2 - 25; Default: 0)\n\nor\n\n[Optional] Mention the user/users you want to reserve. The mentioned user/users will automatically be added to your bracket without needing them to react.\n\nor\n\nBoth.',
					type: 'string',
					default: '0',
				},
			],
			throttling: {
				usages: 3,
				duration: 10,
			},
		});
	}

	/**
     * @param {Commando.CommandoMessage} message
     * @param {{role: Discord.RoleResolvable, input: String}}
     */
	async run(message, { role, input }) {
		// Link
		app = this.client.modules.app;
		general = this.client.modules.general;

		message.delete({ timeout: 10000 }).catch(e => void e);
		const game_role = app.role(role);
		const inviter = app.member(message.author);

		let count = 0;
		/** @type {Array<Discord.GuildMember>} */
		const reserved = new Array();
		for (const MemberOrCount of input.split(' ')) {
			const this_member = app.member(MemberOrCount);
			const this_count = functions.toCountingInteger(MemberOrCount);
			if (this_member) {
				reserved.push(this_member);
			}
			else if (!(functions.contains(MemberOrCount, '<') || functions.contains(MemberOrCount, '>')) && this_count >= 2 && this_count <= 25) {
				count = this_count;
			}
		}

		general.gameInvite(game_role, inviter, count, reserved);
		message.say(`Got it! This bracket will be available on the ${app.channel(constants.channels.integrations.game_invites)} channel.`).then(this_message => {
			this_message.delete({ timeout: 10000 }).catch(e => void e);
		}).catch(e => void e);
	}
};