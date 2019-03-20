odoo.define('pos_retail.buttons', function (require) {
    var screens = require('point_of_sale.screens');
    var core = require('web.core');
    var _t = core._t;
    var qweb = core.qweb;
    var WebClient = require('web.AbstractWebClient');

    var button_sort_products = screens.ActionButtonWidget.extend({ // combo button
        template: 'button_sort_products',
        button_click: function () {
            var self = this;
            var list = [
                {
                    label: 'Sort from A to Z',
                    item: 'a_z'
                },
                {
                    label: 'Sort from Z to A',
                    item: 'z_a'
                },
                {
                    label: 'Sort from low to high price',
                    item: 'low_price'
                },
                {
                    label: 'Sort from high to low price',
                    item: 'high_price'
                },
                {
                    label: 'Product pos sequence',
                    item: 'pos_sequence'
                }
            ];
            this.gui.show_popup('selection', {
                title: _t('Select sort by'),
                list: list,
                confirm: function (item) {
                    self.pos.config.default_product_sort_by = item;
                    self.pos.trigger('update:categories');
                }
            });
        }
    });

    screens.define_action_button({
        'name': 'button_sort_products',
        'widget': button_sort_products,
        'condition': function () {
            return this.pos.config.active_product_sort_by;
        }
    });

    var button_combo = screens.ActionButtonWidget.extend({ // combo button
        template: 'button_combo',
        button_click: function () {
            var order = this.pos.get_order();
            if (order && this.pos.get_order().selected_orderline) {
                this.pos.get_order().selected_orderline.change_combo()
            }
        }
    });

    screens.define_action_button({
        'name': 'button_combo',
        'widget': button_combo,
        'condition': function () {
            return this.pos.combo_items && this.pos.combo_items.length > 0;
        }
    });

    var button_combo_item_add_lot = screens.ActionButtonWidget.extend({ // add lot to combo items
        template: 'button_combo_item_add_lot',

        button_click: function () {
            var selected_orderline = this.pos.get_order().selected_orderline;
            if (!selected_orderline) {
                this.gui.show_popup('notify_popup', {
                    title: 'Error',
                    from: 'top',
                    align: 'center',
                    body: 'Please selected line before add lot',
                    color: 'danger',
                    timer: 2000
                });
                return;
            } else {
                this.pos.gui.show_popup('popup_add_lot_to_combo_items', {
                    'title': _t('Lot/Serial Number(s) Combo Items'),
                    'combo_items': selected_orderline['combo_items'],
                    'orderline': selected_orderline,
                    'widget': this,
                });
            }
        }
    });

    screens.define_action_button({
        'name': 'button_combo_item_add_lot',
        'widget': button_combo_item_add_lot,
        'condition': function () {
            return this.pos.combo_items && this.pos.combo_items.length > 0;
        }
    });

    var button_global_discount = screens.ActionButtonWidget.extend({ // global discounts
        template: 'button_global_discount',
        button_click: function () {
            var list = [];
            var self = this;
            for (var i = 0; i < this.pos.discounts.length; i++) {
                var discount = this.pos.discounts[i];
                list.push({
                    'label': discount.name,
                    'item': discount
                });
            }
            this.gui.show_popup('selection', {
                title: _t('Select discount'),
                list: list,
                confirm: function (discount) {
                    var order = self.pos.get_order();
                    order.add_global_discount(discount);
                }
            });
        }
    });
    screens.define_action_button({
        'name': 'button_global_discount',
        'widget': button_global_discount,
        'condition': function () {
            return this.pos.config.discount && this.pos.discounts && this.pos.discounts.length > 0;
        }
    });

    var button_create_internal_transfer = screens.ActionButtonWidget.extend({  // internal transfer
        template: 'button_create_internal_transfer',
        init: function (parent, options) {
            this._super(parent, options);
        },
        button_click: function () {
            var order = this.pos.get_order();
            var length = order.orderlines.length;
            if (length == 0) {
                return this.gui.show_popup('confirm', {
                    title: 'Error',
                    body: 'Your order lines is blank',
                });
            } else {
                this.pos.gui.show_popup('popup_internal_transfer', {})
            }
        }
    });

    screens.define_action_button({
        'name': 'button_create_internal_transfer',
        'widget': button_create_internal_transfer,
        'condition': function () {
            return this.pos.config.internal_transfer == true;
        }
    });

    var button_go_invoice_screen = screens.ActionButtonWidget.extend({
        template: 'button_go_invoice_screen',
        button_click: function () {
            this.gui.show_screen('invoices');
        },
    });
    screens.define_action_button({
        'name': 'button_go_invoice_screen',
        'widget': button_go_invoice_screen,
        'condition': function () {
            return this.pos.config.management_invoice == true;
        }
    });
    var button_kitchen_receipt_screen = screens.ActionButtonWidget.extend({
        template: 'button_kitchen_receipt_screen',
        button_click: function () {
            var order = this.pos.get('selectedOrder');
            if (order && order.orderlines.length) {
                this.pos.gui.show_screen('kitchen_receipt_screen');
            }
        }
    });
    screens.define_action_button({
        'name': 'button_kitchen_receipt_screen',
        'widget': button_kitchen_receipt_screen,
        'condition': function () {
            return this.pos.printers && this.pos.printers.length;
        }
    });

    var button_lock_screen = screens.ActionButtonWidget.extend({
        template: 'button_lock_screen',
        button_click: function () {
            this.gui.show_popup('popup_lock_page', {
                title: 'Locked',
                body: 'Use pos security pin for unlock'
            });
        }
    });
    screens.define_action_button({
        'name': 'button_lock_screen',
        'widget': button_lock_screen,
        'condition': function () {
            return this.pos.config.allow_lock_screen == true;
        }
    });

    var button_create_purchase_order = screens.ActionButtonWidget.extend({
        template: 'button_create_purchase_order',
        button_click: function () {
            this.gui.show_popup('popup_create_purchase_order', {
                title: 'Create Purchase Order',
                widget: this,
                cashregisters: this.pos.cashregisters
            });
        }
    });

    screens.define_action_button({
        'name': 'button_create_purchase_order',
        'widget': button_create_purchase_order,
        'condition': function () {
            return this.pos.config.create_purchase_order && this.pos.config.purchase_order_state;
        }
    });

    var button_change_unit = screens.ActionButtonWidget.extend({ // multi unit of measure
        template: 'button_change_unit',
        button_click: function () {
            var self = this;
            var order = this.pos.get_order();
            var selected_orderline = order.selected_orderline;
            if (order) {
                if (selected_orderline) {
                    selected_orderline.change_unit();
                } else {
                    return this.gui.show_popup('confirm', {
                        title: 'Warning',
                        body: 'Please select line',
                    });
                }
            } else {
                return this.gui.show_popup('confirm', {
                    title: 'Warning',
                    body: 'Order Lines is empty',
                });
            }
        }
    });
    screens.define_action_button({
        'name': 'button_change_unit',
        'widget': button_change_unit,
        'condition': function () {
            return this.pos.config.change_unit_of_measure;
        }
    });
    var button_go_pos_orders_screen = screens.ActionButtonWidget.extend({ // pos orders management
        template: 'button_go_pos_orders_screen',
        button_click: function () {
            this.gui.show_screen('pos_orders_screen');
        }
    });
    screens.define_action_button({
        'name': 'button_go_pos_orders_screen',
        'widget': button_go_pos_orders_screen,
        'condition': function () {
            return this.pos.config.pos_orders_management == true;
        }
    });
    var button_set_tags = screens.ActionButtonWidget.extend({
        template: 'button_set_tags',
        button_click: function () {
            if (!this.pos.tags || this.pos.tags.length == 0) {
                return this.gui.show_popup('confirm', {
                    title: 'Warning',
                    body: 'Empty tags, please go to Retail [menu] / Tags and create',
                });
            }
            if (this.pos.get_order().selected_orderline && this.pos.tags && this.pos.tags.length > 0) {
                return this.gui.show_popup('popup_selection_tags', {
                    selected_orderline: this.pos.get_order().selected_orderline,
                    title: 'Add tags'
                });
            } else {
                return this.gui.show_popup('confirm', {
                    title: 'Warning',
                    body: 'Please select line',
                });
            }
        }
    });

    screens.define_action_button({
        'name': 'button_set_tags',
        'widget': button_set_tags,
        'condition': function () {
            return false; // hide
        }
    });
    var button_register_payment = screens.ActionButtonWidget.extend({
        template: 'button_register_payment',
        button_click: function () {
            this.chrome.do_action('account.action_account_payment_from_invoices', {
                additional_context: {
                    active_ids: [3]
                }
            });
        }
    });

    screens.define_action_button({
        'name': 'button_register_payment',
        'widget': button_register_payment,
        'condition': function () {
            return false;
        }
    });
    var product_operation_button = screens.ActionButtonWidget.extend({
        template: 'product_operation_button',
        button_click: function () {
            this.gui.show_screen('productlist');
        }
    });

    screens.define_action_button({
        'name': 'product_operation_button',
        'widget': product_operation_button,
        'condition': function () {
            return this.pos.config.product_operation;
        }
    });
    var button_add_variants = screens.ActionButtonWidget.extend({
        template: 'button_add_variants',
        init: function (parent, options) {
            this._super(parent, options);

            this.pos.get('orders').bind('add remove change', function () {
                this.renderElement();
            }, this);

            this.pos.bind('change:selectedOrder', function () {
                this.renderElement();
            }, this);
        },
        button_click: function () {
            var selected_orderline = this.pos.get_order().selected_orderline;
            if (!selected_orderline) {
                this.pos.gui.show_popup('confirm', {
                    title: 'Warning',
                    body: 'Please select line',
                })
            } else {
                if (this.pos.variant_by_product_tmpl_id[selected_orderline.product.product_tmpl_id]) {
                    return this.gui.show_popup('pop_up_select_variants', {
                        variants: this.pos.variant_by_product_tmpl_id[selected_orderline.product.product_tmpl_id],
                        selected_orderline: selected_orderline,
                    });
                }
            }
        },
    });

    screens.define_action_button({
        'name': 'button_add_variants',
        'widget': button_add_variants,
        'condition': function () {
            return this.pos.config.multi_variant;
        },
    });

    var button_remove_variants = screens.ActionButtonWidget.extend({
        template: 'button_remove_variants',
        init: function (parent, options) {
            this._super(parent, options);

            this.pos.get('orders').bind('add remove change', function () {
                this.renderElement();
            }, this);

            this.pos.bind('change:selectedOrder', function () {
                this.renderElement();
            }, this);
        },
        button_click: function () {
            var selected_orderline = this.pos.get_order().selected_orderline;
            if (!selected_orderline) {
                this.gui.show_popup('error', {
                    message: _t('Please select line'),
                });
                return;
            } else {
                selected_orderline['variants'] = [];
                selected_orderline.set_unit_price(selected_orderline.product.list_price);
                selected_orderline.price_manually_set = true;
            }
        },
    });

    screens.define_action_button({
        'name': 'button_remove_variants',
        'widget': button_remove_variants,
        'condition': function () {
            return this.pos.config.multi_variant;
        },
    });

    var button_print_receipt = screens.ActionButtonWidget.extend({
        template: 'button_print_receipt',
        button_click: function () {
            var self = this;
            var order = this.pos.get_order();
            if (!order || order.orderlines.length == 0) {
                return this.gui.show_popup('confirm', {
                    title: 'Warning',
                    body: 'Your Order blank'
                });
            }
            if (this.pos.config.lock_order_printed_receipt) {
                return this.gui.show_popup('confirm', {
                    title: _t('Print receipt'),
                    body: 'If POS-BOX(printer) is ready installed, please got receipt at printer, and so if POS-BOX not installed will print viva web browse',
                    confirm: function () {
                        var order = self.pos.get_order();
                        if (order) {
                            order['lock'] = true;
                            self.pos.lock_order();
                            if (self.pos.pos_bus) {
                                self.pos.pos_bus.push_message_to_other_sessions({
                                    data: order.uid,
                                    action: 'lock_order',
                                    bus_id: self.pos.config.bus_id[0],
                                    order_uid: order['uid']
                                });
                            }
                            return self.pos.gui.show_screen('receipt_review');
                        }
                    }
                });
            } else {
                return self.pos.gui.show_screen('receipt_review');
            }

        }
    });
    screens.define_action_button({
        'name': 'button_print_receipt',
        'widget': button_print_receipt,
        'condition': function () {
            return false; // hide
        }
    });

    var button_order_signature = screens.ActionButtonWidget.extend({
        template: 'button_order_signature',
        button_click: function () {
            var order = this.pos.get_order();
            if (order) {
                this.gui.show_popup('popup_order_signature', {
                    order: order,
                    title: 'Signature'
                });
            }
        }
    });
    screens.define_action_button({
        'name': 'button_order_signature',
        'widget': button_order_signature,
        'condition': function () {
            return this.pos.config.signature_order;
        }
    });

    var button_order_note = screens.ActionButtonWidget.extend({
        template: 'button_order_note',
        button_click: function () {
            var order = this.pos.get_order();
            if (order) {
                this.gui.show_popup('textarea', {
                    title: _t('Add Note'),
                    value: order.get_note(),
                    confirm: function (note) {
                        order.set_note(note);
                        order.trigger('change', order);
                    }
                });
            }
        }
    });
    screens.define_action_button({
        'name': 'button_order_note',
        'widget': button_order_note,
        'condition': function () {
            return this.pos.config.note_order;
        }
    });

    var button_line_note = screens.ActionButtonWidget.extend({
        template: 'button_line_note',
        button_click: function () {
            var line = this.pos.get_order().get_selected_orderline();
            if (line) {
                this.gui.show_popup('popup_add_order_line_note', {
                    title: _t('Add Note'),
                    value: line.get_line_note(),
                    confirm: function (note) {
                        line.set_line_note(note);
                    }
                });
            } else {
                this.pos.gui.show_popup('confirm', {
                    title: 'Warning',
                    body: 'Please select line the first'
                })
            }
        }
    });

    screens.define_action_button({
        'name': 'button_line_note',
        'widget': button_line_note,
        'condition': function () {
            return false; // hide
        }
    });
    var button_selection_pricelist = screens.ActionButtonWidget.extend({ // version 10 only
        template: 'button_selection_pricelist',
        init: function (parent, options) {
            this._super(parent, options);
            this.pos.get('orders').bind('add change', function () {
                this.renderElement();
            }, this);
            this.pos.bind('change:selectedOrder', function () {
                this.renderElement();
                var order = this.pos.get_order();
                if (order && order.pricelist) {
                    order.set_pricelist_to_order(order.pricelist);
                }
            }, this);
        },
        button_click: function () {
            var self = this;
            var pricelists = _.map(self.pos.pricelists, function (pricelist) {
                return {
                    label: pricelist.name,
                    item: pricelist
                };
            });
            self.gui.show_popup('selection', {
                title: _t('Choice one pricelist'),
                list: pricelists,
                confirm: function (pricelist) {
                    self.pos.gui.close_popup();
                    var order = self.pos.get_order();
                    order.set_pricelist_to_order(pricelist);
                },
                is_selected: function (pricelist) {
                    return pricelist.id === self.pos.get_order().pricelist.id;
                }
            });
        },
        get_order_pricelist: function () {
            var name = _t('Pricelist Item');
            var order = this.pos.get_order();
            if (order) {
                var pricelist = order.pricelist;
                if (pricelist) {
                    name = pricelist.display_name;
                }
            }
            return name;
        }
    });

    screens.define_action_button({
        'name': 'button_selection_pricelist',
        'widget': button_selection_pricelist,
        'condition': function () {
            return this.pos.server_version == 10 && this.pos.pricelists && this.pos.pricelists.length > 0;
        }
    });

    var button_return_products = screens.ActionButtonWidget.extend({
        template: 'button_return_products',
        button_click: function () {
            this.gui.show_screen('return_products');
        }
    });

    screens.define_action_button({
        'name': 'button_return_products',
        'widget': button_return_products,
        'condition': function () {
            return this.pos.config.return_products == true;
        }
    });

    var button_lock_unlock_order = screens.ActionButtonWidget.extend({
        template: 'button_lock_unlock_order',
        button_click: function () {
            var order = this.pos.get_order();
            order['lock'] = !order['lock'];
            order.trigger('change', order);
            if (this.pos.pos_bus) {
                var action;
                if (order['lock']) {
                    action = 'lock_order';
                } else {
                    action = 'unlock_order';
                }
                this.pos.pos_bus.push_message_to_other_sessions({
                    data: order.uid,
                    action: action,
                    bus_id: this.pos.config.bus_id[0],
                    order_uid: order['uid']
                });
            } else {
                this.pos.gui.show_popup('confirm', {
                    title: 'Warning',
                    body: 'Syncing between sessions not active'
                })
            }
        }
    });

    screens.define_action_button({
        'name': 'button_lock_unlock_order',
        'widget': button_lock_unlock_order,
        'condition': function () {
            return this.pos.config.lock_order_printed_receipt == true;
        }
    });

    var button_print_user_card = screens.ActionButtonWidget.extend({
        template: 'button_print_user_card',
        button_click: function () {
            if (this.pos.config.iface_print_via_proxy) {
                var user_card_xml = qweb.render('user_card_xml', {
                    user: this.pos.get_cashier(),
                    company: this.pos.company
                });
                this.pos.proxy.print_receipt(user_card_xml);
            } else {
                return this.pos.gui.show_popup('confirm', {
                    title: 'Warning',
                    body: 'Your printer and posbox not installed'
                })
            }


        }
    });

    screens.define_action_button({
        'name': 'button_print_user_card',
        'widget': button_print_user_card,
        'condition': function () {
            return this.pos.config.print_user_card == true;
        }
    });

    var button_daily_report = screens.ActionButtonWidget.extend({
        template: 'button_daily_report',
        button_click: function () {
            this.pos.gui.show_screen('daily_report');

        }
    });

    screens.define_action_button({
        'name': 'button_daily_report',
        'widget': button_daily_report,
        'condition': function () {
            return false; // hide
        }
    });

    var button_clear_order = screens.ActionButtonWidget.extend({
        template: 'button_clear_order',
        init: function (parent, options) {
            this._super(parent, options);
        },
        button_click: function () {
            var orders = this.pos.get('orders');
            for (var i = 0; i < orders.models.length; i++) {
                var order = orders.models[i];
                if (order.orderlines.models.length == 0) {
                    order.destroy({'reason': 'abandon'});
                }
            }
        }
    });
    screens.define_action_button({
        'name': 'button_clear_order',
        'widget': button_clear_order,
        'condition': function () {
            return false; // hide
        }
    });

    var button_set_location = screens.ActionButtonWidget.extend({
        template: 'button_set_location',
        init: function (parent, options) {
            this._super(parent, options);
            this.locations_selected = null;
            this.pos.bind('change:location', function () {
                this.renderElement();
            }, this);
        },
        button_click: function () {
            this.gui.show_popup('popup_set_location', {})
        }
    });
    screens.define_action_button({
        'name': 'button_set_location',
        'widget': button_set_location,
        'condition': function () {
            return this.pos.config.multi_location == true;
        }
    });

    var button_restart_session = screens.ActionButtonWidget.extend({
        template: 'button_restart_session',
        init: function (parent, options) {
            this._super(parent, options);
        },
        button_click: function () {
            var def = new $.Deferred();
            var list = [];
            var self = this;
            for (var i = 0; i < this.pos.configs.length; i++) {
                var config = this.pos.configs[i];
                if (config.id != this.pos.config['id']) {
                    list.push({
                        'label': config.name,
                        'item': config
                    });
                }
            }
            if (list.length > 0) {
                this.gui.show_popup('selection', {
                    title: _t('Switch to user'),
                    list: list,
                    confirm: function (config) {
                        def.resolve(config);
                    }
                });
            } else {
                return this.pos.gui.show_popup('confirm', {
                    title: 'Warning',
                    body: 'Your system have only one config'
                });
            }
            return def.then(function (config) {
                var user = self.pos.user_by_id[config.user_id[0]];
                if (!user || (user && !user.pos_security_pin)) {
                    var config_id = config.id;
                    self.pos.ParameterDB.save(self.pos.session.db + '_config_id', config_id);
                    var web_client = new WebClient();
                    web_client._title_changed = function () {
                    };
                    web_client.show_application = function () {
                        return web_client.action_manager.do_action("pos.ui");
                    };
                    $(function () {
                        web_client.setElement($(document.body));
                        web_client.start();
                    });
                    return web_client;
                }
                if (user && user.pos_security_pin) {
                    return self.pos.gui.ask_password(user.pos_security_pin).then(function () {
                        var config_id = config.id;
                        self.pos.ParameterDB.save(self.pos.session.db + '_config_id', config_id);
                        var web_client = new WebClient();
                        web_client._title_changed = function () {
                        };
                        web_client.show_application = function () {
                            return web_client.action_manager.do_action("pos.ui");
                        };
                        $(function () {
                            web_client.setElement($(document.body));
                            web_client.start();
                        });
                        return web_client;
                    });
                }
            });
        }
    });
    screens.define_action_button({
        'name': 'button_restart_session',
        'widget': button_restart_session,
        'condition': function () {
            return this.pos.config.switch_user;
        }
    });

    var button_print_last_order = screens.ActionButtonWidget.extend({
        template: 'button_print_last_order',
        button_click: function () {
            if (this.pos.posbox_report_xml || this.pos.report_xml) {
                this.pos.gui.show_screen('report');
            } else {
                this.gui.show_popup('confirm', {
                    'title': _t('Error'),
                    'body': _t('Could not find last order'),
                });
            }
        },
    });

    screens.define_action_button({
        'name': 'button_print_last_order',
        'widget': button_print_last_order,
        'condition': function () {
            return this.pos.config.print_last_order;
        },
    });

    var button_medical_insurance_screen = screens.ActionButtonWidget.extend({
        template: 'button_medical_insurance_screen',
        button_click: function () {
            return this.pos.gui.show_screen('medical_insurance_screen')
        },
        init: function (parent, options) {
            this._super(parent, options);
            this.pos.bind('change:medical_insurance', function () {
                this.renderElement();
                var order = this.pos.get_order();
                order.trigger('change', order);
            }, this);
        },
    });

    screens.define_action_button({
        'name': 'button_medical_insurance_screen',
        'widget': button_medical_insurance_screen,
        'condition': function () {
            return this.pos.config.medical_insurance;
        },
    });

    var button_set_guest = screens.ActionButtonWidget.extend({
        template: 'button_set_guest',
        button_click: function () {
            return this.pos.gui.show_popup('popup_set_guest', {
                title: _t('Add guest'),
                confirm: function (values) {
                    if (!values['guest'] || !values['guest']) {
                        return this.pos.gui.show_popup('confirm', {
                            title: 'Error',
                            body: 'Field guest name and guest number is required'
                        })
                    } else {
                        var order = this.pos.get_order();
                        if (order) {
                            order['guest'] = values['guest'];
                            order['guest_number'] = values['guest_number'];
                            order.trigger('change', order);
                            this.pos.trigger('change:guest');
                        }
                    }
                }
            });
        },
        init: function (parent, options) {
            this._super(parent, options);
            this.pos.bind('change:guest', function () {
                this.renderElement();
                var order = this.pos.get_order();
                order.trigger('change', order);
            }, this);
        },
    });

    screens.define_action_button({
        'name': 'button_set_guest',
        'widget': button_set_guest,
        'condition': function () {
            return this.pos.config.set_guest;
        },
    });

    var button_reset_sequence = screens.ActionButtonWidget.extend({
        template: 'button_reset_sequence',
        button_click: function () {
            this.pos.pos_session.sequence_number = 0;
            return this.pos.gui.show_popup('confirm', {
                title: 'Done',
                body: 'You just set sequence number to 0'
            })
        },
        init: function (parent, options) {
            this._super(parent, options);
            this.pos.bind('change:guest', function () {
                this.renderElement();
                var order = this.pos.get_order();
                order.trigger('change', order);
            }, this);
        },
    });

    screens.define_action_button({
        'name': 'button_reset_sequence',
        'widget': button_reset_sequence,
        'condition': function () {
            return this.pos.config.reset_sequence;
        },
    });

    var button_change_tax = screens.ActionButtonWidget.extend({
        template: 'button_change_tax',
        init: function (parent, options) {
            this._super(parent, options);
        },
        button_click: function () {
            var self = this;
            var order = this.pos.get_order();
            if (order.get_selected_orderline()) {
                var line_selected = order.get_selected_orderline();
                return this.gui.show_popup('popup_select_tax', {
                    title: 'Please choice tax',
                    line_selected: line_selected,
                    confirm: function () {
                        return self.pos.gui.close_popup();
                    },
                    cancel: function () {
                        return self.pos.gui.close_popup();
                    }
                });
            } else {
                return this.gui.show_popup('confirm', {
                    title: _t('Warning'),
                    body: ('Please select line before add taxes')
                });
            }
        }
    });

    screens.define_action_button({
        'name': 'button_change_tax',
        'widget': button_change_tax,
        'condition': function () {
            return this.pos.config && this.pos.config.update_tax;
        }
    });

    var button_turn_onoff_printer = screens.ActionButtonWidget.extend({
        template: 'button_turn_onoff_printer',
        button_click: function () {
            this.pos.config.iface_print_via_proxy = !this.pos.config.iface_print_via_proxy
            this.pos.trigger('onoff:printer');
        },
        init: function (parent, options) {
            this._super(parent, options);
            this.pos.bind('onoff:printer', function () {
                this.renderElement();
                var order = this.pos.get_order();
                order.trigger('change', order);
            }, this);
        }
    });

    screens.define_action_button({
        'name': 'button_turn_onoff_printer',
        'widget': button_turn_onoff_printer,
        'condition': function () {
            return this.pos.config.printer_on_off;
        }
    });
});
