// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js');
const Commando = require('discord.js-commando');
const constants = require('../../modules/constants.js');
/** @type {import('../../modules/app.js')} */
let app;
/** @type {import('../../modules/message_manager.js')} */
let message_manager;

module.exports = class TransferCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'transfer',
			group: 'services',
			memberName: 'transfer',
			description: 'Transfer a user/users to your current voice channel.',
			userPermissions: [constants.permissions.voice.MOVE_MEMBERS],
			guildOnly: true,
			args: [
				{
					key: 'users',
					prompt: 'Mention the user/users you want to transfer.',
					type: 'string',
				},
			],
			throttling: {
				usages: 1,
				duration: 10,
			},
		});
	}

	/**
     * @param {Commando.CommandoMessage} message
     * @param {{users: String}}
     */
	async run(message, { users }) {
		// Link
		app = this.client.modules.app;
		message_manager = this.client.modules.message_manager;

		message.delete({ timeout: 10000 }).catch(e => void e);
		const voice_channel = app.member(message.author).voice.channel;
		if (voice_channel) {
			for (const user of users.split(' ')) {
				const this_member = app.member(user);
				if (this_member) {
					if (this_member.voice.channelID) {
						await this_member.voice.setChannel(voice_channel.id);
						await message_manager.sendToUser(this_member, `You have been transfered by ${message.author} to ${voice_channel.name}.`);
					}
					else {
						message.reply(`${this_member} must be connected to a voice channel.`).then(this_message => {
							this_message.delete({ timeout: 10000 }).catch(e => void e);
						}).catch(e => void e);
					}
				}
				else {
					message.reply(`I can't find user ${user}, please try again.`).then(this_message => {
						this_message.delete({ timeout: 10000 }).catch(e => void e);
					}).catch(e => void e);
				}
			}
		}
		else {
			message.reply('You must be connected to a voice channel before you can trasfer other members.').then(this_message => {
				this_message.delete({ timeout: 10000 }).catch(e => void e);
			}).catch(e => void e);
		}
	}
};