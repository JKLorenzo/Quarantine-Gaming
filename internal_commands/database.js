let notifications = new Array();

// Notification Region
const pushNotification = async function (notification) {
    notifications.push(notification);
}

const hasRecords = function (notification) {
    try {
        let similarity_threshold = 70, highest_similarity = 0;
        for (let this_notification of notifications) {
            let this_similarity = g_functions.string_similarity(this_notification.title, notification.title);
            if (this_similarity >= similarity_threshold) {
                return true;
            } else if (this_similarity >= highest_similarity) {
                highest_similarity = this_similarity;
            }
        }
        return highest_similarity >= similarity_threshold;
    } catch (error) {
        g_interface.on_error({
            name: 'hasRecords',
            location: 'database.js',
            error: error
        });
    }
}

// Database Module Functions
module.exports = {
    pushNotification,
    hasRecords
}