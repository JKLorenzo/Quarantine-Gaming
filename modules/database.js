const Discord = require('discord.js');
const Firebase = require('firebase-admin');
const functions = require('./functions.js');
const classes = require('./classes.js');
/** @type {import('./error_manager.js')} */
let error_manager;

const ErrorTicketManager = new classes.ErrorTicketManager('database.js');
const ExpiredGameRoleManager = new classes.ProcessQueue(2500);
const GameRoleSetManager = new classes.ProcessQueue(2500);
const GameRoleDeleteManager = new classes.ProcessQueue(2500);

/**
 * @type {{FreeGames: Firebase.firestore.CollectionReference, GameOverrides: Firebase.firestore.CollectionReference, Members: Firebase.firestore.CollectionReference}}
 */
let DB;

let index = 0;
/** @type {Array<classes.Notification>} */
let notifications = new Array();
/** @type {Array<String>} */
let blacklisted = new Array();
/** @type {Array<String>} */
let whitelisted = new Array();

/**
 * Initializes the module.
 * @param {CommandoClient} ClientInstance The Commando Client instance used to login.
 */
module.exports.initialize = async (ClientInstance) => {
    // Link
    error_manager = ClientInstance.modules.error_manager;

    try {
        index = 0;
        notifications = new Array();
        blacklisted = new Array();
        whitelisted = new Array();

        Firebase.initializeApp({
            credential: Firebase.credential.cert({
                type: process.env.FB_type,
                project_id: process.env.FB_project_id,
                private_key_id: process.env.FB_private_key_id,
                private_key: String(process.env.FB_private_key).replace(/\\n/g, '\n'),
                client_email: process.env.FB_client_email,
                client_id: process.env.FB_client_id,
                auth_uri: process.env.FB_auth_uri,
                token_uri: process.env.FB_token_uri,
                auth_provider_x509_cert_url: process.env.FB_auth_provider_x509_cert_url,
                client_x509_cert_url: process.env.FB_client_x509_cert_url
            })
        });

        const Firestore = Firebase.firestore();

        DB = {
            FreeGames: Firestore.collection('FreeGames'),
            GameOverrides: Firestore.collection('GameOverrides'),
            Members: Firestore.collection('Members')
        };

        const FreeGames = await DB.FreeGames.orderBy('index').get();
        for (const FreeGame of FreeGames.docs) {
            const data = FreeGame.data();
            if (data.index > index) index = data.index;
            notifications.push(new classes.Notification(data.title, data.url, data.author, data.permalink, {
                id: FreeGame.id
            }));
        }

        await this.notificationTrim();

        const GameOverrides = await DB.GameOverrides.get();
        for (const override of GameOverrides.docs) {
            switch (override.data().category) {
                case 'whitelist':
                    whitelisted.push(override.id.trim());
                    break;
                case 'blacklist':
                    blacklisted.push(override.id.trim());
                    break;
            }
        }
    } catch (error) {
        error_manager.mark(ErrorTicketManager.create('initialize', error))
    }
}

/**
 * Gets the list of expired game roles from members.
 * @returns {Promise<Array<{memberID: Discord.UserResolvable, roleID: Discord.RoleResolvable}>>}
 */
module.exports.getExpiredGameRoles = async () => {
    const expired = new Array();
    try {
        const members = await DB.Members.get();
        for (const member of members.docs) {
            await ExpiredGameRoleManager.queue()
            const GameRoles = member.ref.collection('GameRoles');
            const gameroles = await GameRoles.where('lastUpdated', '<=', (new Date()).getTime() - 604800000).get();
            for (const gamerole of gameroles.docs) {
                const lastUpdated = gamerole.data().lastUpdated;
                console.log(functions.compareDate(new Date(lastUpdated)).days)
                // Add to expired array
                expired.push({
                    memberID: member.id,
                    roleID: gamerole.id
                });
            }
            ExpiredGameRoleManager.finish()
        }
    } catch (error) {
        error_manager.mark(ErrorTicketManager.create('getExpiredGameRoles', error));
    }
    return expired;
}

/**
 * Updates the member's game role timestamp.
 * @param {String} memberID The ID of the member.
 * @param {String} roleID The ID of the game role.
 */
