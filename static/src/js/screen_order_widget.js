"use strict";
odoo.define('pos_retail.screen_order_widget', function (require) {

    var screens = require('point_of_sale.screens');
    var core = require('web.core');
    var utils = require('web.utils');
    var round_pr = utils.round_precision;
    var _t = core._t;
    var qweb = core.qweb;
    var field_utils = require('web.field_utils');

    screens.OrderWidget.include({
        init: function (parent, options) {
            var self = this;
            this.mouse_down = false;
            this.moved = false;
            this.auto_tooltip;
            this.line_mouse_down_handler = function (event) {
                self.line_mouse_down(this.orderline, event);
            };
            this.line_mouse_move_handler = function (event) {
                self.line_mouse_move(this.orderline, event);
            };
            this.inputbuffer = "";
            this.firstinput = true;
            this.decimal_point = _t.database.parameters.decimal_point;
            this.keyboard_keydown_handler = function (event) {
                var current_screen = self.pos.gui.get_current_screen();
                if (current_screen != 'products' || self.gui.has_popup()) {
                    self.remove_event_keyboard();
                    return;
                }
                if (event.keyCode === 8 || event.keyCode === 46) { // Backspace and Delete
                    event.preventDefault();
                    self.keyboard_handler(event);
                }
                if (event.keyCode === 38 || event.keyCode === 40) { // Up and Down
                    event.preventDefault();
                    self.change_line_selected(event.keyCode);
                }
                if (event.keyCode === 187) { // plus
                    event.preventDefault();
                    self.keyboard_handler(event);
                }
            };
            this.keyboard_handler = function (event) {
                var current_screen = self.pos.gui.get_current_screen();
                if (current_screen != 'products' || self.gui.has_popup()) {
                    self.remove_event_keyboard();
                    return;
                }
                var key = '';
                if (event.type === "keypress") {
                    if (event.keyCode === 13) { // Enter
                        self.remove_event_keyboard();
                        $('.pay').click();
                    } else if (event.keyCode === 190 || // Dot
                        event.keyCode === 188 ||  // Comma
                        event.keyCode === 46) {  // Numpad dot
                        key = self.decimal_point;
                    } else if (event.keyCode >= 48 && event.keyCode <= 57) { // Numbers
                        key = '' + (event.keyCode - 48);
                    } else if (event.keyCode === 45) { // Minus
                        key = '-';
                    } else if (event.keyCode === 43) { // Plus
                        key = '+';
                    } else if (event.keyCode === 99) {
                        self.remove_event_keyboard();
                        $('.set-customer').click()
                    } else if (event.keyCode === 113) {
                        self.numpad_state.changeMode('quantity');
                        self.pos.trigger('change:mode');
                    } else if (event.keyCode === 112) {
                        self.numpad_state.changeMode('price');
                        self.pos.trigger('change:mode');
                    } else if (event.keyCode === 100) {
                        self.numpad_state.changeMode('discount');
                        self.pos.trigger('change:mode');
                    } else if (event.keyCode === 110) {
                        self.remove_event_keyboard();
                        self.pos.add_new_order();
                    } else if (event.keyCode === 114) {
                        self.remove_event_keyboard();
                        $('.deleteorder-button').click();
                    } else if (event.keyCode === 97) {
                        self.remove_event_keyboard();
                        $('.add_customer').click();
                    } else if (event.keyCode === 119) {
                        self.remove_event_keyboard();
                        $('.add_product').click();
                    } else if (event.keyCode === 102) {
                        self.remove_event_keyboard();
                        $('.quickly_payment').click();
                    } else if (event.keyCode === 108) {
                        self.remove_event_keyboard();
                        $('.lock_session').click();
                    } else if (event.keyCode === 32) {
                        self.remove_event_keyboard();
                        $('.print_receipt').click();
                    } else if (event.keyCode === 115) {
                        self.remove_event_keyboard();
                        $('.daily_report').click();
                    }
                } else {
                    if (event.keyCode === 46) { // Delete
                        key = 'CLEAR';
                    } else if (event.keyCode === 8) { // Backspace
                        key = 'BACKSPACE';
                    } else if (event.keyCode === 187) { // Backspace
                        key = '+';
                    }
                }
                self.press_keyboard(key);
                event.preventDefault();
            };
            this._super(parent, options);
            this.pos.bind('change:mode', function () {
                self.change_mode();
            });
            this.pos.bind('back:order', function () {
                self.add_event_keyboard()
            });
            this.pos.bind('remove:keyboard_order', function () {
                self.remove_event_keyboard()
            });
        },
        press_keyboard: function (input) {
            if ((input == "CLEAR" || input == "BACKSPACE") && this.inputbuffer == "") {
                var order = this.pos.get_order();
                if (order.get_selected_orderline()) {
                    var mode = this.numpad_state.get('mode');
                    if (mode === 'quantity') {
                        this.inputbuffer = order.get_selected_orderline()['quantity'].toString();
                    } else if (mode === 'discount') {
                        this.inputbuffer = order.get_selected_orderline()['discount'].toString();
                    } else if (mode === 'price') {
                        this.inputbuffer = order.get_selected_orderline()['price'].toString();
                    }
                }
            }
            if (this.gui.has_popup()) {
                return;
            }
            if (input != '-' && input != '+') {
                var newbuf = this.gui.numpad_input(this.inputbuffer, input, {'firstinput': this.firstinput});
                this.firstinput = (newbuf.length === 0);
                if (newbuf !== this.inputbuffer) {
                    this.inputbuffer = newbuf;
                    var amount = field_utils.parse.float(this.inputbuffer);
                    this.set_value(amount);
                }
            }
            if (input == '-' || input == '+') {
                if (input == '-') {
                    var newbuf = parseFloat(this.inputbuffer) - 1;
                } else {
                    var newbuf = parseFloat(this.inputbuffer) + 1;
                }
                this.firstinput = (newbuf.length === 0);
                this.inputbuffer = newbuf.toString();
                this.set_value(this.inputbuffer)
            }
        },
        change_line_selected: function (keycode) {
            var order = this.pos.get_order();
            var line_selected = order.get_selected_orderline();
            if (!line_selected && order && order.orderlines.models.length > 0) {
                this.pos.get_order().select_orderline(order.orderlines.models[0]);
                this.numpad_state.reset();
            }
            if (line_selected && order && order.orderlines.models.length > 1) {
                for (var i = 0; i < order.orderlines.models.length; i++) {
                    var line_check = order.orderlines.models[i];
                    if (line_check.cid == line_selected.cid) {
                        if (keycode == 38) {
                            if ((i - 1) >= 0) {
                                var line_will_select = order.orderlines.models[i - 1];
                                this.pos.get_order().select_orderline(line_will_select);
                                this.numpad_state.reset();
                                break;
                            }
                        } else {
                            var line_will_select = order.orderlines.models[i + 1];
                            this.pos.get_order().select_orderline(line_will_select);
                            this.numpad_state.reset();
                            break;
                        }
                    }
                }
            }
        },
        click_line: function (orderline, event) {
            this._super(orderline, event);
            var order = this.pos.get_order();
            if (order && order.get_selected_orderline()) {
                var line = order.get_selected_orderline();
                this.add_event_keyboard();
                this.inputbuffer = "";
                this.firstinput = true;
                var mode = this.numpad_state.get('mode');
                if (mode === 'quantity') {
                    this.inputbuffer = line['quantity'].toString();
                } else if (mode === 'discount') {
                    this.inputbuffer = line['discount'].toString();
                } else if (mode === 'price') {
                    this.inputbuffer = line['price'].toString();
                }
            }
        },
        change_mode: function () {
            this.inputbuffer = "";
            this.firstinput = true;
        },
        add_event_keyboard: function () {
            if (this.pos.config.keyboard_event) {
                this.remove_event_keyboard();
                if (this.pos.server_version == 10) {
                    $('.leftpane').keypress(this.keyboard_handler);
                    $('.leftpane').keydown(this.keyboard_keydown_handler);
                }
                if ([11, 12].indexOf(this.pos.server_version) != -1) {
                    $('body').keypress(this.keyboard_handler);
                    $('body').keydown(this.keyboard_keydown_handler);
                }
                window.document.body.addEventListener('keypress', this.keyboard_handler);
                window.document.body.addEventListener('keydown', this.keyboard_keydown_handler);
            }
        },
        remove_event_keyboard: function () {
            if (this.pos.server_version == 10) {
                $('.leftpane').off('keypress', this.keyboard_handler);
                $('.leftpane').off('keydown', this.keyboard_keydown_handler);
            }
            if ([11, 12].indexOf(this.pos.server_version) != -1) {
                $('body').off('keypress', this.keyboard_handler);
                $('body').off('keydown', this.keyboard_keydown_handler);
            }
            window.document.body.removeEventListener('keypress', this.keyboard_handler);
            window.document.body.removeEventListener('keydown', this.keyboard_keydown_handler);
        },
        renderElement: function (scrollbottom) {
            var self = this;
            this._super(scrollbottom);
            this.add_event_keyboard();
        },
        // -------------------------------------
        // if config lock when print receipt
        // we'll lock order
        change_selected_order: function () {
            var res = this._super();
            var order = this.pos.get_order();
            if (order && order.lock && this.pos.config.lock_order_printed_receipt) {
                this.pos.lock_order();
            } else {
                this.pos.unlock_order();
            }
        },
        touch_start: function (product, x, y) {
            var self = this;
            this.auto_tooltip = setTimeout(function () {
                if (!self.moved) {
                    var inner_html = self.gui.screen_instances.products.product_list_widget.generate_html(product);
                    $('.product-screen').prepend(inner_html);
                    $(".close_button").on("click", function () {
                        $('#info_tooltip').remove();
                    });
                }
            }, 30);
        },
        touch_end: function () {
            if (this.auto_tooltip) {
                clearTimeout(this.auto_tooltip);
            }
        },
        line_mouse_down: function (line, event) {
            var self = this;
            if (event.which == 1) {
                $('.info_tooltip').remove();
                self.moved = false;
                self.mouse_down = true;
                self.touch_start(line.product, event.pageX, event.pageY);
            }
        },
        line_mouse_move: function (line, event) {
            var self = this;
            if (self.mouse_down) {
                self.moved = true;
            }
        },
        rerender_orderline: function (order_line) {
            try {
                this._super(order_line)
            } catch (e) {
                return null;
            }
        },
        render_orderline: function (orderline) {
            var self = this;
            var el_node = this._super(orderline);
            if (this.pos.config.tooltip) {
                el_node.addEventListener('mousedown', this.line_mouse_down_handler);
                el_node.addEventListener('mousemove', this.line_mouse_move_handler);
            }
            // -----------------------------
            // Add sale person to line
            // -----------------------------
            var el_add_sale_person = el_node.querySelector('.add_sale_person');
            if (el_add_sale_person) {
                el_add_sale_person.addEventListener('click', (function () {
                    var list = [];
                    for (var i = 0; i < self.pos.bus_locations.length; i++) {
                        var bus = self.pos.bus_locations[i];
                        list.push({
                            'label': bus['user_id'][1] + '/' + bus['name'],
                            'item': bus
                        })
                    }
                    if (list.length > 0) {
                        return self.pos.gui.show_popup('selection', {
                            title: _t('Select sale person'),
                            list: list,
                            confirm: function (bus) {
                                var user_id = bus['user_id'][0];
                                var user = self.pos.user_by_id[user_id];
                                orderline.set_sale_person(user);
                            }
                        });
                    } else {
                        return this.pos.gui.show_popup('confirm', {
                            title: 'Warning',
                            body: 'Go to Retail (menu) / Shop locations / add sale admin'
                        });
                    }

                }.bind(this)));
            }
            // -----------------------------
            // Change unit of measure of line
            // -----------------------------
            var el_change_unit = el_node.querySelector('.change_unit');
            if (el_change_unit) {
                el_change_unit.addEventListener('click', (function () {
                    var order = self.pos.get_order();
                    var selected_orderline = order.selected_orderline;
                    if (order) {
                        if (selected_orderline) {
                            selected_orderline.change_unit();
                        } else {
                            return self.pos.gui.show_popup('confirm', {
                                title: 'Warning',
                                body: 'Please select line',
                                confirm: function () {
                                    return self.gui.close_popup();
                                },
                                cancel: function () {
                                    return self.gui.close_popup();
                                }
                            });
                        }
                    } else {
                        return self.pos.gui.show_popup('confirm', {
                            title: 'Warning',
                            body: 'Order Lines is empty',
                        });
                    }

                }.bind(this)));
            }
            // -----------------------------
            // Change combo of line
            // -----------------------------
            var el_change_combo = el_node.querySelector('.change_combo');
            if (el_change_combo) {
                el_change_combo.addEventListener('click', (function () {
                    var order = self.pos.get_order();
                    if (order) {
                        var selected_orderline = order.selected_orderline;
                        if (selected_orderline) {
                            selected_orderline.change_combo();
                        }
                    }
                }.bind(this)));
            }
            // -----------------------------
            // Add cross sale
            // -----------------------------
            var el_change_cross_selling = el_node.querySelector('.change_cross_selling');
            if (el_change_cross_selling) {
                el_change_cross_selling.addEventListener('click', (function () {
                    var order = self.pos.get_order();
                    if (order) {
                        var selected_orderline = order.selected_orderline;
                        if (selected_orderline) {
                            selected_orderline.change_cross_selling();
                        }
                    }
                }.bind(this)));
            }
            // -----------------------------
            // Add cross sale
            // -----------------------------
            var el_change_line_note = el_node.querySelector('.change_line_note');
            if (el_change_line_note) {
                el_change_line_note.addEventListener('click', (function () {
                    var order = self.pos.get_order();
                    if (order) {
                        var selected_orderline = order.selected_orderline;
                        if (selected_orderline) {
                            this.gui.show_popup('popup_add_order_line_note', {
                                title: _t('Add Note'),
                                value: selected_orderline.get_line_note(),
                                confirm: function (note) {
                                    selected_orderline.set_line_note(note);
                                }
                            });
                        }
                    }
                }.bind(this)));
            }
            // -----------------------------
            // Add tags
            // -----------------------------
            var el_change_tags = el_node.querySelector('.change_tags');
            if (el_change_tags) {
                el_change_tags.addEventListener('click', (function () {
                    var order = self.pos.get_order();
                    if (order) {
                        var selected_orderline = order.selected_orderline;
                        if (selected_orderline) {
                            return this.gui.show_popup('popup_selection_tags', {
                                selected_orderline: selected_orderline,
                                title: 'Add tags'
                            });
                        }
                    }
                }.bind(this)));
            }
            // -----------------------------
            // Add discount
            // -----------------------------
            var el_change_tags = el_node.querySelector('.add_discount');
            if (el_change_tags) {
                el_change_tags.addEventListener('click', (function () {
                    var list = [];
                    for (var i = 0; i < self.pos.discounts.length; i++) {
                        var discount = self.pos.discounts[i];
                        list.push({
                            'label': discount.name,
                            'item': discount
                        });
                    }
                    this.pos.gui.show_popup('selection', {
                        title: _t('Select discount'),
                        list: list,
                        confirm: function (discount) {
                            var order = self.pos.get_order();
                            if (order && order.selected_orderline) {
                                order.selected_orderline.set_global_discount(discount);
                            }
                        }
                    });
                }.bind(this)));
            }
            return el_node;
        },
        remove_orderline: function (order_line) {
            try {
                this._super(order_line);
            } catch (ex) {
                console.log('dont worries, client without table select');
            }
        },
        set_value: function (val) {
            var self = this;
            var mode = this.numpad_state.get('mode');
            var order = this.pos.get_order();
            if (!order) {
                return false;
            }
            var line_selected = order.get_selected_orderline();
            if (!line_selected) {
                return false;
            }
            /*
            Security limit discount filter by cashiers
             */
            if (mode == 'discount' && this.pos.config.discount_limit && line_selected) {
                this.gui.show_popup('number', {
                    'title': _t('Which percentage of discount would you apply ?'),
                    'value': self.pos.config.discount_limit_amount,
                    'confirm': function (discount) {
                        if (discount > self.pos.config.discount_limit_amount) {
                            if (self.pos.config.discount_unlock_limit) {
                                var manager_user_id = self.pos.config.discount_unlock_limit_user_id[0];
                                var manager_user = self.pos.user_by_id[manager_user_id];
                                if (!manager_user) {
                                    return;
                                }
                                return this.pos.gui.show_popup('ask_password', {
                                    title: 'Blocked',
                                    body: _t('Discount limited, need approve by ' + manager_user.name + '. Please input pos security pin of manager'),
                                    confirm: function (password) {
                                        if (manager_user) {
                                            if (manager_user['pos_security_pin'] != password) {
                                                self.pos.gui.show_popup('confirm', {
                                                    title: 'Error',
                                                    body: 'POS Security pin of ' + manager_user.name + ' not correct !'
                                                });
                                            } else {
                                                order.get_selected_orderline().set_discount(discount);
                                            }
                                        }
                                    }
                                });
                            } else {
                                return self.gui.show_popup('confirm', {
                                    title: _t('Warning'),
                                    body: 'You can not set discount bigger than ' + self.pos.config.discount_limit_amount + '. Please contact your pos manager and set bigger than',
                                })
                            }
                        } else {
                            order.get_selected_orderline().set_discount(discount);
                        }
                    }
                });
            } else {
                this._super(val);
            }
        },
        set_lowlight_order: function (buttons) {
            for (var button_name in buttons) {
                buttons[button_name].highlight(false);
            }
        },
        active_button_combo: function (buttons, selected_order) { // active button set combo
            if (selected_order.selected_orderline && buttons && buttons.button_combo) {
                var is_combo = selected_order.selected_orderline.is_combo();
                buttons.button_combo.highlight(is_combo);
            }
        },
        active_button_combo_item_add_lot: function (buttons, selected_order) { // active button set combo
            if (selected_order.selected_orderline && buttons && buttons.button_combo_item_add_lot) {
                var has_combo_item_tracking_lot = selected_order.selected_orderline.has_combo_item_tracking_lot();
                buttons.button_combo_item_add_lot.highlight(has_combo_item_tracking_lot);
            }
        },
        active_internal_transfer_button: function (buttons, selected_order) { // active button set combo
            if (buttons && buttons.internal_transfer_button) {
                var active = selected_order.validation_order_can_do_internal_transfer();
                buttons.internal_transfer_button.highlight(active);
            }
        },
        active_button_create_purchase_order: function (buttons, selected_order) {
            if (buttons.button_create_purchase_order) {
                if (selected_order.orderlines.length > 0 && selected_order.get_client()) {
                    buttons.button_create_purchase_order.highlight(true);
                } else {
                    buttons.button_create_purchase_order.highlight(false);
                }
            }
        },
        active_button_change_unit: function (buttons, selected_order) {
            if (buttons.button_change_unit) {
                if (selected_order.selected_orderline && selected_order.selected_orderline.is_multi_unit_of_measure()) {
                    buttons.button_change_unit.highlight(true);
                } else {
                    buttons.button_change_unit.highlight(false);
                }
            }
        },
        active_button_set_tags: function (buttons, selected_order) {
            if (buttons.button_set_tags) {
                if (selected_order.selected_orderline && selected_order.selected_orderline.is_has_tags()) {
                    buttons.button_set_tags.highlight(true);
                } else {
                    buttons.button_set_tags.highlight(false);
                }
            }
        },
        active_lock_unlock_order: function (buttons, selected_order) {
            if (buttons.button_lock_unlock_order) {
                if (selected_order['lock']) {
                    buttons.button_lock_unlock_order.highlight(true);
                    buttons.button_lock_unlock_order.$el.html('<i class="fa fa-lock" /> UnLock Order')
                } else {
                    buttons.button_lock_unlock_order.highlight(false);
                    buttons.button_lock_unlock_order.$el.html('<i class="fa fa-unlock" /> Lock Order')
                }
            }
        },
        active_button_global_discount: function (buttons, selected_order) {
            if (buttons.button_global_discount) {
                if (selected_order.selected_orderline && this.pos.config.discount_ids) {
                    buttons.button_global_discount.highlight(true);
                } else {
                    buttons.button_global_discount.highlight(false);
                }
            }
        },
        active_button_variants: function (buttons, selected_order) {
            if (buttons.button_add_variants) {
                if (selected_order.selected_orderline && this.pos.variant_by_product_tmpl_id[selected_order.selected_orderline.product.product_tmpl_id]) {
                    buttons.button_add_variants.highlight(true);
                } else {
                    buttons.button_add_variants.highlight(false);
                }
            }
        },
        active_medical_insurance: function (buttons, selected_order) {
            if (buttons.button_medical_insurance_screen) {
                if (selected_order.medical_insurance) {
                    buttons.button_medical_insurance_screen.highlight(true);
                } else {
                    buttons.button_medical_insurance_screen.highlight(false);
                }
            }
        },
        active_reprint_last_order: function (buttons, selected_order) {
            if (buttons.button_print_last_order) {
                if (this.pos.posbox_report_xml && this.pos.report_xml) {
                    buttons.button_print_last_order.highlight(true);

                } else {
                    buttons.button_print_last_order.highlight(false);
                }
            }
        },
        active_button_cash_management: function (buttons) {
            if (buttons.button_cash_management) {
                buttons.button_cash_management.highlight(true);
            }
        },
        set_total_gift: function (total_gift) {
            $('.total_gift').html(total_gift);
        },
        set_amount_total: function (amount_total) {
            var amount_total = this.format_currency_no_symbol(amount_total)
            $('.amount_total').html(amount_total);
        },
        set_total_items: function (count) {
            $('.set_total_items').html(count);
        },
        update_summary: function () {
            var self = this
            this._super();
            setTimeout(function () {
                $('input').click(function () {
                    self.remove_event_keyboard();
                });
            }, 100);
            $('.mode-button').click(function () {
                self.change_mode();
            });
            $('.pay').click(function () {
                self.remove_event_keyboard();
            });
            $('.set-customer').click(function () {
                self.remove_event_keyboard();
            });
            var self = this;
            var selected_order = this.pos.get_order();
            var buttons = this.getParent().action_buttons;
            if (selected_order && buttons) {
                this.active_button_cash_management(buttons);
                this.active_reprint_last_order(buttons, selected_order);
                this.active_medical_insurance(buttons, selected_order);
                this.active_button_combo(buttons, selected_order);
                this.active_button_combo_item_add_lot(buttons, selected_order);
                this.active_internal_transfer_button(buttons, selected_order);
                this.active_button_variants(buttons, selected_order);
                this.active_button_create_purchase_order(buttons, selected_order);
                this.active_button_change_unit(buttons, selected_order);
                this.active_button_set_tags(buttons, selected_order);
                this.active_lock_unlock_order(buttons, selected_order);
                this.active_button_global_discount(buttons, selected_order);
                try { // try catch because may be customer not installed pos_restaurant
                    var changes = selected_order.hasChangesToPrint();
                    if (buttons && buttons.button_kitchen_receipt_screen) {
                        buttons.button_kitchen_receipt_screen.highlight(changes);
                    }
                } catch (e) {

                }
                var $signature = $('.signature');
                if ($signature) {
                    $signature.attr('src', selected_order.get_signature());
                }
                var $note = this.el.querySelector('.order-note');
                if ($note) {
                    $note.textContent = selected_order.get_note();
                }
                if (selected_order.selected_orderline) {
                    var check = selected_order.selected_orderline.is_multi_variant();
                    var buttons = this.getParent().action_buttons;
                    if (buttons && buttons.button_add_variants) {
                        buttons.button_add_variants.highlight(check);
                    }
                    var has_variants = selected_order.selected_orderline.has_variants();
                    if (buttons && buttons.button_remove_variants) {
                        buttons.button_remove_variants.highlight(has_variants);
                    }
                }
                /*
                    Header order list
                */
                this.set_total_items(selected_order.orderlines.length);
                this.set_amount_total(selected_order.get_total_with_tax());
                var promotion_lines = _.filter(selected_order.orderlines.models, function (line) {
                    return line.promotion;
                });
                if (promotion_lines.length > 0) {
                    this.set_total_gift(promotion_lines.length)
                }
            }
            var $find_customer_box = $('.find_customer >input');
            $find_customer_box.autocomplete({
                source: this.pos.db.partners_autocomplete,
                minLength: this.pos.config.min_length_search,
                select: function (event, ui) {
                    if (ui && ui['item'] && ui['item']['value']) {
                        var partner = self.pos.db.partner_by_id[parseInt(ui['item']['value'])];
                        if (partner) {
                            self.pos.get_order().set_client(partner);
                            setTimeout(function () {
                                var input = $('.find_customer input');
                                input.val("");
                                input.focus();
                            }, 100);
                        }
                    }
                }
            });
        }
    });
});
