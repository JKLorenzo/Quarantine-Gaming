const Firebase = require('firebase-admin');
const functions = require('./functions.js');
const classes = require('./classes.js');
/** @type {import('./error_manager.js')} */
let error_manager;

const ErrorTicketManager = new classes.ErrorTicketManager('database.js');

/**
 * @type {{FreeGames: Firebase.firestore.CollectionReference, GameOverrides: Firebase.firestore.CollectionReference}}
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
 * Initializes the module and begins to connect to Firebase.
 * @param {Function} ModulesFunction The GlobalModules function.
 */
module.exports.initialize = async (ModulesFunction) => {
    // Link
    const Modules = functions.parseModules(ModulesFunction);
    error_manager = Modules.error_manager;

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