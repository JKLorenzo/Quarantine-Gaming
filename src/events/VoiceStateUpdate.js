const { MessageEmbed } = require('discord.js');
const { parseMention, sleep, constants } = require('../utils/Base.js');

/**
 * @typedef {import('../structures/Base.js').Client} Client
 * @typedef {import('discord.js').VoiceState} VoiceState
 */

/**
 * @param {Client} client
 * @param {VoiceState} oldState
 * @param {VoiceState} newState
 */
module.exports = async function onVoiceStateUpdate(client, oldState, newState) {
	const member = newState.member;
	if (oldState.channel && oldState.channel.parent.id == constants.channels.category.dedicated_voice) {
		const text_channel = client.channel(constants.channels.category.dedicated).children.find(channel => channel.type == 'text' && channel.topic && parseMention(channel.topic.split(' ')[0]) == oldState.channelID);
		const linked_data = text_channel.topic.split(' ');
		const team_role = client.role(linked_data[1]);

		if (oldState.channel.members.size > 0 && !(oldState.channel.members.size == 1 && oldState.channel.members.first().user.bot)) {
			client.role_manager.remove(member, team_role);
			const embed = new MessageEmbed();
			embed.setAuthor('Quarantine Gaming: Dedicated Channels');
			embed.setTitle(oldState.channel.name);
			embed.setDescription(`${oldState.member} left this channel.`);
			embed.setThumbnail(member.user.displayAvatarURL());
			embed.setFooter(`${member.user.tag} (${member.user.id})`);
			embed.setTimestamp();
			embed.setColor('#7b00ff');
			client.message_manager.sendToChannel(text_channel, embed);
		}
		else {
			await client.role_manager.delete(team_role);
			await client.channel_manager.delete(oldState.channel);
			await client.channel_manager.delete(text_channel);
		}
	}

	if (newState.channel) {
		// Check if members are streaming
		const streamers = new Array();
		for (const this_member of newState.channel.members.array()) {
			if (member.user.id != this_member.user.id && this_member.roles.cache.has(constants.roles.streaming)) {
				streamers.push(this_member);
			}
		}
		// Notify member
		if (streamers.length > 0) {
			const embed = new MessageEmbed();
			embed.setAuthor('Quarantine Gaming: Information');
			embed.setTitle(`${streamers.length > 1 ? `${streamers.map(this_member => this_member.displayName).join(' and ')} are` : `${streamers.map(this_member => this_member.displayName)} is`} currently Streaming`);
			embed.setDescription('Please observe proper behavior on your current voice channel.');
			embed.setImage('https://pa1.narvii.com/6771/d33918fa87ad0d84b7dc854dcbf6a8545c73f94d_hq.gif');
			embed.setColor('#5dff00');
			client.message_manager.sendToUser(member, embed);
		}

		if (newState.channel.parent.id == constants.channels.category.dedicated_voice) {
			const text_channel = client.channel(constants.channels.category.dedicated).children.find(channel => channel.topic && parseMention(channel.topic.split(' ')[0]) == newState.channelID);
			const linked_data = text_channel.topic.split(' ');
			const team_role = client.role(linked_data[1]);

			// Add Text Role
			if (!member.roles.cache.has(team_role.id)) {
				const embed = new MessageEmbed();
				embed.setAuthor('Quarantine Gaming: Dedicated Channels');
				embed.setTitle(newState.channel.name);
				embed.setDescription(`${newState.member} joined this channel.`);
				embed.setThumbnail(newState.member.user.displayAvatarURL());
				embed.setFooter(`${newState.member.user.tag} (${newState.member.user.id})`);
				embed.setTimestamp();
				embed.setColor('#7b00ff');
				client.message_manager.sendToChannel(text_channel, embed);
				client.role_manager.add(member, team_role);
			}
		}
		else if (newState.channel.parent.id == constants.channels.category.voice && newState.channel.members.array().length >= 5) {
			// Dedicate this channel
			await sleep(5000);
			await client.dedicated_channel_manager.create(newState.channel, newState.channel.members.array()[0].displayName);
		}
	}
	else if (member.roles.cache.has(constants.roles.streaming)) {
		client.role_manager.remove(member, constants.roles.streaming);
	}
};