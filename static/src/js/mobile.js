odoo.define('pos_retail.mobile', function (require) {
    "use strict";
    var chrome = require('point_of_sale.chrome');
    var screens = require('point_of_sale.screens');
    var gui = require('point_of_sale.gui');
    var PosBaseWidget = require('point_of_sale.BaseWidget');
    var rpc = require('pos.rpc');
    var core = require('web.core');
    var _t = core._t;

    gui.Gui.include({
        show_screen: function (screen_name, params, refresh, skip_close_popup) {
            if (screen_name != 'products') {
                $('.swiper-container').addClass('oe_hidden');
            } else {
                $('.swiper-container').removeClass('oe_hidden');
            }
            return this._super(screen_name, params, refresh, skip_close_popup);
        }
    });
    chrome.Chrome.include({
        build_widgets: function () {
            this._super();
            var self = this;
            if (this.pos.config.mobile_responsive) {
                new Swiper('.swiper-container');
                var products = $('.rightpane');
                products.detach();
                $(".swiper_product_widget").append(products);
                var order = $('.leftpane');
                order.detach();
                $('.swiper_order_widget').append(order);
                $('.pos').addClass('mobile');
                var action_buttons = this.pos.gui.screen_instances.products.action_buttons;
                for (var key in action_buttons) {
                    action_buttons[key].appendTo(this.$('.button-list'));
                }
                $('.set-customer').click(function () {
                    $('.swiper-container').addClass('oe_hidden');
                    self.pos.gui.show_screen('clientlist');
                });
                $('.pay').click(function () {
                    $('.swiper-container').addClass('oe_hidden');
                    var order = self.pos.get_order();
                    var has_valid_product_lot = _.every(order.orderlines.models, function (line) {
                        return line.has_valid_product_lot();
                    });
                    if (!has_valid_product_lot) {
                        self.pos.gui.show_popup('confirm', {
                            'title': _t('Empty Serial/Lot Number'),
                            'body': _t('One or more product(s) required serial/lot number.'),
                            confirm: function () {
                                self.pos.gui.show_screen('payment');
                            },
                        });
                    } else {
                        self.pos.gui.show_screen('payment');
                    }
                });
            } else {
                $('.swiper-container').replaceWith();
            }
        }
    });

    screens.ProductScreenWidget.include({
        click_product: function (product) {
            this._super.apply(this, arguments);
            var order = this.pos.get_order();
            var $qty = $('span[data-product-id="' + product.id + '"] .cart_qty');
            var product_quantity_by_product_id = order.product_quantity_by_product_id();
            var qty = product_quantity_by_product_id[product.id];
            if (qty) {
                $qty.html(qty);
            }
            var $p = $('span[data-product-id="' + product.id + '"]');
            $($p).animate({
                'opacity': 0.5,
            }, 200, function () {
                $($p).animate({
                    'opacity': 1,
                }, 400);
            });
            var $pi = $('span[data-product-id="' + product.id + '"] img');
            $($pi).animate({
                'height': '220px',
                'width': '220px',
            }, 200, function () {
                $($pi).animate({
                    'height': '185px',
                    'width': '185px',
                }, 400);
            });
        },
    });
    screens.OrderWidget.include({
        orderline_change: function (line) {
            this._super(line);
            this.update_cart_qty();
        },
        change_selected_order: function () {
            this._super();
            this.update_cart_qty();
        },
        update_cart_qty: function () {
            var order = this.pos.get_order();
            if (order) {
                var products = this.pos.gui.screen_instances.products.product_list_widget.product_list;
                products.forEach(function (product) {
                    var $qty = $('span[data-product-id="' + product.id + '"] .cart_qty');
                    var qty = order.product_quantity_by_product_id()[product.id];
                    $qty.html('0');
                    if (qty) {
                        $qty.html(qty);
                    }
                });
            }
        },
    });

    var mobile_widget = PosBaseWidget.extend({
        template: 'mobile_widget',
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
                return self.gui.show_popup('confirm', {
                    title: 'Done',
                    body: 'Are you want change to mode screen of Mobile',
                    confirm: function () {
                        rpc.query({
                            model: 'pos.config',
                            method: 'switch_mobile_mode',
                            args: [parseInt(self.pos.config.id),
                                {
                                    mobile_responsive: !self.pos.config.mobile_responsive,
                                }
                            ]
                        }).then(function (result) {
                            self.pos.reload_pos();
                        }, function (type, err) {
                            self.pos.gui.show_popup('confirm', {
                                title: 'Error',
                                body: 'Odoo connection fail, could not save'
                            })
                        });
                    }
                });
            });
        },
        show: function () {
            this.$el.removeClass('oe_hidden');
        },
        hide: function () {
            this.$el.addClass('oe_hidden');
        }
    });

    var pc_widget = PosBaseWidget.extend({
        template: 'pc_widget',
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
                return self.gui.show_popup('confirm', {
                    title: 'Done',
                    body: 'Are you want change to mode screen of Computer and PC',
                    confirm: function () {
                        rpc.query({
                            model: 'pos.config',
                            method: 'switch_mobile_mode',
                            args: [parseInt(self.pos.config.id),
                                {
                                    mobile_responsive: !self.pos.config.mobile_responsive,
                                }
                            ]
                        }).then(function (result) {
                            self.pos.reload_pos();
                        }, function (type, err) {
                            self.pos.gui.show_popup('confirm', {
                                title: 'Error',
                                body: 'Odoo connection fail, could not save'
                            })
                        });
                    }
                });
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
                return widget['name'] != 'mobile_widget';
            });
            if (!this.pos.config.mobile_responsive) {
                this.widgets.push(
                    {
                        'name': 'mobile_widget',
                        'widget': mobile_widget,
                        'append': '.pos-rightheader'
                    }
                );
            } else {
                this.widgets.push(
                    {
                        'name': 'pc_widget',
                        'widget': pc_widget,
                        'append': '.pos-rightheader'
                    }
                );
            }
            this._super();
        }
    });
});
