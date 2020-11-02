
let guild, r_everyone, r_member, r_nsfw, r_dedicated, r_streaming, r_music;

const init = async function () {
    guild = g_client.guilds.cache.get('351178660725915649');
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
        everyone: r_everyone,
        member: r_member,
        nsfw: r_nsfw,
        dedicated: r_dedicated,
        streaming: r_streaming,
        music: r_music
    }
}

module.exports = {
    init,
    get
}