module.exports.memberGameRoleSet = async (memberID, roleID) => {
    await GameRoleSetManager.queue();
    try {
        await DB.Members.doc(memberID).collection('GameRoles').doc(roleID).set({
            lastUpdated: (new Date()).getTime()
        });
    } catch (error) {
        error_manager.mark(ErrorTicketManager.create('memberGameRoleSet', error));
    }
    GameRoleSetManager.finish();
}

/**
 * Deletes the game role from this member.
 * @param {String} memberID The ID of the member.
 * @param {String} roleID The ID of the game role.
 */
module.exports.memberGameRoleDelete = async (memberID, roleID) => {
    await GameRoleDeleteManager.queue();
    try {
        await DB.Members.doc(memberID).collection('GameRoles').doc(roleID).delete();
    } catch (error) {
        error_manager.mark(ErrorTicketManager.create('memberGameRoleDelete', error));
    }
    GameRoleDeleteManager.finish();
}

/**
 * Trims the free games database notifications list to a maximum of 5 items.
 */
module.exports.notificationTrim = async () => {
    while (notifications.length > 5) {
        try {
            const expired_notif = notifications.shift();
            await DB.FreeGames.doc(expired_notif.id).delete();
        } catch (error) {
            error_manager.mark(ErrorTicketManager.create('notificationTrim', error));
        }
    }
}

/**
 * Pushes this notification to the database.
 * @param {classes.Notification} notification 
 */
module.exports.notificationPush = async (notification) => {
    try {
        notifications.push(notification);

        await DB.notifications.doc(notification.id).set({
            title: notification.title,
            url: notification.url,
            author: notification.author,
            permalink: notification.permalink,
            index: ++index
        });

        await this.notificationTrim();
    } catch (error) {
        error_manager.mark(ErrorTicketManager.create('notificationPush', error));
    }
}

/**
 * Checks if this notification is in the database.
 * @param {classes.Notification} notification The notification to check.
 */
module.exports.notificationRecords = (notification) => {
    try {
        const similarity_threshold = 70;
        for (const this_notification of notifications) {
            const this_similarity = functions.compareString(this_notification.title, notification.title);
            if (this_similarity >= similarity_threshold || this_notification.url.trim().toLowerCase() == notification.url.trim().toLowerCase()) {
                return this_notification;
            }
        }
        return null;
    } catch (error) {
        error_manager.mark(ErrorTicketManager.create('notificationRecords', error));
    }
}

/**
 * Checks if this game title is whitelisted.
 * @param {String} title The title of the game.
 */
module.exports.gameWhitelisted = (title) => {
    return whitelisted.includes(title.toLowerCase().trim());
}

/**
 * Checks if this game title is blacklisted.
 * @param {String} title The title of the game.
 */
module.exports.gameBlacklisted = (title) => {
    return blacklisted.includes(title.toLowerCase().trim());
}

/**
 * Blacklists a game.
 * @param {String} title The title of the game.
 */
module.exports.gameBlacklist = async (title) => {
    try {
        title = title.toLowerCase();
        let updated = false;
        if (!blacklisted.includes(title)) {
            blacklisted.push(title);
            await DB.GameOverrides.doc(title).set({
                category: 'blacklist'
            });
            updated = true;
        }
        const index = whitelisted.indexOf(title);
        if (index + 1) whitelisted.splice(index, 1);
        return updated;
    } catch (error) {
        error_manager.mark(ErrorTicketManager.create('gameBlacklist', error));
    }
}

/**
 * Whitelists a game.
 * @param {String} title The title of the game.
 */
module.exports.gameWhitelist = async (title) => {
    try {
        title = title.toLowerCase();
        let updated = false;
        if (!whitelisted.includes(title)) {
            whitelisted.push(title);
            await DB.GameOverrides.doc(title).set({
                category: 'whitelist'
            });
            updated = true;
        }
        const index = blacklisted.indexOf(title);
        if (index + 1) blacklisted.splice(index, 1);
        return updated;
    } catch (error) {
        error_manager.mark(ErrorTicketManager.create('gameWhitelist', error));
    }
}