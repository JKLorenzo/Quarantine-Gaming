import { Collection, MessageEmbed } from 'discord.js';
import { ErrorTicketManager, ProcessQueue, compareDate, constants } from '../utils/Base.js';

/**
 * @typedef {import('discord.js').Invite} Invite
 * @typedef {import('discord.js').Collection} Collection
 * @typedef {import('discord.js').GuildMember} GuildMember
 * @typedef {import('../structures/Base').Client} Client
 */

const ETM = new ErrorTicketManager('Gateway Manager');

export default class GatewayManager {
	/** @param {Client} client */
	constructor(client) {
		this.client = client;
		this.queuer = new ProcessQueue(1000);

		/** @type {Collection<String, Invite>} */
		this.data = new Collection();

		client.on('inviteCreate', async invite => {
			if (invite.guild.id !== constants.qg.guild) return;
			try {
				this.invites.set(invite.code, invite);

				const expire_date = invite.expiresAt;
				const expire_date_formatted = expire_date.toString().split('GMT')[0];
				const expire_date_difference = compareDate(expire_date);

				const description = [`**By:** ${invite.inviter}`];
				if (invite.targetUser) description.push(`**Target User:** ${invite.targetUser}`);
				if (invite.memberCount) description.push(`**Target Guild Member Count:** ${invite.memberCount}`);
				if (typeof invite.maxUses === 'number') description.push(`**Max Uses:** ${invite.maxUses ? invite.maxUses : 'Infinite'}`);
				if (invite.expiresAt) description.push(`**Expires:** ${expire_date_formatted} (${expire_date_difference.estimate})`);

				await client.message_manager.sendToChannel(constants.cs.channels.gateway_events, new MessageEmbed({
					author: { name: 'Quarantine Gaming: Server Gateway' },
					title: 'Invite Created',
					description: description.join('\n'),
					thumbnail: { url: invite.inviter.displayAvatarURL() },
					footer: { text: `Reference ID: ${invite.code}` },
					color: '#25c081',
				}));
			} catch (error) {
				this.client.error_manager.mark(ETM.create('inviteCreate', error));
			}
		});

		client.on('inviteDelete', async invite => {
			if (invite.guild.id !== constants.qg.guild) return;
			try {
				invite = this.invites.get(invite.code);

				const expire_date = invite.expiresAt;
				const expire_date_formatted = expire_date.toString().split('GMT')[0];
				const expire_date_difference = compareDate(expire_date);

				const description = [`**By:** ${invite.inviter}`];
				if (invite.targetUser) description.push(`**Target User:** ${invite.targetUser}`);
				if (invite.memberCount) description.push(`**Target Guild Member Count:** ${invite.memberCount}`);
				if (typeof invite.maxUses === 'number') description.push(`**Max Uses:** ${invite.maxUses ? invite.maxUses : 'Infinite'}`);
				if (invite.expiresAt) description.push(`**Expires:** ${expire_date_formatted} (${expire_date_difference.estimate})`);

				await client.message_manager.sendToChannel(constants.cs.channels.gateway_events, new MessageEmbed({
					author: { name: 'Quarantine Gaming: Server Gateway' },
					title: 'Invite Deleted',
					description: description.join('\n'),
					thumbnail: { url: invite.inviter.displayAvatarURL() },
					footer: { text: `Reference ID: ${invite.code}` },
					color: '#25c081',
				}));

				this.invites.delete(invite.code);
			} catch (error) {
				this.client.error_manager.mark(ETM.create('inviteDelete', error));
			}
		});

		client.on('guildMemberAdd', async member => {
			if (member.guild.id !== constants.qg.guild) return;
			try {
				let invite_used = null;
				const current_invites = await client.qg.fetchInvites();
				const diff = current_invites.difference(this.invites).filter(i => i.expiresTimestamp > Date.now() && i.maxUses == 1);
				if (diff.size == 1) {
					invite_used = diff.first();
				} else {
					for (const current_invite of current_invites.array()) {
						const this_invite = this.invites.get(current_invite.code);
						if (!this_invite || (this_invite && Date.now() > this_invite.expiresTimestamp)) continue;
						if (current_invite.uses <= this_invite.uses) continue;
						invite_used = current_invite;
						break;
					}
				}
				this.ScreenMember(member, invite_used);

				const created_day = member.user.createdAt;
				const created_day_formatted = created_day.toString().split('GMT')[0];
				const created_day_difference = compareDate(created_day);

				await client.message_manager.sendToChannel(constants.cs.channels.gateway_events, new MessageEmbed({
					author: { name: 'Quarantine Gaming: Server Gateway' },
					title: 'Member Join',
					description: [
						`**Profile:** ${member}`,
						`**Created:** ${created_day_formatted} (${created_day_difference.estimate})`,
					].join('\n'),
					thumbnail: { url: member.user.displayAvatarURL() },
					footer: { text: `Reference ID: ${member.user.id}` },
					color: '#2255FF',
				}));
			} catch (error) {
				this.client.error_manager.mark(ETM.create('guildMemberAdd', error));
			}
		});

		client.on('guildMemberUpdate', async (oldMember, newMember) => {
			if (newMember.guild.id !== constants.qg.guild) return;
			try {
				if (newMember.pending || oldMember.pending === newMember.pending) return;

				/** @type {TextChannel} */
				const management_channel = client.channel(constants.cs.channels.gateway);
				const messages = await management_channel.messages.fetch();
				const member_approval_requests = messages.filter(message => message.embeds.length && message.embeds[0].title == 'Member Approval Request');
				const this_member_approval_request = member_approval_requests.find(message => {
					const member = client.member(message.embeds[0].fields[0].value);
					if (member) return member.id == newMember.id && message.embeds[0].fields[3].value == 'Pending';
					return false;
				});
				if (this_member_approval_request) {
					if (!newMember.user.bot) {
						client.message_manager.sendToUser(newMember, [
							`Hi ${newMember.user.username}, and welcome to **Quarantine Gaming**!`,
							'Please wait while we are processing your membership approval.',
						].join('\n'));
					}
					const reply_embed = this_member_approval_request.embeds[0];
					reply_embed.fields[3].value = 'Action Required';
					reply_embed.setFooter('✅ - Approve     ❌ - Kick     ⛔ - Ban');
					await this_member_approval_request.edit({
						content:`${newMember} wants to join this server.`,
						embed: reply_embed,
					});
					client.reaction_manager.add(this_member_approval_request, ['✅', '❌', '⛔']);
				}
			} catch (error) {
				this.client.error_manager.mark(ETM.create('guildMemberUpdate', error));
			}
		});

		client.on('guildMemberRemove', async member => {
			if (member.guild.id !== constants.qg.guild) return;
			try {
				const created_day = member.joinedAt;
				const created_day_formatted = created_day.toString().split('GMT')[0];
				const created_day_difference = compareDate(created_day);

				await client.message_manager.sendToChannel(constants.cs.channels.gateway_events, new MessageEmbed({
					author: { name: 'Quarantine Gaming: Server Gateway' },
					title: 'Member Leave',
					description: [
						`**Profile:** ${member}`,
						`**Joined:** ${created_day_formatted} (${created_day_difference.estimate})`,
					].join('\n'),
					thumbnail: { url: member.user.displayAvatarURL() },
					footer: { text: `Reference ID: ${member.user.id}` },
					color: '#FF2277',
				}));
			} catch (error) {
				this.client.error_manager.mark(ETM.create('guildMemberRemove', error));
			}
		});

		client.on('messageReactionAdd', async (reaction, user) => {
			try {
				if (user.bot) return;
				const message = reaction.message.partial ? await reaction.message.fetch() : reaction.message;
				if (message.embeds.length) return;
				const emoji = reaction.emoji.name;
				const embed = message.embeds[0];
				if (!embed || (embed.author?.name !== 'Quarantine Gaming: Server Gateway')) return;
				const member = client.member(user);

				if (member.roles.cache.some(role => [constants.qg.roles.staff, constants.qg.roles.moderator, constants.qg.roles.booster].includes(role.id)) && embed.fields[3].value == 'Action Required') {
					const this_member = client.member(embed.fields[0].value);
					const inviter = client.member(embed.fields[1].value);
					embed.setFooter(new Date());
					if (this_member) {
						switch (emoji) {
						case '✅':
							await message.reactions.removeAll();
							await client.role_manager.add(this_member, constants.qg.roles.member);
							await this.client.database_manager.updateMemberData(this_member.id, {
								inviter: inviter.id,
								moderator: member.id,
							});
							embed.fields[3].value = `Approved by ${user}`;
							await message.edit({ content: '', embed: embed });
							await client.message_manager.sendToUser(this_member, 'Hooraaay! 🥳 Your membership request has been approved! You will now have access to all the features of this server!');
							break;
						case '❌':
							await message.reactions.removeAll();
							await this_member.kick();
							embed.fields[3].value = `Kicked by ${user}`;
							await message.edit({ content: '', embed: embed });
							break;
						case '⛔':
							await message.reactions.removeAll();
							await this_member.ban();
							embed.fields[3].value = `Banned by ${user}`;
							await message.edit({ content: '', embed: embed });
							break;
						}
					} else {
						await message.reactions.removeAll();
						embed.fields[3].value = 'User not found ⚠';
						await message.edit({ content: '', embed: embed });
					}
				}
			} catch (error) {
				this.client.error_manager.mark(ETM.create('messageReactionAdd', error));
			}
		});
	}

