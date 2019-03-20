"use strict";
odoo.define('pos_retail.backup_orders', function (require) {

    var PosBaseWidget = require('point_of_sale.BaseWidget');
    var chrome = require('point_of_sale.chrome');
    var PopupWidget = require('point_of_sale.popups');
    var gui = require('point_of_sale.gui');
    var core = require('web.core');
    var _t = core._t;
    var rpc = require('pos.rpc');

    var BackUpOrdersWidget = PosBaseWidget.extend({
        template: 'BackUpOrdersWidget',
        init: function (parent, options) {
            options = options || {};
            this._super(parent, options);
            this.action = options.action;
            this.label = options.label;
        },
        renderElement: function () {
            var self = this;
            this._super();
            this.$el.click(function () {
                self.pos.gui.show_popup('popup_backup_orders', {})
            });
        },
        show: function () {
            this.$el.removeClass('oe_hidden');
        },
        hide: function () {
            this.$el.addClass('oe_hidden');
        }
    });
    chrome.Chrome.include({
        build_widgets: function () {
            this.widgets = _.filter(this.widgets, function (widget) {
                return widget['name'] != 'BackUpOrdersWidget';
            });
            if (this.pos.config.backup) {
                this.widgets.push(
                    {
                        'name': 'backup_order_widget',
                        'widget': BackUpOrdersWidget,
                        'append': '.pos-rightheader'
                    }
                );
            }
            this._super();
        }
    });
    var popup_backup_orders = PopupWidget.extend({
        template: 'popup_backup_orders',
        show: function (options) {
            var self = this;
            this._super(options);
            this.$('.backup_orders_viva_file').click(function () {
                return self.gui.prepare_download_link(
                    self.pos.export_unpaid_orders(),
                    _t("unpaid orders") + ' ' + moment().format('YYYY-MM-DD-HH-mm-ss') + '.json',
                    ".backup_orders_viva_file", ".download_backup_orders"
                );
            });
            this.$('.restore_orders input').on('change', function (event) {
                var file = event.target.files[0];
                if (file) {
                    var reader = new FileReader();
                    reader.onload = function (event) {
                        var report = self.pos.import_orders(event.target.result);
                        self.gui.show_popup('orderimport', {report: report});
                    };
                    reader.readAsText(file);
                }
            });
            this.$('.backup_orders_viva_backend').click(function () {
                return rpc.query({
                    model: 'pos.config',
                    method: 'write',
                    args: [[parseInt(self.pos.config.id)], {
                        backup_orders: self.pos.export_unpaid_orders()
                    }]
                }).then(function (result) {
                    if (result == true) {
                        self.pos.gui.show_popup('confirm', {
                            title: 'Saved',
                            body: 'Product saved'
                        })
                    }
                }, function (type, err) {
                    self.pos.gui.show_popup('confirm', {
                        title: 'Error',
                        body: 'Odoo connection fail, could not save'
                    })
                });
            });
            this.$('.restore_orders_viva_backend').click(function () {
                return rpc.query({
                    model: 'pos.config',
                    method: 'search_read',
                    domain: [['id', '=', self.pos.config.id]],
                    fields: ['backup_orders']
                }).then(function (results) {
                    if (results[0] && results[0]['backup_orders'] != '') {
                        var report = self.pos.import_orders(results[0]['backup_orders']);
                        return self.gui.show_popup('orderimport', {report: report});
                    } else {
                        self.pos.gui.show_popup('confirm', {
                            title: 'Warning',
                            body: 'Nothing order restore'
                        })
                    }
                }, function (type, err) {
                    self.pos.gui.show_popup('confirm', {
                        title: 'Error',
                        body: 'Odoo connection fail, could not save'
                    })
                });
            });

            this.$('.close').click(function () {
                self.pos.gui.close_popup();
            });
        }
    });
    gui.define_popup({name: 'popup_backup_orders', widget: popup_backup_orders});
});

