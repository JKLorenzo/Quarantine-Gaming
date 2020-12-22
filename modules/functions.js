
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function createStructure(names) {
    var names = names.split(' ');
    var count = names.length;
    function constructor() {
        for (var i = 0; i < count; i++) {
            this[names[i]] = arguments[i];
        }
    }
    return constructor;
}

function createManager(timeout) {
    const ProcessManager = {
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
    }
    return ProcessManager;
}

function compareDate(date) {
    const today = new Date();
    const diffMs = (today - date);
    return {
        days: Math.floor(diffMs / 86400000),
        hours: Math.floor((diffMs % 86400000) / 3600000),
        minutes: Math.round(((diffMs % 86400000) % 3600000) / 60000)
    };
}

module.exports = {
    sleep,
    createStructure,
    createManager,
    compareDate
}