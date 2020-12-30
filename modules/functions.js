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
    compareArray: function (array1, array2) {
        let a = [], difference = [];
        for (let i = 0; i < array1.length; i++) {
            a[array1[i]] = true;
        }
        for (let i = 0; i < array2.length; i++) {
            if (a[array2[i]]) {
                delete a[array2[i]];
            } else {
                a[array2[i]] = true;
            }
        }
        for (let k in a) {
            difference.push(k);
        }
        return difference;
    },
    toAlphanumericString: function (string) {
        return String(string).replace(/[^a-z0-9]/gi, '')
    }
}