	async init() {
		try {
			this.invites = await this.client.qg.fetchInvites();
		} catch (error) {
			this.client.error_manager.mark(ETM.create('init', error));
		}
	}

	/**
	 * @private
	 * @param {GuildMember} member
	 * @param {Invite} invite
	 * @returns
	 */
	async ScreenMember(member, invite) {
		try {
			const created_day = member.user.createdAt;
			const created_day_difference = compareDate(created_day);

			const embed = new MessageEmbed({
				author: { name: 'Quarantine Gaming: Server Gateway Administrative' },
				title: 'Member Approval Request',
				thumbnail: { url: member.user.displayAvatarURL() },
				fields: [
					{ name: 'Profile:', value: member },
					{ name: 'Inviter Profile:', value:  invite ? invite.inviter : 'No information' },
					{ name: 'Account Created:', value: `${created_day.toString().split('GMT')[0]} (${created_day_difference.estimate})` },
					{ name: 'Status:', value: 'Pending' },
				],
				footer: { text: 'Member must complete the membership verfication gate.' },
				color: '#53FF00',
			});

			return await this.client.message_manager.sendToChannel(constants.cs.channels.gateway, embed);
		} catch (error) {
			this.client.error_manager.mark(ETM.create('ScreenMember', error));
		}
	}
}