const functions = require('./functions.js');
let app = require('./app.js');

const RoleCreateManager = functions.createManager(1000);
const RoleDeleteManager = functions.createManager(5000);
const RoleAddManager = functions.createManager(1000);
const RoleRemoveManager = functions.createManager(1000);

module.exports = {
    initialize: function (t_Modules) {
        // Link
        const Modules = functions.parseModules(t_Modules);
        app = Modules.app;
    },
    create: function (options = {
        name: null,
        color: null,
        hoist: null,
        mentionable: null,
        permissions: null,
        position: null,
        reason: null
    }) {
        return new Promise(async (resolve, reject) => {
            await RoleCreateManager.queue();
            let output, error;
            try {
                output = await app.guild().roles.create({
                    data: {
                        name: options.name,
                        color: options.color,
                        hoist: options.hoist,
                        mentionable: options.mentionable,
                        permissions: options.permissions,
                        position: options.position,
                    },
                    reason: options.reason
                });
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