odoo.define('pos_retail.pos_backend', function (require) {
    "use strict";

    var bus = require('bus.bus').bus;
    var WebClient = require('web.WebClient');
    var core = require('web.core');
    var _t = core._t;
    // v11, 10 have not, dont merge
    // var CrossTabBus = require('bus.CrossTab');
    // CrossTabBus.include({
    //     _onPoll: function (notifications) {
    //         try {
    //             return this._super.apply(this, arguments);
    //         } catch (e) {
    //
    //         }
    //     }
    // });

    var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;

    if (!indexedDB) {
        window.alert("Your browser doesn't support a stable version of IndexedDB.")
    }
    WebClient.include({
        init_db: function (table_name, sequence) {
            var status = new $.Deferred();
            var session = this.getSession();
            var db = session.db
            var request = indexedDB.open(db + '_' + sequence, 1);
            request.onerror = function (ev) {
                status.reject(ev);
            };
            request.onupgradeneeded = function (ev) {
                var db = ev.target.result;
                db.createObjectStore('product.pricelist.item', {keyPath: "id"});
                var os_product = db.createObjectStore('product.product', {keyPath: "id"});
                os_product.createIndex('bc_index', 'barcode', {unique: false})
                os_product.createIndex('dc_index', 'default_code', {unique: false})
                os_product.createIndex('name_index', 'name', {unique: false})
                db.createObjectStore('res.partner', {keyPath: "id"});
                db.createObjectStore('account.invoice', {keyPath: "id"});
                db.createObjectStore('account.invoice.line', {keyPath: "id"});
                db.createObjectStore('pos.category', {keyPath: "id"});
                db.createObjectStore('pos.order', {keyPath: "id"});
                db.createObjectStore('pos.order.line', {keyPath: "id"});
                db.createObjectStore('sale.order', {keyPath: "id"});
                db.createObjectStore('sale.order.line', {keyPath: "id"});
            };
            request.onsuccess = function (ev) {
                var db = ev.target.result;
                var transaction = db.transaction([table_name], "readwrite");
                transaction.oncomplete = function () {
                    db.close();
                };
                if (!transaction) {
                    status.reject(new Error('Cannot create transaction with ' + table_name));
                }
                var store = transaction.objectStore(table_name);
                if (!store) {
                    status.reject(new Error('Cannot get object store with ' + table_name));
                }
                status.resolve(store);
            };
            return status.promise();
        },
        write: function (table_name, items) {
            var max_id = items[items.length - 1]['id'];
            var sequence = Math.floor(max_id / 100000);
            var log = 'Caching : ' + table_name + ' to table index: ' + sequence + ' with MAX ID: ' + max_id;
            console.log(log);
            $.when(this.init_db(table_name, sequence)).done(function (store) {
                _.each(items, function (item) {
                    var request = store.put(item);
                    request.onerror = function (e) {
                        alert(e);
                        console.warn(e)
                    };
                    request.onsuccess = function (ev) {
                        alert('insert done');
                    };
                });
            }).fail(function (error) {
                console.log(error);
            });
        },
        remove_indexed_db: function (notifications) {
            var dbName = JSON.parse(notifications).db;
            for (var i = 0; i <= 50; i++) {
                indexedDB.deleteDatabase(dbName + '_' + i);
            }
            this.do_notify(_t('POS database deleted'),
                _t('We start pos session for installing again now'));
        },
        show_application: function () {
            bus.on('notification', this, function (notifications) { // v10 and v11 dont merge
                _.each(notifications, (function (notification) {
                    if (notification[0][1] === 'pos.indexed_db') {
                        this.remove_indexed_db(notification[1]);
                    }
                }).bind(this));
                _.each(notifications, (function (notification) {
                    if (notification[0][1] === 'pos.install.database') {
                        var message = JSON.parse(notification[1]);
                        var table = message['table'];
                        var items = message['items'];
                        if (typeof items == "string") {
                            items = JSON.parse(items);
                        }
                        this.write(table, items);
                    }
                }).bind(this));
            });
            return this._super.apply(this, arguments);
        }
    });
});
