const { MessageEmbed } = require('discord.js');

let guild, r_staff, r_everyone, r_member, r_nsfw, r_dedicated, r_streaming, r_music;

const init = async function () {
    guild = g_client.guilds.cache.get('351178660725915649');
    r_staff = guild.roles.cache.get('749235255944413234');
    r_everyone = guild.roles.cache.get('351178660725915649');
    r_member = guild.roles.cache.get('722699433225224233');
    r_nsfw = guild.roles.cache.get('700481554132107414');
    r_dedicated = guild.roles.cache.get('767344383418433547');
    r_streaming = guild.roles.cache.get('757128062276993115');
    r_music = guild.roles.cache.get('700397445506531358');
}

const get = function () {
    return {
        guild: guild,
        staff: r_staff,
        everyone: r_everyone,
        member: r_member,
        nsfw: r_nsfw,
        dedicated: r_dedicated,
        streaming: r_streaming,
        music: r_music
    }
}

const checkUnlisted = async function () {
    // Check if any member doesnt have member role
    for (let this_member of guild.members.cache.array()) {
        if (!this_member.user.bot && !this_member.roles.cache.find(this_role => this_role == r_member)) {
            // This member doesnt have member role
            let today = new Date();
            let diffMs = (today - this_member.user.createdAt);
            let diffDays = Math.floor(diffMs / 86400000)
            let diffHrs = Math.floor((diffMs % 86400000) / 3600000)
            let diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000);
            let created_on = diffDays + " days " + diffHrs + " hours " + diffMins + " minutes";

            let embed = new MessageEmbed
            embed.setAuthor('Quarantine Gaming: Unlisted Member');
            embed.setTitle('Member Details');
            embed.setThumbnail(this_member.user.displayAvatarURL());
            embed.addFields([
                { name: 'User:', value: this_member },
                { name: 'ID:', value: this_member.id },
                { name: 'Account Created:', value: created_on }
            ]);
            embed.setColor('#ff5f5f');
            await g_channels.get().staff.send({ content: `This user doesn't have a member role. Manual action is required.`, embed: embed });
        }
    }
}

module.exports = {
    init,
    get,
    checkUnlisted
}