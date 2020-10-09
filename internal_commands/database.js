const Firebase = require('firebase-admin');

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
const DB = {
    notifications: Firestore.collection('notifications')
};

let notifications = new Array(), index = 0;

function trimNotif() {
    // Remove all the expired notifications
    while (notifications.length > 5) {
        // Remove the first notification from the local array and store it in a variable
        let expired_notif = notifications.shift();
        // Remove the notification from the online database
        DB.notifications.doc(expired_notif.id).delete();
    }
}

const init = async function () {
    const o_notifs = await DB.notifications.orderBy('index').get();
    for (let o_notif of o_notifs.docs) {
        const data = o_notif.data();
        const this_notif = {
            id: o_notif.id,
            title: data.title,
            url: data.url,
            author: data.author,
            permalink: data.permalink
        };

        if (data.index > index) index = data.index;
        notifications.push(this_notif);
    }

    trimNotif();
}

// Notification Region
const pushNotification = async function (notification) {
    notifications.push(notification);

    DB.notifications.doc(notification.id).set({
        title: notification.title,
        url: notification.link,
        author: notification.author,
        permalink: notification.permalink,
        index: ++index
    });

    trimNotif();
}

const hasRecords = function (notification) {
    let similarity_threshold = 70;
    for (let this_notification of notifications) {
        let this_similarity = g_functions.string_similarity(this_notification.url, notification.url);
        if (this_similarity >= similarity_threshold) {
            return this_notification;
        }
    }
    return false;
}

// Database Module Functions
module.exports = {
    init,
    pushNotification,
    hasRecords
}