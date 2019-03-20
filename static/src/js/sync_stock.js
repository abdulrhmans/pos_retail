odoo.define('pos_retail.sync_stock', function (require) {
    var models = require('point_of_sale.models');
    var exports = {};
    var Backbone = window.Backbone;
    var bus = require('bus.bus');
    var base = require('pos_retail.base');

    exports.sync_stock = Backbone.Model.extend({ // chanel 2: pos sync backend
        initialize: function (pos) {
            this.pos = pos;
        },
        start: function () {
            this.bus = bus.bus;
            this.bus.last = this.pos.db.load('bus_last', 0);
            this.bus.on("notification", this, this.on_notification);
            this.bus.start_polling();
        },
        on_notification: function (notifications) {
            if (notifications && notifications[0] && notifications[0][1]) {
                for (var i = 0; i < notifications.length; i++) {
                    var channel = notifications[i][0][1];
                    if (channel == 'pos.sync.stock') {
                        this.sync_stock(notifications[i][1]);
                    }
                }
            }
        },
        sync_stock: function (product_ids) {
            var location = this.pos.get_location();
            if (location) {
                this.pos._do_update_quantity_onhand(location.id, product_ids);
            }
        }
    });

    var _super_posmodel = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({
        load_server_data: function () {
            var self = this;
            return _super_posmodel.load_server_data.apply(this, arguments).then(function () {
                self.sync_stock = new exports.sync_stock(self);
                self.sync_stock.start();
            })
        },
        sync_stock: function (product_ids) {
            var location = this.get_location();
            if (location) {
                this._do_update_quantity_onhand(location.id, product_ids);
            }
        }
    });

    return exports;
});
