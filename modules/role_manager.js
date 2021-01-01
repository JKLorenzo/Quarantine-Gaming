const app = require('./app.js');
const functions = require('./functions.js');

const RoleCreateManager = functions.createManager(1000);
const RoleDeleteManager = functions.createManager(5000);
const RoleAddManager = functions.createManager(1000);
const RoleRemoveManager = functions.createManager(1000);

module.exports = {
    create: function (options = {
        name: null,
        color: null,
        hoist: null,
        mentionable: null,
        permissions: null,
        position: null,
        reason: null,

        get: function () {
            const options = null;
            if (this.name !== null) options.data.name = this.name;
            if (this.color !== null) options.data.color = this.color;
            if (this.hoist !== null) options.data.hoist = this.hoist;
            if (this.mentionable !== null) options.data.mentionable = this.mentionable;
            if (this.permissions !== null) options.data.permissions = this.permissions;
            if (this.position !== null) options.data.position = this.position;
            if (this.reason !== null) options.reason = this.reason;
            return options;
        }
    }) {
        return new Promise(async (resolve, reject) => {
            await RoleCreateManager.queue();
            let output, error;
            try {
                output = await app.guild().roles.create(options.get());
            } catch (err) {
                error = err;
            }
            RoleCreateManager.finish();
            error ? reject(error) : resolve(output)
        });
    },
    delete: function (role) {
        return new Promise(async (resolve, reject) => {
            await RoleDeleteManager.queue();
            let output, error = '';
            try {
                output = await app.role(role).delete();
            } catch (err) {
                error = err;
            }
            RoleDeleteManager.finish();
            error ? reject(error) : resolve(output)
        })
    },
    add: function (user, role) {
        return new Promise(async (resolve, reject) => {
            await RoleAddManager.queue();
            let output, error;
            try {
                output = await app.member(user).roles.add(app.role(role));
            } catch (err) {
                error = err;
            }
            RoleAddManager.finish();
            error ? reject(error) : resolve(output)
        });
    },
    remove: function (user, role) {
        return new Promise(async (resolve, reject) => {
            await RoleRemoveManager.queue();
            let output, error;
            try {
                output = await app.member(user).roles.remove(app.role(role));
            } catch (err) {
                error = err;
            }
            RoleRemoveManager.finish();
            error ? reject(error) : resolve(output)
        });
    }
}