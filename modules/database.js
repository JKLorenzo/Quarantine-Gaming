const Firebase = require('firebase-admin');
const functions = require('./functions.js');
/** @type {import('./error_manager.js')} */
let error_manager;

let error_ticket;
let DB = {
    notifications: null,
    titles_blacklisted: null,
    titles_whitelisted: null
};
let index = 0,
    notifications = new Array(),
    blacklisted = new Array(),
    whitelisted = new Array();

module.exports = {
    initialize: async function (t_Modules) {
        // Link
        const Modules = functions.parseModules(t_Modules);
        error_manager = Modules.error_manager;
        error_ticket = error_manager.for('database.js');

        try {
            index = 0;
            notifications = new Array();
            blacklisted = new Array();
            whitelisted = new Array();

            Firebase.initializeApp({
                credential: Firebase.credential.cert({
                    "type": 'service_account',
                    "project_id": 'fg-updates-bot',
                    "private_key_id": '0824c03f15a9b7a42e192200f7fbfeec4e14fe99',
                    "private_key": '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCRTiFNPLZWyXhr\nZGGpHQRks3v3prPIzCzsbOBv5lAym4e+n4RKwGwy9KHJrlg/wgv2OLu8ggJk2el+\nPsmEH+y+WlSnHBODrvlZ9eXJb15XW+e7Sb3DUTehepQ223VcLO74493BStEMUgbc\nQd/MyJsmnhqcsIjsHMw1HDjOKRoFD300MGQauS+5ZIPcTRLTtkIqNVAiME+ICgHE\nRkPlAxKHgWue8dwzDF9VPgLCR2ZpGOF3tZ5VZPRi6VTElxFDsYyA2NwuEyg7Frpq\n0XDBkK0wqRgK3zfmQZzgD/IRUGLHb74HsaNhbu1XPWBsMNai//gKME25P5j/Ciq4\n11SIwyy3AgMBAAECggEAIU938uzoIB0vre7lNI+iYjODR9K/hFjKM6kCCqUR3Ygq\nJlkLStex9jx+mm2NbZBejaOT5jMnuVb7YCWkrNVkwH6UyXp2Psnt/+GPPA574ir/\nhL/y8MO9rRccwzasQOVMI2KZg6ZTJi/nwraXR6r1ZnT4RNNzkC1J4yMFIr3paR87\ndP1EoyGEaZliIz0HDH3d5tmxIoPYN4rf93GJQNhcOsmTei1h4dwQJIqydHVW86Y8\nC6EJUrhTJYW4i4k4KnAwaCyl/yS9zeMhgaHYys29pBaEvWjpf7DipsosC9taj6Ea\n6Sp87x60LUpkuZQW2i4Pq8cF5yPuadtAfQalKWgkgQKBgQDDTSGXueWjgl3KOKRt\nsqYiN5wZowY9SPVUzXhOEKkb7ydHLYF5ALgKvub3wTua3t1DthxPMFFOXgvrd46G\nlJc/sb4tvn6J1bnAeb8M+Q6zMu3QEteaIEtbl4ilqk6xOc/XvAS3ZLCmsmEQ6hkN\niZYkT1Gf4gpvLS7H5DUM4PQxjQKBgQC+dyFyIXiiG80ACRduKxEJyMGy4X/EWkqH\nTTPphULW6pZsWoX+EEkeUtDKIebLqNDAE3AOvXL4HhGERRjWI+s5CX9QLWvGs1HP\nDrs+N6EvZUKgx4qiQuwgtaKDXvlnwX+MsqNGnAil3DqbO1TY8Pr4o9rVZ0L5Dn0m\n+8VpdfaMUwKBgF66jsy1UnlYxn1LtBWxTXvTVVfqByC6vqR/dRcIZb4y5e5UWDSE\n8L/lkMojY/Hen5w0PM78NLO6UjXIK82DTUmLwR8XAvGARTTi2JRGSacJ0OfX+9O6\nTlMC0Tjpvnmf/Pw7Kl557GUuqH43zicO0VCTWJggX8dFNyelvUWd51QRAoGAErFe\ndvUSAdb4p6g8xHM1mOA7InM/NuYlqmHJVoHdrXoYiUnZHLY8dt1p4GyzWgmXc0J1\nHP06618IGRMu/NVJoK9t71CF41p2DPxFJDYRe7VUdLMgyAwJYKxy5rHLiINVIVnm\n7Gcj8iNLHTEVgrUj7IMoVwlraUYiwlCzb0ZEjEECgYBgIkcGR4mTltbQUob/EbZq\nXa+oPcy3q9ZaAes8yzPSuCLDw56eOuUuKi2jMnJsVwC+9zH2LPQjkHuzBienyD9H\nOGSsoqEmxwr5O16djfjk5EE2GZMvuPwf3kOuS/QR3+PeNfCjGbaksb4D9hWxiQIJ\n4NytO5rR6XWNNqIJ0C8SZQ==\n-----END PRIVATE KEY-----\n',
                    "client_email": 'firebase-adminsdk-rxhqf@fg-updates-bot.iam.gserviceaccount.com',
                    "client_id": '116447630978026448805',
                    "auth_uri": 'https://accounts.google.com/o/oauth2/auth',
                    "token_uri": 'https://oauth2.googleapis.com/token',
                    "auth_provider_x509_cert_url": 'https://www.googleapis.com/oauth2/v1/certs',
                    "client_x509_cert_url": 'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-rxhqf%40fg-updates-bot.iam.gserviceaccount.com'
                })
            });

            const Firestore = Firebase.firestore();

            DB = {
                notifications: Firestore.collection('notifications'),
                titles_blacklisted: Firestore.collection('t_blacklisted'),
                titles_whitelisted: Firestore.collection('t_whitelisted')
            };

            const firebase_notifications = await DB.notifications.orderBy('index').get();
            for (let firebase_notification of firebase_notifications.docs) {
                const data = firebase_notification.data();
                if (data.index > index) index = data.index;
                notifications.push({
                    id: firebase_notification.id,
                    title: data.title,
                    url: data.url,
                    author: data.author,
                    permalink: data.permalink
                });
            }

            await this.notificationTrim();

            const firebase_blacklisted = await DB.titles_blacklisted.get();
            for (let title of firebase_blacklisted.docs) {
                blacklisted.push(title.id);
            }

            const firebase_whitelisted = await DB.titles_whitelisted.get();
            for (let title of firebase_whitelisted.docs) {
                whitelisted.push(title.id);
            }
        } catch (error) {
            error_manager.mark(new error_ticket('initialize', error))
        }
    },
    notificationTrim: async function () {
        while (notifications.length > 5) {
            try {
                const expired_notif = notifications.shift();
                await DB.notifications.doc(expired_notif.id).delete();
            } catch (error) {
                error_manager.mark(new error_ticket('notificationTrim', error));
            }
        }
    },
    notificationPush: async function (notification) {
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
            error_manager.mark(new error_ticket('notificationPush', error));
        }
    },
    notificationRecords: function (notification) {
        try {
            const similarity_threshold = 70;
            for (const this_notification of notifications) {
                const this_similarity = functions.compareString(this_notification.title, notification.title);
                if (this_similarity >= similarity_threshold || this_notification.url.trim().toLowerCase() == notification.url.trim().toLowerCase()) {
                    return this_notification;
                }
            }
            return false;
        } catch (error) {
            error_manager.mark(new error_ticket('notificationRecords', error));
        }
    },
    gameTitles: function () {
        return {
            blacklisted: blacklisted,
            whitelisted: whitelisted
        }
    },
    gameBlacklist: async function (title) {
        try {
            title = title.toLowerCase();
            let updated = false;
            if (!blacklisted.includes(title)) {
                blacklisted.push(title);
                await DB.titles_blacklisted.doc(title).set({});
                updated = true;
            }

            let index = whitelisted.indexOf(title);
            if (index + 1) {
                whitelisted.splice(index, 1);
                await DB.titles_whitelisted.doc(title).delete();
                updated = true;
            }
            return updated;
        } catch (error) {
            error_manager.mark(new error_ticket('gameBlacklist', error));
        }
    },
    gameWhitelist: async function (title) {
        try {
            title = title.toLowerCase();
            let updated = false;
            if (!whitelisted.includes(title)) {
                whitelisted.push(title);
                await DB.titles_whitelisted.doc(title).set({});
                updated = true;
            }

            let index = blacklisted.indexOf(title);
            if (index + 1) {
                blacklisted.splice(index, 1);
                await DB.titles_blacklisted.doc(title).delete();
                updated = true;
            }
            return updated;
        } catch (error) {
            error_manager.mark(new error_ticket('gameWhitelist', error));
        }
    }
}