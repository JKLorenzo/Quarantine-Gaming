module.exports = {
    sleep: function (ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    createStructure: function (properties) {
        const property = properties.split(' ');
        const count = properties.length;
        function constructor() {
            for (let i = 0; i < count; i++) {
                this[property[i]] = arguments[i];
            }
        }
        return constructor;
    },
    createManager: function (timeout) {
        return {
            processID: 0,
            currentID: 0,

            queue: function () {
                const id = this.processID++;
                return new Promise(async resolve => {
                    while (id != this.currentID) await sleep(1000);
                    resolve();
                });
            },
            finish: function () {
                setTimeout(() => {
                    this.currentID++;
                }, timeout);
            }
        };
    },
    compareDate: function (date) {
        const today = new Date();
        const diffMs = (today - date);
        return {
            days: Math.floor(diffMs / 86400000),
            hours: Math.floor((diffMs % 86400000) / 3600000),
            minutes: Math.round(((diffMs % 86400000) % 3600000) / 60000)
        };
    },
    toAlphanumericString: function (string) {
        return String(string).replace(/[^a-z0-9]/gi, '')
    }
}