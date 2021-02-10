const Discord = require('discord.js');
const Commando = require('discord.js-commando');
const functions = require('../../modules/functions.js');
const constants = require('../../modules/constants.js');
/** @type {import('../../modules/app.js')} */
let app;
/** @type {import('../../modules/general.js')} */
let general;
/** @type {import('../../modules/message_manager.js')} */
let message_manager;

module.exports = class DedicateCommand extends Commando.Command {
	constructor(client) {
		super(client, {
			name: 'dedicate',
			group: 'services',
			memberName: 'dedicate',
			description: 'Manually create a dedicated voice and text channel.',
			args: [
				{
					key: 'name',
					prompt: 'Enter the name of the channel. The name must be within 1 to 30 characters long.',
					type: 'string',
					validate: name => name.length > 0 && name.length <= 30,
				},
			],
			throttling: {
				usages: 2,
				duration: 120,
			},
		});
	}

	/**
     * @param {Commando.CommandoMessage} message
     * @param {{name: String}}
     */
	async run(message, { name }) {
		// Link
		app = this.client.modules.app;
		general = this.client.modules.general;
		message_manager = this.client.modules.message_manager;

		message.delete({ timeout: 10000 }).catch(e => void e);
		const voice_channel = app.member(message.author).voice.channel;
		if (voice_channel) {
			if (name.toLowerCase() == 'lock' || name.toLowerCase() == 'unlock') {
				if (voice_channel.parentID == constants.channels.category.dedicated) {
					const text_channel = app.guild().channels.cache.find(channel => channel.type == 'text' && channel.topic && channel.topic.split(' ')[0] == voice_channel.id);
					const embed = new Discord.MessageEmbed();
					embed.setAuthor('Quarantine Gaming: Dedicated Channels');
					embed.setThumbnail(message.author.displayAvatarURL());
					embed.setFooter(`${message.author.tag} (${message.author.id})`);
					embed.setTimestamp();
					embed.setColor('#ffe500');
					switch (name) {
					case 'lock':
						await voice_channel.updateOverwrite(constants.roles.member, {
							'CONNECT': false,
						});
						embed.setTitle(voice_channel.name);
						embed.setDescription(`${message.author} locked this channel.`);
						await message_manager.sendToChannel(text_channel, embed);
						break;
					case 'unlock':
						await voice_channel.updateOverwrite(constants.roles.member, {
							'CONNECT': true,
						});
						embed.setTitle(voice_channel.name);
						embed.setDescription(`${message.author} unlocked this channel.`);
						await message_manager.sendToChannel(text_channel, embed);
						break;
					}
				}
				else {
					message.reply('You must be on a dedicated channel to lock or unlock a voice channel.').then(this_message => {
						this_message.delete({ timeout: 10000 }).catch(e => void e);
					}).catch(e => void e);
				}
			}
			else {
				name = name.trim();
				if (name.startsWith('<') && name.endsWith('>')) {
					// Role
					const role = app.role(name);
					const channel = app.channel(name);
					const member = app.member(name);
					if (role) name = functions.toAlphanumericString(role.name);
					if (channel) name = functions.toAlphanumericString(channel.name);
					if (member) name = member.displayName;

					message.reply(`Got it! Please wait while I'm preparing **${name}** voice and text channels.`).then(this_message => {
						this_message.delete({ timeout: 10000 }).catch(e => void e);
					}).catch(e => void e);
					await general.dedicateChannel(voice_channel, name);
				}
				else {
					// Filter
					name = name.split(' ').map(word => {
						return functions.toAlphanumericString(word);
					}).join(' ');
					message.reply(`Got it! Please wait while I'm preparing **${name}** voice and text channels.`).then(this_message => {
						this_message.delete({ timeout: 10000 }).catch(e => void e);
					}).catch(e => void e);
					await general.dedicateChannel(voice_channel, name);
				}
			}
		}
		else {
			message.reply('You must be connected to any Voice Room channels to create a dedicated channel.').then(this_message => {
				this_message.delete({ timeout: 10000 }).catch(e => void e);
			}).catch(e => void e);
		}
	}
};