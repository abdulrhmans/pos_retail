odoo.define('pos_retail.dexie', function (require) {
    "use strict";
    var dexie = {
        init: function () {
            var db = new Dexie('dexie');
            db.version(1).stores({
                'product.pricelist.item': '++id',
                'product.product': '++id',
                'res.partner': '++id',
                'account.invoice': '++id',
                'account.invoice.line': '++id',
                'pos.order': '++id',
                'pos.order.line': '++id',
                'sale.order': '++id',
                'sale.order.line': '++id'
            });
            return db;
        },
        create: function (table, values, sequence) {
            var db = this.init(sequence);
            db[table].bulkPut(values).then(function (lastKey) {
                console.log('push to dexie done')
            }).catch(Dexie.BulkError, function (e) {
                console.error("Some raindrops did not succeed");
            });
        },
        search_read: function (table) {
            var done = new $.Deferred();
            var db = this.init();
            db[table].toArray().then(function (result) {
                done.resolve(result)
            }).catch(function (error) {
                done.reject(error)
            });
            return done.promise();
        },
        search_read_example: function () {
            var done = new $.Deferred();
            var db = new Dexie("test");
            db.version(1).stores({
                raindrops: '++id',
            });
            db.raindrops.toArray().then(function (result) {
                done.resolve(result)
            }).catch(function (error) {
                done.reject(error)
            });
            return done.promise();
        },
        example: function () {
            var db = new Dexie("test");
            db.version(1).stores({
                raindrops: 'id,position'
            });
            var drops = [];
            for (var i = 0; i < 1000000; ++i) {
                drops.push({id: i, position: [Math.random(), Math.random(), Math.random()]})
            }
            db.raindrops.bulkPut(drops).then(function (lastKey) {
                console.log("Done putting 100,000 raindrops all over the place");
                console.log("Last raindrop's id was: " + lastKey); // Will be 100000.
            }).catch(Dexie.BulkError, function (e) {
                // Explicitely catching the bulkAdd() operation makes those successful
                // additions commit despite that there were errors.
                console.error("Some raindrops did not succeed. However, " +
                    100000 - e.failures.length + " raindrops was added successfully");
            });
        },
        test: function () {
            var db = new Dexie("raindrops");
            db.version(1).stores({
                raindrops: 'id,position'
            });
            var drops = [];
            for (var i = 1; i <= 1000000; ++i) {
                drops.push({
                    id: i,
                    position: Math.random(),
                    someData: {
                        someText: "some value",
                        someNumber: Math.random()
                    }
                });
            }
            db.open();
            db.raindrops.bulkPut(drops).then(function (lastKey) {
                console.log('push 1.000.000 to dexie done')
            }).catch(Dexie.BulkError, function (e) {
                console.error("Some raindrops did not succeed");
            });
        }
    };
    return dexie;
});
