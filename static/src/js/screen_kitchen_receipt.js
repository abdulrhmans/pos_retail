"use strict";
odoo.define('pos_retail.screen_kitchen_receipt', function (require) {

    var screens = require('point_of_sale.screens');
    var core = require('web.core');
    var gui = require('point_of_sale.gui');
    var qweb = core.qweb;

    var kitchen_receipt_screen = screens.ScreenWidget.extend({
        template: 'kitchen_receipt_screen',
        show: function () {
            this._super();
            var self = this;
            this.render_receipt();
        },
        lock_screen: function (locked) {
            this._locked = locked;
            if (locked) {
                this.$('.next').removeClass('highlight');
            } else {
                this.$('.next').addClass('highlight');
            }
        },
        get_receipt_all_printer_render_env: function () {
            var order = this.pos.get_order();
            var printers = this.pos.printers;
            if (!printers) {
                return false
            }
            var item_new = [];
            var item_cancelled = [];
            var table = null;
            var floor = null;
            for (var i = 0; i < printers.length; i++) {
                var changes = order.computeChanges(printers[i].config.product_categories_ids);
                table = changes['table'];
                floor = changes['floor'];
                for (var i = 0; i < changes['new'].length; i++) {
                    item_new.push(changes['new'][i]);
                }
                for (var i = 0; i < changes['cancelled'].length; i++) {
                    item_cancelled.push(changes['cancelled'][i]);
                }
            }
            return {
                widget: this,
                table: table,
                floor: floor,
                new_items: item_new,
                cancelled_items: item_cancelled
            }
        },
        get_receipt_filter_by_printer_render_env: function (printer) {
            var order = this.pos.get_order();
            var item_new = [];
            var item_cancelled = [];
            var changes = order.computeChanges(printer.config.product_categories_ids);
            for (var i = 0; i < changes['new'].length; i++) {
                item_new.push(changes['new'][i]);
            }
            for (var i = 0; i < changes['cancelled'].length; i++) {
                item_cancelled.push(changes['cancelled'][i]);
            }
            return {
                widget: this,
                table: changes['table'] || null,
                floor: changes['floor'] || null,
                new_items: item_new,
                cancelled_items: item_cancelled,
                time: changes['time']
            }
        },
        print_web: function () {
            var self = this;
            this.lock_screen(true);
            setTimeout(function () {
                self.lock_screen(false);
            }, 1000);
            window.print();
        },
        click_back: function () {
            this.pos.gui.show_screen('products');
        },
        renderElement: function () {
            var self = this;
            this._super();
            this.$('.back').click(function () {
                self.click_back();
            });
            this.$('.button.print-kitchen-receipt').click(function () {
                self.print_web();
            });
        },
        render_receipt: function () {
            var values = this.get_receipt_all_printer_render_env();
            if (!values) {
                return;
            }
            this.$('.pos-receipt-container').html(qweb.render('kitchen_receipt', values));
            var printers = this.pos.printers;
            for (var i = 0; i < printers.length; i++) {
                var value = this.get_receipt_filter_by_printer_render_env(printers[i]);
                if (value['new_items'].length > 0 || value['cancelled_items'].length > 0) {
                    var receipt = qweb.render('kitchen_receipt_xml', value);
                    printers[i].print(receipt);
                }
                this.pos.get_order().saveChanges();
            }
        }
    });

    gui.define_screen({name: 'kitchen_receipt_screen', widget: kitchen_receipt_screen});

});