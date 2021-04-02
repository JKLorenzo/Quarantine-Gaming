const Discord = require('discord.js');
// eslint-disable-next-line no-unused-vars
const { ExtendedMember } = require('../structures/Base.js');

/**
 * @param {import('../app.js')} app
 * @param {Discord.VoiceState} oldState
 * @param {Discord.VoiceState} newState
 */
module.exports = async function onVoiceStateUpdate(app, oldState, newState) {
	/** @type {ExtendedMember} */
	const member = newState.member;
	if (oldState.channel && oldState.channel.parent.id == app.utils.constants.channels.category.dedicated_voice) {
		const text_channel = app.channel(app.utils.constants.channels.category.dedicated).children.find(channel => channel.type == 'text' && channel.topic && app.utils.function.parseMention(channel.topic.split(' ')[0]) == oldState.channelID);
		const linked_data = text_channel.topic.split(' ');
		const team_role = app.role(linked_data[1]);

		if (oldState.channel.members.size > 0 && !(oldState.channel.members.size == 1 && oldState.channel.members.first().user.bot)) {
			app.role_manager.remove(member, team_role);
			const embed = new Discord.MessageEmbed();
			embed.setAuthor('Quarantine Gaming: Dedicated Channels');
			embed.setTitle(oldState.channel.name);
			embed.setDescription(`${oldState.member} left this channel.`);
			embed.setThumbnail(member.user.displayAvatarURL());
			embed.setFooter(`${member.user.tag} (${member.user.id})`);
			embed.setTimestamp();
			embed.setColor('#7b00ff');
			app.message_manager.sendToChannel(text_channel, embed);
		}
		else {
			await app.role_manager.delete(team_role);
			await app.channel_manager.delete(oldState.channel);
			await app.channel_manager.delete(text_channel);
		}
	}

	if (newState.channel) {
		// Check if members are streaming
		const streamers = new Array();
		for (const this_member of newState.channel.members.array()) {
			if (member.user.id != this_member.user.id && this_member.roles.cache.has(app.utils.constants.roles.streaming)) {
				streamers.push(this_member);
			}
		}
		// Notify member
		if (streamers.length > 0) {
			const embed = new Discord.MessageEmbed();
			embed.setAuthor('Quarantine Gaming: Information');
			embed.setTitle(`${streamers.length > 1 ? `${streamers.map(this_member => this_member.displayName).join(' and ')} are` : `${streamers.map(this_member => this_member.displayName)} is`} currently Streaming`);
			embed.setDescription('Please observe proper behavior on your current voice channel.');
			embed.setImage('https://pa1.narvii.com/6771/d33918fa87ad0d84b7dc854dcbf6a8545c73f94d_hq.gif');
			embed.setColor('#5dff00');
			app.message_manager.sendToUser(member, embed);
		}

		if (newState.channel.parent.id == app.utils.constants.channels.category.dedicated_voice) {
			const text_channel = app.channel(app.utils.constants.channels.category.dedicated).children.find(channel => channel.topic && app.utils.function.parseMention(channel.topic.split(' ')[0]) == newState.channelID);
			const linked_data = text_channel.topic.split(' ');
			const team_role = app.role(linked_data[1]);

			// Add Text Role
			if (!member.roles.cache.has(team_role.id)) {
				const embed = new Discord.MessageEmbed();
				embed.setAuthor('Quarantine Gaming: Dedicated Channels');
				embed.setTitle(newState.channel.name);
				embed.setDescription(`${newState.member} joined this channel.`);
				embed.setThumbnail(newState.member.user.displayAvatarURL());
				embed.setFooter(`${newState.member.user.tag} (${newState.member.user.id})`);
				embed.setTimestamp();
				embed.setColor('#7b00ff');
				app.message_manager.sendToChannel(text_channel, embed);
				app.role_manager.add(member, team_role);
			}
		}
		else if (newState.channel.parent.id == app.utils.constants.channels.category.voice && newState.channel.members.array().length >= 5) {
			// Dedicate this channel
			await app.utils.sleep(5000);
			await this.dedicateChannel(newState.channel, newState.channel.members.array()[0].displayName);
		}
	}
	else if (member.roles.cache.has(app.utils.constants.roles.streaming)) {
		app.role_manager.remove(member, app.utils.constants.roles.streaming);
	}
};