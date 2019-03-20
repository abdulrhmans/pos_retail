"use strict";
/*
    This module create by: thanhchatvn@gmail.com
    License: OPL-1
    Please do not modification if i not accept
    Thanks for understand
 */
odoo.define('pos_retail.order', function (require) {

    var utils = require('web.utils');
    var round_pr = utils.round_precision;
    var models = require('point_of_sale.models');
    var core = require('web.core');
    var qweb = core.qweb;
    var _t = core._t;

    var _super_Order = models.Order.prototype;
    models.Order = models.Order.extend({
        initialize: function (attributes, options) {
            _super_Order.initialize.apply(this, arguments);
            var self = this;
            this.orderlines.bind('change add remove', function (line) {
                self.pos.trigger('update:count_item')
            });
            if (!this.note) {
                this.note = '';
            }
            if (!this.signature) {
                this.signature = '';
            }
            this.orderlines.bind('change add remove', function (line) {
                self.trigger('update:table-list');
            });
            if (this.pos.server_version == 10 && this.pos.default_pricelist) { // default price list for version 10
                if (!this.pricelist) {
                    this.pricelist = this.pos.default_pricelist;
                    this.set_pricelist_to_order(this.pricelist);
                }
            }
            if (!this.lock) {
                this.lock = false;
            }
            if (this.pos.config.pos_auto_invoice) { // auto checked button invoice if field pos_auto_invoice checked at pos config
                this.to_invoice = true;
            }
            if (this.pos.config.auto_register_payment) { // auto checked button auto register payment if field auto_register_payment checked at pos config
                this.auto_register_payment = true;
            }
        },
        init_from_JSON: function (json) {
            var res = _super_Order.init_from_JSON.apply(this, arguments);
            if (json.date) {
                this.date = json.date;
            }
            if (json.name) {
                this.name = json.name;
            }
            if (json.email_invoice) {
                this.email_invoice = json.email_invoice;
            }
            if (json.email_invoice) {
                this.email_invoice = json.email_invoice;
            }
            if (json.auto_register_payment) {
                this.auto_register_payment = json.auto_register_payment;
            }
            if (json.delivery_date) {
                this.delivery_date = json.delivery_date;
            }
            if (json.delivery_address) {
                this.delivery_address = json.delivery_address;
            }
            if (json.delivery_phone) {
                this.delivery_phone = json.delivery_phone;
            }
            if (json.amount_debit) {
                this.amount_debit = json.amount_debit;
            }
            if (json.sale_id) {
                this.sale_id = json.sale_id;
            }
            if (json.return_order_id) {
                this.return_order_id = json.return_order_id;
            }
            if (json.is_return) {
                this.is_return = json.is_return;
            }
            if (json.to_invoice) {
                this.to_invoice = json.to_invoice;
            }
            if (json.parent_id) {
                this.parent_id = json.parent_id;
            }
            if (json.invoice_journal_id) {
                this.invoice_journal_id = json.invoice_journal_id;
            }
            if (json.ean13) {
                this.ean13 = json.ean13;
            }
            if (json.signature) {
                this.signature = json.signature
            }
            if (json.note) {
                this.note = json.note
            }
            if (this.pos.server_version == 10 && this.pos.default_pricelist) { // init price list for version 10
                if (json.pricelist_id) {
                    this.pricelist = _.find(this.pos.pricelists, function (pricelist) {
                        return pricelist.id === json.pricelist_id;
                    });
                    if (this.pricelist) {
                        this.set_pricelist_to_order(this.pricelist);
                    } else {
                        this.pricelist = this.pos.default_pricelist;
                        this.set_pricelist_to_order(this.pos.default_pricelist);
                    }
                } else {
                    this.pricelist = this.pos.default_pricelist;
                    this.set_pricelist_to_order(this.pricelist);
                }
            }
            if (json.lock) {
                this.lock = json.lock;
            } else {
                this.lock = false;
            }
            if (json.medical_insurance_id) {
                this.medical_insurance = this.pos.db.insurance_by_id[json.medical_insurance_id];
            }
            if (json.guest) {
                this.guest = json.guest;
            }
            if (json.guest_number) {
                this.guest_number = json.guest_number;
            }
            if (json.location_id) {
                this.location_id = json.location_id;
                this.location = this.pos.stock_location_by_id[json.location_id];
            }
            if (json.add_credit) {
                this.add_credit = json.add_credit
            } else {
                this.add_credit = false;
            }
            return res;
        },
        export_as_JSON: function () {
            var json = _super_Order.export_as_JSON.apply(this, arguments);
            if (this.partial_payment) {
                json.partial_payment = this.partial_payment
            }
            if (this.email_invoice) {
                json.email_invoice = this.email_invoice;
                var client = this.get_client();
                if (client && client.email) {
                    json.email = client.email;
                }
            }
            if (this.auto_register_payment && this.get_total_without_tax > 0) {
                json.auto_register_payment = this.auto_register_payment;
            } else {
                json.auto_register_payment = false;
            }
            if (this.delivery_date) {
                json.delivery_date = this.delivery_date;
            }
            if (this.delivery_address) {
                json.delivery_address = this.delivery_address;
            }
            if (this.delivery_phone) {
                json.delivery_phone = this.delivery_phone;
            }
            if (this.amount_debit) {
                json.amount_debit = this.amount_debit;
            }
            if (this.sale_id) {
                json.sale_id = this.sale_id;
            }
            if (this.return_order_id) {
                json.return_order_id = this.return_order_id;
            }
            if (this.is_return) {
                json.is_return = this.is_return;
            }
            if (this.parent_id) {
                json.parent_id = this.parent_id;
            }
            if (this.invoice_journal_id) {
                json.invoice_journal_id = this.invoice_journal_id;
            }
            if (this.note) {
                json.note = this.note;
            }
            if (this.signature) {
                json.signature = this.signature;
            }
            if (this.ean13) {
                json.ean13 = this.ean13;
            }
            if (!this.ean13 && this.uid) {
                var ean13 = '998';
                if (this.pos.user.id) {
                    ean13 += this.pos.user.id;
                }
                if (this.sequence_number) {
                    ean13 += this.sequence_number;
                }
                if (this.pos.config.id) {
                    ean13 += this.pos.config.id;
                }
                var format_ean13 = this.uid.split('-');
                for (var i in format_ean13) {
                    ean13 += format_ean13[i];
                }
                ean13 = ean13.split("");
                var ean13_array = []
                var ean13_str = ""
                for (var i = 0; i < ean13.length; i++) {
                    if (i < 12) {
                        ean13_str += ean13[i]
                        ean13_array.push(ean13[i])
                    }
                }
                this.ean13 = ean13_str + this.generate_unique_ean13(ean13_array).toString()
            }
            if (this.pos.server_version == 10 && this.pricelist) { // export price list for version 10
                json.pricelist_id = this.pricelist.id;
            }
            if (this.lock) {
                json.lock = this.lock;
            } else {
                json.lock = false;
            }
            if (this.invoice_number) {
                json.invoice_number = this.invoice_number
            }
            if (this.medical_insurance) {
                json.medical_insurance_id = this.medical_insurance.id
            }
            if (this.guest) {
                json.guest = this.guest.id
            }
            if (this.guest_number) {
                json.guest_number = this.guest_number.id
            }
            json.location_id = this.pos.get_location()['id'];
            if (this.add_credit) {
                json.add_credit = this.add_credit
            } else {
                json.add_credit = false
            }
            return json;
        },
        export_for_printing: function () {
            var receipt = _super_Order.export_for_printing.call(this);
            var order = this.pos.get_order();
            receipt['location'] = this.pos.get_location();
            receipt['guest'] = this.guest;
            receipt['guest_number'] = this.guest_number;
            receipt['medical_insurance'] = null;
            receipt['delivery_date'] = this.delivery_date;
            receipt['delivery_address'] = this.delivery_address;
            receipt['delivery_phone'] = this.delivery_phone;
            receipt['note'] = this.note;
            receipt['signature'] = this.signature;
            if (this.fiscal_position) {
                receipt.fiscal_position = this.fiscal_position
            }
            if (this.amount_debit) {
                receipt['amount_debit'] = this.amount_debit;
            }
            if (this.medical_insurance) {
                receipt['medical_insurance'] = this.medical_insurance;
            }
            var orderlines_by_category_name = {};
            var orderlines = order.orderlines.models;
            var categories = [];
            receipt['categories'] = [];
            receipt['orderlines_by_category_name'] = [];
            if (this.pos.config.category_wise_receipt) {
                for (var i = 0; i < orderlines.length; i++) {
                    var line = orderlines[i];
                    var pos_categ_id = line['product']['pos_categ_id']
                    line['tax_amount'] = line.get_tax();
                    if (pos_categ_id && pos_categ_id.length == 2) {
                        var root_category_id = order.get_root_category_by_category_id(pos_categ_id[0])
                        var category = this.pos.db.category_by_id[root_category_id]
                        var category_name = category['name'];
                        if (!orderlines_by_category_name[category_name]) {
                            orderlines_by_category_name[category_name] = [line];
                            var category_index = _.findIndex(categories, function (category) {
                                return category == category_name;
                            });
                            if (category_index == -1) {
                                categories.push(category_name)
                            }
                        } else {
                            orderlines_by_category_name[category_name].push(line)
                        }

                    } else {
                        if (!orderlines_by_category_name['None']) {
                            orderlines_by_category_name['None'] = [line]
                        } else {
                            orderlines_by_category_name['None'].push(line)
                        }
                        var category_index = _.findIndex(categories, function (category) {
                            return category == 'None';
                        });
                        if (category_index == -1) {
                            categories.push('None')
                        }
                    }
                }
                receipt['orderlines_by_category_name'] = orderlines_by_category_name;
                receipt['categories'] = categories;
            }
            return receipt
        },
        get_medical_insurance: function () {
            if (this.medical_insurance) {
                return this.medical_insurance
            } else {
                return null
            }
        },
        get_guest: function () {
            if (this.guest) {
                return this.guest
            } else {
                return null
            }
        },
        validate_medical_insurance: function () {
            var lines = this.orderlines.models;
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                if (line['medical_insurance']) {
                    this.remove_orderline(line);
                }
            }
            if (this.medical_insurance) {
                var total_without_tax = this.get_total_without_tax();
                var product = this.pos.db.product_by_id[this.medical_insurance.product_id[0]]
                var price = total_without_tax / 100 * this.medical_insurance.rate
                this.add_product(product, {
                    price: price,
                    quantity: -1
                });
                var selected_line = this.get_selected_orderline();
                selected_line['medical_insurance'] = true;
                selected_line.discount_reason = this.medical_insurance.name;
                selected_line.trigger('update:OrderLine', selected_line);
                selected_line.trigger('change', selected_line);
            }
        },
        validate_global_discount: function () {
            var self = this;
            var client = this && this.get_client();
            if (client && client['discount_id']) {
                this.pos.gui.show_screen('products');
                this.discount = this.pos.discount_by_id[client['discount_id'][0]];
                this.pos.gui.show_screen('products');
                var body = client['name'] + ' have discount ' + self.discount['name'] + '. Do you want to apply ?';
                return this.pos.gui.show_popup('confirm', {
                    'title': _t('Customer special discount ?'),
                    'body': body,
                    confirm: function () {
                        self.add_global_discount(self.discount);
                        self.pos.gui.show_screen('payment');
                        self.validate_payment();
                    },
                    cancel: function () {
                        self.pos.gui.show_screen('payment');
                        self.validate_payment();
                    }
                });
            } else {
                this.validate_payment();
            }
        },
        validate_payment: function () {
            /*
                    If pos config check to validate payment
                    POS screen auto popup and ask password for go to next screen
             */
            var self = this;
            if (this.pos.config.validate_payment) {
                this.pos.gui.show_screen('products');
                return this.pos.gui.show_popup('ask_password', {
                    title: 'Blocked',
                    body: 'Please input pos pass pin for payment order',
                    confirm: function (value) {
                        var pin;
                        if (self.pos.config.validate_by_user_id) {
                            var user_validate = self.pos.user_by_id[self.pos.config.validate_by_user_id[0]];
                            pin = user_validate['pos_security_pin']
                        } else {
                            pin = self.pos.user.pos_security_pin
                        }
                        if (value != pin) {
                            return self.pos.gui.show_popup('confirm', {
                                title: 'Wrong',
                                body: 'Password not correct, please check pos security pin'
                            })
                        } else {
                            return self.pos.gui.show_screen('payment');
                        }
                    }
                })
            }
        },
        validate_payment_order: function () {
            if (this && this.orderlines.models.length == 0) {
                this.pos.gui.show_screen('products');
                return this.pos.gui.show_popup('confirm', {
                    title: 'Warning',
                    body: 'Your order lines is blank'
                })
            }
            if (this.remaining_point && this.remaining_point < 0) {
                this.pos.gui.show_screen('products');
                return this.pos.gui.show_popup('confirm', {
                    title: 'Warning',
                    body: 'You could not applied redeem point bigger than client point',
                });
            }
            this.validate_promotion();
            this.validate_medical_insurance();
        },
        add_global_discount: function (discount) {
            var total_without_tax = this.get_total_with_tax();
            var product = this.pos.db.product_by_id[discount.product_id[0]];
            var price = total_without_tax / 100 * discount['amount'];
            this.add_product(product, {
                price: price,
                quantity: -1
            });
            var selected_line = this.get_selected_orderline();
            selected_line.discount_reason = discount.reason;
            selected_line.trigger('update:OrderLine', selected_line);
            selected_line.trigger('change', selected_line);
        },
        set_to_invoice: function (to_invoice) {
            if (to_invoice) {
                this.add_credit = false;
                this.trigger('change');
            }
            return _super_Order.set_to_invoice.apply(this, arguments);
        },
        is_add_credit: function () {
            return this.add_credit
        },
        add_order_credit: function () {
            this.add_credit = !this.add_credit;
            if (this.add_credit) {
                this.create_voucher = false;
                this.set_to_invoice(false);
            }
            this.trigger('change');
            if (this.add_credit && !this.get_client()) {
                this.pos.gui.show_screen('clientlist');
                return this.pos.gui.show_popup('confirm', {
                    title: 'Warning',
                    body: 'Please add customer need add credit'
                })
            }
        },
        is_email_invoice: function () { // send email invoice or not
            return this.email_invoice;
        },
        is_auto_register_payment: function () { // auto register payment or not
            var total_without_tax = this.get_total_with_tax();
            if (total_without_tax <= 0) {
                this.auto_register_payment = false;
                return false
            } else {
                return this.auto_register_payment;
            }
        },
        set_email_invoice: function (email_invoice) {
            this.assert_editable();
            this.email_invoice = email_invoice;
            this.set_to_invoice(email_invoice);
        },
        set_auto_register_payment: function (auto_register_payment) {
            this.assert_editable();
            this.auto_register_payment = auto_register_payment;
            this.set_to_invoice(auto_register_payment);
        },
        get_root_category_by_category_id: function (category_id) { // get root of category, root is parent category is null
            var root_category_id = category_id;
            var category_parent_id = this.pos.db.category_parent[category_id];
            if (category_parent_id) {
                root_category_id = this.get_root_category_by_category_id(category_parent_id)
            }
            return root_category_id
        },
        // odoo wrong when compute price with tax have option price inclued
        // and now i fixing
        fix_tax_included_price: function (line) {
            _super_Order.fix_tax_included_price.apply(this, arguments);
            if (this.fiscal_position) {
                var unit_price = line.product['list_price'];
                var taxes = line.get_taxes();
                var mapped_included_taxes = [];
                _(taxes).each(function (tax) {
                    var line_tax = line._map_tax_fiscal_position(tax);
                    if (tax.price_include && tax.id != line_tax.id) {

                        mapped_included_taxes.push(tax);
                    }
                });
                if (mapped_included_taxes.length > 0) {
                    unit_price = line.compute_all(mapped_included_taxes, unit_price, 1, this.pos.currency.rounding, true).total_excluded;
                    line.set_unit_price(unit_price);
                }
            }
        },
        set_signature: function (signature) {
            this.signature = signature;
            this.trigger('change', this);
        },
        get_signature: function () {
            if (this.signature) {
                return 'data:image/png;base64, ' + this.signature
            } else {
                return null
            }
        },
        set_note: function (note) {
            this.note = note;
            this.trigger('change', this);
        },
        get_note: function (note) {
            return this.note;
        },
        active_button_add_wallet: function (active) {
            var $add_wallet = $('.add_wallet');
            if (!$add_wallet) {
                return;
            }
            if (active) {
                $add_wallet.removeClass('oe_hidden');
                $add_wallet.addClass('highlight')
            } else {
                $add_wallet.addClass('oe_hidden');
            }
        },
        get_change: function (paymentline) {
            var change = _super_Order.get_change.apply(this, arguments);
            var client = this.get_client();
            var wallet_register = _.find(this.pos.cashregisters, function (register_journal) {
                return register_journal.journal['pos_method_type'] == 'wallet';
            }); // display wallet method when have change
            if (wallet_register) {
                var $journal_element = $("[data-id='" + wallet_register.journal['id'] + "']");
                if (change > 0 || (client && client['wallet'] > 0)) {
                    $journal_element.removeClass('oe_hidden');
                    $journal_element.addClass('highlight');
                } else {
                    $journal_element.addClass('oe_hidden');
                }
            }
            var company_currency = this.pos.company.currency_id; // return amount with difference currency
            if (paymentline && paymentline.cashregister && paymentline.cashregister.currency_id && paymentline.cashregister.currency_id[0] != company_currency[0]) {
                var new_change = -this.get_total_with_tax();
                var lines = this.paymentlines.models;
                var company_currency = this.pos.company.currency_id;
                var company_currency_data = this.pos.currency_by_id[company_currency[0]];
                for (var i = 0; i < lines.length; i++) {
                    var selected_currency = this.pos.currency_by_id[lines[i].cashregister.currency_id[0]];
                    var selected_rate = selected_currency['rate'];
                    var amount_of_line = lines[i].get_amount();
                    new_change += amount_of_line * selected_rate / company_currency_data['rate'];
                    if (lines[i] === paymentline) {
                        break;
                    }
                }
                var currency_change = round_pr(Math.max(0, new_change), this.pos.currency.rounding);
                if (currency_change > 0) {
                    this.active_button_add_wallet(true);
                } else {
                    this.active_button_add_wallet(false);
                }
                return currency_change
            }
            if (change > 0) {
                this.active_button_add_wallet(true);
            } else {
                this.active_button_add_wallet(false);
            }
            return change;
        },
        get_due: function (paymentline) {
            var due = _super_Order.get_due.apply(this, arguments);
            if (!paymentline) {
                return due;
            }
            var active_multi_currency = false;
            var lines = this.paymentlines.models;
            var company_currency = this.pos.company.currency_id;
            var company_currency_data = this.pos.currency_by_id[company_currency[0]];
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                var currency_id_of_line = line.cashregister.currency_id[0];
                var currency_of_line = this.pos.currency_by_id[currency_id_of_line];
                if (currency_of_line['id'] != company_currency_data['id']) {
                    active_multi_currency = true;
                }
            }
            var paymentline_currency_id = paymentline.cashregister.currency_id[0]
            var paymentline_currency = this.pos.currency_by_id[paymentline_currency_id];
            var payment_rate = paymentline_currency['rate'];
            if (paymentline_currency['id'] != company_currency_data['id']) {
                active_multi_currency = true
            }
            if (!active_multi_currency || active_multi_currency == false) {
                return due;
            } else {
                var total_amount_with_tax = this.get_total_with_tax();
                if (!payment_rate || payment_rate == 0) {
                    return due
                }
                var new_due = total_amount_with_tax * payment_rate / company_currency_data['rate'];
                var lines = this.paymentlines.models;
                for (var i = 0; i < lines.length; i++) {
                    if (lines[i] === paymentline) {
                        break;
                    } else {
                        var line = lines[i];
                        var line_cashregister = line['cashregister'];
                        var line_currency_rate = this.pos.currency_by_id[line_cashregister['currency_id'][0]]['rate'];
                        var line_amount = lines[i].get_amount() * line_currency_rate;
                        new_due -= line_amount * payment_rate / company_currency_data['rate'];
                    }
                }
                var new_due = round_pr(Math.max(0, new_due), this.pos.currency.rounding);
                return new_due
            }
        },
        get_due_without_rounding: function (paymentline) {
            if (!paymentline) {
                var due = this.get_total_with_tax() - this.get_total_paid();
            } else {
                var due = this.get_total_with_tax();
                var lines = this.paymentlines.models;
                for (var i = 0; i < lines.length; i++) {
                    if (lines[i] === paymentline) {
                        break;
                    } else {
                        due -= lines[i].get_amount();
                    }
                }
            }
            return due;
        },
        get_total_paid: function () {
            var total_paid = _super_Order.get_total_paid.apply(this, arguments);
            var lines = this.paymentlines.models;
            var active_multi_currency = false;
            var total_paid_multi_currency = 0;
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                var currency = line.cashregister.currency_id;
                var company_currency = this.pos.company.currency_id;
                var company_currency_data = this.pos.currency_by_id[company_currency[0]];
                if (currency[0] != company_currency[0]) {
                    var register_currency = this.pos.currency_by_id[currency[0]];
                    var register_rate = register_currency['rate'];
                    active_multi_currency = true;
                    total_paid_multi_currency += line.get_amount() * register_rate / company_currency_data['rate'];
                } else {
                    total_paid_multi_currency += line.get_amount()
                }
            }
            if (active_multi_currency == true) {
                return round_pr(Math.max(0, total_paid_multi_currency), this.pos.currency.rounding);
            } else {
                return total_paid;
            }
        },
        generate_unique_ean13: function (array_code) {
            if (array_code.length != 12) {
                return -1
            }
            var evensum = 0;
            var oddsum = 0;
            for (var i = 0; i < array_code.length; i++) {
                if ((i % 2) == 0) {
                    evensum += parseInt(array_code[i])
                } else {
                    oddsum += parseInt(array_code[i])
                }
            }
            var total = oddsum * 3 + evensum
            return parseInt((10 - total % 10) % 10)
        },
        get_product_image_url: function (product) {
            return window.location.origin + '/web/image?model=product.product&field=image_medium&id=' + product.id;
        },
        add_product: function (product, options) {
            if (product['qty_available'] <= 0 && this.pos.config['allow_order_out_of_stock'] == false && product['type'] == 'product') {
                return this.pos.gui.show_popup('confirm', {
                    title: 'Warning',
                    body: 'Product is out of stock',
                });
            }
            var res = _super_Order.add_product.apply(this, arguments);
            var selected_orderline = this.selected_orderline;
            var combo_items = [];
            for (var i = 0; i < this.pos.combo_items.length; i++) {
                var combo_item = this.pos.combo_items[i];
                if (combo_item.product_combo_id[0] == selected_orderline.product.product_tmpl_id && combo_item.default == true) {
                    combo_items.push(combo_item);
                }
            }
            if (selected_orderline) {
                selected_orderline['combo_items'] = combo_items;
                selected_orderline.trigger('change', selected_orderline);
            }
            var product_tmpl_id = product['product_tmpl_id'];
            if (product_tmpl_id && product_tmpl_id.length == undefined && (product['cross_selling'] || product['suggestion_sale'])) {
                // cross selling
                var cross_items = _.filter(this.pos.cross_items, function (cross_item) {
                    return cross_item['product_tmpl_id'][0] == product_tmpl_id;
                });
                if (cross_items.length) {
                    this.pos.gui.show_popup('popup_cross_selling', {
                        widget: this,
                        cross_items: cross_items
                    });
                }
                var suggestion_items = _.filter(this.pos.suggestion_items, function (suggestion_item) {
                    return suggestion_item['product_tmpl_id'][0] == product_tmpl_id;
                });
                var contents = $('.product-list-re-comment'); // sale suggestion
                if (suggestion_items.length && contents) {
                    contents.empty();
                    contents.css({'display': 'table'})
                    for (var i = 0; i < suggestion_items.length; i++) {
                        var suggestion_product = this.pos.db.get_product_by_id(suggestion_items[i]['product_id'][0])
                        if (suggestion_product) {
                            var image_url = this.get_product_image_url(suggestion_product);
                            var product_html = qweb.render('product_suggestion', {
                                widget: this.pos.chrome,
                                suggestion: suggestion_items[i],
                                pricelist: this.pricelist || this.pos.default_pricelist,
                                image_url: image_url
                            });
                            contents.append(product_html);
                        }
                    }
                } else {
                    contents.css({'display': 'none'})
                }
            }
            return res
        },
        validation_order_can_do_internal_transfer: function () {
            var can_do = true;
            for (var i = 0; i < this.orderlines.models.length; i++) {
                var product = this.orderlines.models[i].product;
                if (product['type'] == 'service' || product['uom_po_id'] == undefined) {
                    can_do = false;
                }
            }
            if (this.orderlines.models.length == 0) {
                can_do = false;
            }
            return can_do;
        },
        // set prices list to order
        // this method only use for version 10
        set_pricelist_to_order: function (pricelist) {
            var self = this;
            if (!pricelist) {
                return;
            }
            this.pricelist = pricelist;
            // change price of current order lines
            _.each(this.get_orderlines(), function (line) {
                if (line['product']) {
                    var price = self.pos.get_price(line['product'], pricelist, line.quantity);
                    line['product']['price'] = price;
                    line.set_unit_price(price);
                }
            });
            // after update order lines price
            // will update screen product and with new price
            this.update_product_price(pricelist);
            this.trigger('change', this);
        },
        update_product_price: function (pricelist) {
            var self = this;
            var products = this.pos.products;
            if (!products) {
                return;
            }
            for (var i = 0; i < products.length; i++) {
                var product = products[i];
                var price = this.pos.get_price(product, pricelist, 1);
                product['price'] = price;
            }
            self.pos.trigger('product:change_price_list', products)
        }
    });

    // remove core method because could not overide
    // support multi variants and sale extra when cashies print via posbox
    _super_Order.computeChanges = function (categories) {
        var current_res = this.build_line_resume();
        var old_res = this.saved_resume || {};
        var json = this.export_as_JSON();
        var add = [];
        var rem = [];
        var line_hash;

        for (line_hash in current_res) {
            var curr = current_res[line_hash];
            var old = old_res[line_hash];

            if (typeof old === 'undefined') {
                var value = {
                    'id': curr.product_id,
                    'name': this.pos.db.get_product_by_id(curr.product_id).display_name,
                    'name_wrapped': curr.product_name_wrapped,
                    'note': curr.note,
                    'qty': curr.qty,
                };
                if (curr['sales_extra']) {
                    value['sales_extra'] = curr['sales_extra'];
                }
                if (curr['variants']) {
                    value['variants'] = curr['variants'];
                }
                add.push(value);

            } else if (old.qty < curr.qty) {
                var value = {
                    'id': curr.product_id,
                    'name': this.pos.db.get_product_by_id(curr.product_id).display_name,
                    'name_wrapped': curr.product_name_wrapped,
                    'note': curr.note,
                    'qty': curr.qty - old.qty,
                };
                if (curr['sales_extra']) {
                    value['sales_extra'] = curr['sales_extra'];
                }
                if (curr['variants']) {
                    value['variants'] = curr['variants'];
                }
                add.push(value);
            } else if (old.qty > curr.qty) {
                var value = {
                    'id': curr.product_id,
                    'name': this.pos.db.get_product_by_id(curr.product_id).display_name,
                    'name_wrapped': curr.product_name_wrapped,
                    'note': curr.note,
                    'qty': old.qty - curr.qty,
                };
                if (curr['sales_extra']) {
                    value['sales_extra'] = curr['sales_extra'];
                }
                rem.push(value);
            }
        }

        for (line_hash in old_res) {
            if (typeof current_res[line_hash] === 'undefined') {
                var old = old_res[line_hash];
                rem.push({
                    'id': old.product_id,
                    'name': this.pos.db.get_product_by_id(old.product_id).display_name,
                    'name_wrapped': old.product_name_wrapped,
                    'note': old.note,
                    'qty': old.qty,
                });
            }
        }

        if (categories && categories.length > 0) {
            // filter the added and removed orders to only contains
            // products that belong to one of the categories supplied as a parameter

            var self = this;

            var _add = [];
            var _rem = [];

            for (var i = 0; i < add.length; i++) {
                if (self.pos.db.is_product_in_category(categories, add[i].id)) {
                    _add.push(add[i]);
                }
            }
            add = _add;

            for (var i = 0; i < rem.length; i++) {
                if (self.pos.db.is_product_in_category(categories, rem[i].id)) {
                    _rem.push(rem[i]);
                }
            }
            rem = _rem;
        }

        var d = new Date();
        var hours = '' + d.getHours();
        hours = hours.length < 2 ? ('0' + hours) : hours;
        var minutes = '' + d.getMinutes();
        minutes = minutes.length < 2 ? ('0' + minutes) : minutes;

        return {
            'new': add,
            'cancelled': rem,
            'table': json.table || false,
            'floor': json.floor || false,
            'name': json.name || 'unknown order',
            'time': {
                'hours': hours,
                'minutes': minutes,
            }
        };
    };

    // overide core method printChanges
    _super_Order.printChanges = function () {
        this.pos.printer_receipts = {};
        var printers = this.pos.printers;
        for (var i = 0; i < printers.length; i++) {
            var changes = this.computeChanges(printers[i].config.product_categories_ids);
            if (changes['new'].length > 0 || changes['cancelled'].length > 0) {
                var receipt = qweb.render('OrderChangeReceipt', {changes: changes, widget: this});
                var report_xml = qweb.render('OrderChangeReceipt_html', {changes: changes, widget: this});
                this.pos.posbox_report_xml = receipt;
                this.pos.report_xml = report_xml;
                this.pos.printer_receipts[printers[i].config.id] = receipt;
                printers[i].print(receipt);
                this.pos.gui.show_screen('report');
            }
        }
    };

    //remove core method and add multi variants and sale extra to receipt kitchen
    _super_Order.build_line_resume = function () {
        var self = this;
        var new_resume = {};
        var sale_extra_temp = false;
        var multi_variant = false;
        this.orderlines.each(function (line) {
            if (line.mp_skip) {
                return;
            }
            var line_hash = line.get_line_diff_hash();
            var qty = Number(line.get_quantity());
            var note = line.get_note();
            var product_id = line.get_product().id;

            if (typeof new_resume[line_hash] === 'undefined') {
                new_resume[line_hash] = {
                    qty: qty,
                    note: note,
                    product_id: product_id,
                    product_name_wrapped: line.generate_wrapped_product_name(),
                };
                if (line['variants']) {
                    multi_variant = true;
                    new_resume[line_hash]['variants'] = line['variants'];
                }
                if (line['sales_extra']) {
                        sale_extra_temp = true;
                        new_resume[line_hash]['sales_extra'] = [];
                        for (var sale_extra_id in line['sales_extra']) {
                            var sale_extra = self.pos.sale_extra_by_id[sale_extra_id];
                            var product_id = sale_extra['product_id'][0];
                            if (!product_id) {
                                continue;
                            }
                            var product = self.pos.db.get_product_by_id(product_id)
                            new_resume[line_hash]['sales_extra'].push({
                                qty: line['sales_extra'][sale_extra_id],
                                note: 'Plus item',
                                product_id: product_id,
                                product_name_wrapped: product['display_name']
                            })
                        }
                    }
            } else {
                new_resume[line_hash].qty += qty;
            }
        });
        return new_resume
    };

    var _super_Orderline = models.Orderline.prototype;
    models.Orderline = models.Orderline.extend({
        initialize: function (attributes, options) {
            var res = _super_Orderline.initialize.apply(this, arguments);
            this.combo_items = this.combo_items || [];
            this.tags = this.tags || [];
            this.variants = this.variants || [];
            if (!this.variants) {
                this.variants = [];
            }
            return res;
        },
        init_from_JSON: function (json) {
            var res = _super_Orderline.init_from_JSON.apply(this, arguments);
            if (json.variants) {
                this.variants = json.variants
            }
            if (json.user_id) {
                var user = this.pos.user_by_id[json.user_id];
                if (user) {
                    this.set_sale_person(user)
                }
            }
            if (json.tag_ids && json.tag_ids.length) {
                this.tags = [];
                var tag_ids = json.tag_ids[0][2];
                for (var i = 0; i < tag_ids.length; i++) {
                    var tag_id = tag_ids[i];
                    var tag = this.pos.tag_by_id[tag_id];
                    this.tags.push(tag);
                }
            }
            if (json.is_return) {
                this.is_return = json.is_return;
            }
            if (json.uom_id) {
                this.uom_id = json.uom_id;
                var unit = this.pos.units_by_id[json.uom_id]
                if (unit) {
                    this.product.uom_id = [unit['id'], unit['name']];
                }
            }
            if (this.note) {
                this.note = this.set_line_note(json.note);
            }
            if (json.variants) {
                this.variants = json.variants
            }
            if (json.medical_insurance) {
                this.medical_insurance = json.medical_insurance;
            }
            if (json.frequent_buyer_id) {
                this.frequent_buyer_id = json.frequent_buyer_id;
            }
            return res;
        },
        export_as_JSON: function () {
            var json = _super_Orderline.export_as_JSON.apply(this, arguments);
            if (this.user_id) {
                json.user_id = this.user_id.id;
            }
            if (this.variants) {
                json.variants = this.variants;
            }
            if (this.tags) {
                var tag_ids = [];
                for (var i = 0; i < this.tags.length; i++) {
                    tag_ids.push(this.tags[i].id)
                }
                if (tag_ids.length) {
                    json.tag_ids = [[6, false, tag_ids]]
                }
            }
            if (this.get_line_note()) {
                json.note = this.get_line_note();
            }
            if (this.is_return) {
                json.is_return = this.is_return;
            }
            if (this.combo_items) {
                json.combo_items = this.combo_items;
            }
            if (this.uom_id) {
                json.uom_id = this.uom_id
            }
            if (this.variants) {
                json.variants = this.variants;
            }
            if (this.discount_reason) {
                json.discount_reason = this.discount_reason
            }
            if (this.medical_insurance) {
                json.medical_insurance = this.medical_insurance
            }
            if (this.frequent_buyer_id) {
                json.frequent_buyer_id = this.frequent_buyer_id
            }
            return json;
        },
        clone: function () {
            var orderline = _super_Orderline.clone.call(this);
            orderline.note = this.note;
            return orderline;
        },
        export_for_printing: function () {
            var receipt_line = _super_Orderline.export_for_printing.apply(this, arguments);
            receipt_line['combo_items'] = [];
            receipt_line['variants'] = [];
            receipt_line['tags'] = [];
            receipt_line['note'] = this.note || '';
            if (this.combo_items) {
                receipt_line['combo_items'] = this.combo_items;
            }
            if (this.variants) {
                receipt_line['variants'] = this.variants;
            }
            if (this.tags) {
                receipt_line['tags'] = this.tags;
            }
            if (this.discount_reason) {
                receipt_line['discount_reason'] = this.discount_reason;
            }
            receipt_line['tax_amount'] = this.get_tax() || 0.00;
            if (this.variants) {
                receipt_line['variants'] = this.variants;
            }
            return receipt_line;
        },
        get_price_tax_inclued: function () {
            /*
                Return subtotal tax included
            */
            var price = this.get_all_prices().priceWithTax;
            return price;
        },
        has_variants: function () {
            if (this.variants && this.variants.length && this.variants.length > 0) {
                return true
            } else {
                return false
            }
        },
        set_product_lot: function (product) {
            if (product) { // first install may be have old orders, this is reason made bug
                return _super_Orderline.set_product_lot.apply(this, arguments);
            } else {
                return null
            }
        },
        // if config product tax id: have difference tax of other company
        // but when load data account.tax, pos default only get data of current company
        // and this function return some item undefined
        get_taxes: function () {
            var taxes = _super_Orderline.export_for_printing.apply(this, arguments);
            var new_taxes = [];
            var taxes_ids = this.get_product().taxes_id;
            var taxes = [];
            for (var i = 0; i < taxes_ids.length; i++) {
                if (this.pos.taxes_by_id[taxes_ids[i]]) {
                    new_taxes.push(this.pos.taxes_by_id[taxes_ids[i]]);
                }
            }
            return new_taxes;
        },
        set_global_discount: function (discount) {
            this.discount_reason = discount.reason;
            this.set_discount(discount.amount);
            this.trigger('change', this);
        },
        change_unit: function () {
            var self = this;
            var product = this.product;
            var uom_items = this.pos.uoms_prices_by_product_tmpl_id[product.product_tmpl_id]
            if (!uom_items) {
                this.pos.gui.show_popup('notify_popup', {
                    title: 'ERROR',
                    from: 'top',
                    align: 'center',
                    body: product['display_name'] + ' have ' + product['uom_id'][1] + ' only.',
                    color: 'danger',
                    timer: 2000
                });
                return;
            }
            var list = [];
            for (var i = 0; i < uom_items.length; i++) {
                var item = uom_items[i];
                list.push({
                    'label': item.uom_id[1] + ', at price ' + item['price'],
                    'item': item,
                });
            }
            var base_uom_id = product['base_uom_id'];
            if (base_uom_id) {
                var base_uom = this.pos.uom_by_id[base_uom_id[0]];
                base_uom['price'] = product.list_price;
                base_uom['uom_id'] = base_uom['id'];
                list.push({
                    'label': base_uom['name'] + ', at price ' + base_uom['price'],
                    'item': base_uom
                })
            }
            if (list.length) {
                this.pos.gui.show_popup('selection', {
                    title: _t('Select Unit need to change'),
                    list: list,
                    confirm: function (item) {
                        self.uom_id = item['uom_id'][0];
                        self.trigger('change', this);
                        self.trigger('update:OrderLine');
                        self.set_unit_price(item['price']);
                        self.price_manually_set = true;
                        return true;
                    }
                });
            } else {
                return this.pos.gui.show_popup('confirm', {
                    title: 'Warning',
                    body: product['display_name'] + ' only one ' + product['uom_id'][1],
                });
            }
        },
        change_combo: function () {
            var line = this;
            var combo_items = _.filter(this.pos.combo_items, function (combo_item) {
                return combo_item.product_combo_id[0] == line.product.product_tmpl_id || combo_item.product_combo_id[0] == line.product.product_tmpl_id[0]
            });
            if (combo_items.length) {
                this.pos.gui.show_popup('popup_selection_combos', {
                    title: 'Please choice items',
                    combo_items: combo_items,
                    selected_orderline: this
                });
            } else {
                this.pos.gui.show_popup('confirm', {
                    title: 'Warning',
                    body: 'Product is combo but have not set combo items',
                });
            }
        },
        change_cross_selling: function () {
            var self = this;
            var cross_items = _.filter(this.pos.cross_items, function (cross_item) {
                return cross_item['product_tmpl_id'][0] == self.product.product_tmpl_id;
            });
            if (cross_items.length) {
                this.pos.gui.show_popup('popup_cross_selling', {
                    widget: this,
                    cross_items: cross_items
                });
            }
        },
        get_sale_person: function () {
            return this.user_id || null
        },
        get_number_of_order: function () {
            var uid = this.uid;
            var order = this.order;
            for (var i = 0; i < order.orderlines.models.length; i++) {
                var line = order.orderlines.models[i];
                if (line.uid == uid) {
                    return i + 1
                }
            }
        },
        set_sale_person: function (user) {
            this.user_id = user;
            this.trigger('change', this);
        },
        get_price_without_quantity: function () {
            if (this.quantity != 0) {
                return this.get_price_with_tax() / this.quantity
            } else {
                return 0
            }
        },
        get_line_image: function () { // show image on receipt and orderlines
            return window.location.origin + '/web/image?model=product.product&field=image_medium&id=' + this.product.id;
        },
        // ------------- **** --------------------------------------
        // when cashiers select line, auto pop-up cross sell items
        // or if product have suggestion items, render element show all suggestion items
        // ------------- **** --------------------------------------
        set_selected: function (selected) {
            _super_Orderline.set_selected.apply(this, arguments);
            var self = this;
            var contents = $('.product-list-re-comment');
            if (this.product && this.selected && (this.product['cross_selling'] || this.product['suggestion_sale'])) {
                var product_tmpl_id = this.product['product_tmpl_id'];
                if (product_tmpl_id && product_tmpl_id.length == undefined) {
                    var suggestion_items = _.filter(this.pos.suggestion_items, function (suggestion_item) {
                        return suggestion_item['product_tmpl_id'][0] == product_tmpl_id;
                    });
                    if (suggestion_items.length && contents) {
                        contents.empty();
                        contents.css({'display': 'inherit'})
                        for (var i = 0; i < suggestion_items.length; i++) {
                            var suggestion_product = this.pos.db.get_product_by_id(suggestion_items[i]['product_id'][0])
                            if (suggestion_product) {
                                var image_url = this.order.get_product_image_url(suggestion_product);
                                var product_html = qweb.render('product_suggestion', {
                                    widget: this.pos.chrome,
                                    suggestion: suggestion_items[i],
                                    pricelist: this.pricelist || this.pos.default_pricelist,
                                    image_url: image_url
                                });
                                contents.append(product_html);
                            }
                        }
                        $('.product-list-re-comment .product').click(function () {
                            var suggestion_id = parseInt($(this).data()['suggestionId']);
                            if (suggestion_id) {
                                var suggestion = self.pos.suggestion_by_id[suggestion_id];
                                var product_id = suggestion['product_id'][0];
                                var product = self.pos.db.get_product_by_id(product_id);
                                if (product) {
                                    self.pos.get_order().add_product(product);
                                    var selected_orderline = self.pos.get_order().selected_orderline;
                                    selected_orderline.set_unit_price(suggestion['list_price']);
                                    selected_orderline.set_quantity(suggestion['quantity'], 'keep price when add suggestion item');
                                }
                            }
                        })
                    } else if (!suggestion_items && contents) {
                        contents.css({'display': 'none'});
                    }
                }
            }
            if (this.selected == false) {
                contents.css({'display': 'none'})
            }
        },
        is_has_tags: function () {
            if (!this.tags || this.tags.length == 0) {
                return true
            } else {
                return false
            }
        },
        is_multi_variant: function () {
            var variants = this.pos.variant_by_product_tmpl_id[this.product.product_tmpl_id];
            if (!variants) {
                return false
            }
            if (variants.length > 0) {
                return true;
            } else {
                return false;
            }
        },
        get_price_discount: function () { // method return discount amount of pos order lines gui
            var price_unit = this.get_unit_price();
            var prices = this.get_all_prices();
            var priceWithTax = prices['priceWithTax'];
            var tax = prices['tax'];
            var discount = priceWithTax - tax - price_unit;
            return discount
        },
        get_unit: function () {
            if (!this.uom_id) {
                var unit = _super_Orderline.get_unit.apply(this, arguments);
                return unit;
            } else {
                var unit_id = this.uom_id;
                var unit = this.pos.units_by_id[unit_id];
                return unit;
            }
        },
        is_multi_unit_of_measure: function () {
            var uom_items = this.pos.uoms_prices_by_product_tmpl_id[this.product.product_tmpl_id];
            if (!uom_items) {
                return false;
            }
            if (uom_items.length > 0) {
                return true;
            } else {
                return false;
            }
        },
        is_combo: function () {
            var combo_items = [];
            for (var i = 0; i < this.pos.combo_items.length; i++) {
                var combo_item = this.pos.combo_items[i];
                if (combo_item.product_combo_id[0] == this.product['product_tmpl_id']) {
                    combo_items.push(combo_item);
                }
            }
            if (combo_items.length > 0) {
                return true
            } else {
                return false;
            }
        },
        has_combo_item_tracking_lot: function () {
            var tracking = false;
            for (var i = 0; i < this.pos.combo_items.length; i++) {
                var combo_item = this.pos.combo_items[i];
                if (combo_item['tracking']) {
                    tracking = true;
                }
            }
            return tracking;
        },
        set_quantity: function (quantity, keep_price) {
            var self = this;
            if (this.uom_id || this.redeem_point) {
                keep_price = 'keep price because changed uom id or have redeem point'
            }
            if (this.pos.the_first_load == false && quantity != 'remove' && this.pos.config['allow_order_out_of_stock'] == false && quantity && quantity != 'remove' && this.order.syncing != true && this.product['type'] != 'service') {
                var current_qty = 0
                for (var i = 0; i < this.order.orderlines.models.length; i++) {
                    var line = this.order.orderlines.models[i];
                    if (this.product.id == line.product.id && line.id != this.id) {
                        current_qty += line.quantity
                    }
                }
                current_qty += parseFloat(quantity);
                if (current_qty > this.product['qty_available'] && this.product['type'] == 'product') {
                    var product = this.pos.db.get_product_by_id(this.product.id);
                    return this.pos.gui.show_popup('confirm', {
                        title: 'Warning',
                        body: product['name'] + ' have quantity on hand is ' + product.qty_available + ' , you could not set bigger than ' + product.qty_available,
                    });
                }
            }
            var res = _super_Orderline.set_quantity.call(this, quantity, keep_price); // call style change parent parameter : keep_price
            var order = this.order;
            var orderlines = order.orderlines.models;
            if (!order.fiscal_position || orderlines.length != 0) {
                for (var i = 0; i < orderlines.length; i++) { // reset taxes_id of line
                    orderlines[i]['taxes_id'] = [];
                }
            }
            if (order.fiscal_position && orderlines.length) {
                var fiscal_position = order.fiscal_position;
                var fiscal_position_taxes_by_id = fiscal_position.fiscal_position_taxes_by_id
                if (fiscal_position_taxes_by_id) {
                    for (var number in fiscal_position_taxes_by_id) {
                        var fiscal_tax = fiscal_position_taxes_by_id[number];
                        var tax_src_id = fiscal_tax.tax_src_id;
                        var tax_dest_id = fiscal_tax.tax_dest_id;
                        if (tax_src_id && tax_dest_id) {
                            for (var i = 0; i < orderlines.length; i++) { // reset taxes_id of line
                                orderlines[i]['taxes_id'] = [];
                            }
                            for (var i = 0; i < orderlines.length; i++) { // append taxes_id of line
                                var line = orderlines[i];
                                var product = line.product;
                                var taxes_id = product.taxes_id;
                                for (var number in taxes_id) {
                                    var tax_id = taxes_id[number];
                                    if (tax_id == tax_src_id[0]) {
                                        orderlines[i]['taxes_id'].push(tax_dest_id[0]);
                                    }
                                }
                            }
                        }
                    }
                } else {
                    for (var i = 0; i < orderlines.length; i++) { // reset taxes_id of line
                        orderlines[i]['taxes_id'] = [];
                    }
                }
            }
            return res;
        },
        set_line_note: function (note) {
            this.note = note;
            if (this.syncing == false || !this.syncing) {
                if (this.pos.pos_bus) {
                    var order = this.order.export_as_JSON();
                    this.pos.pos_bus.push_message_to_other_sessions({
                        action: 'set_line_note',
                        data: {
                            uid: this.uid,
                            note: note,
                        },
                        bus_id: this.pos.config.bus_id[0],
                        order_uid: order.uid,
                    });
                }
            }
            this.trigger('change', this);
        },
        get_line_note: function (note) {
            return this.note;
        },
        can_be_merged_with: function (orderline) {
            var merge = _super_Orderline.can_be_merged_with.apply(this, arguments);
            var current_price = this.price;
            var line_add_price;
            if (this.pos.server_version == 10) {
                line_add_price = this.price;
            }
            if ([11, 12].indexOf(this.pos.server_version) != -1) {
                line_add_price = orderline.get_product().get_price(orderline.order.pricelist, this.get_quantity());
            }
            var current_price_round = round_pr(Math.max(0, current_price), this.pos.currency.rounding);
            var line_add_price_round = round_pr(Math.max(0, line_add_price), this.pos.currency.rounding);
            if (orderline.get_line_note() !== this.get_line_note()) {
                return false;
            }
            if (current_price != line_add_price && current_price_round == line_add_price_round) {
                if (this.get_product().id !== orderline.get_product().id) {
                    return false;
                } else if (!this.get_unit() || !this.get_unit().is_pos_groupable) {
                    return false;
                } else if (this.get_product_type() !== orderline.get_product_type()) {
                    return false;
                } else if (this.get_discount() > 0) {
                    return false;
                } else if (this.product.tracking == 'lot') {
                    return false;
                } else {
                    return true;
                }
            }
            return merge
        },
        // conflict with future change taxes
        // compute_all: function (taxes, price_unit, quantity, currency_rounding, no_map_tax) {
        //     var all_taxes = _super_Orderline.compute_all.apply(this, arguments);
        //     if (!this.taxes_id || this.taxes_id == [] || this.taxes_id.length == 0) {
        //         return all_taxes;
        //     } else {
        //         var taxes = [];
        //         for (var number in this.taxes_id) {
        //             taxes.push(this.pos.taxes_by_id[this.taxes_id[number]])
        //         }
        //         var self = this;
        //         var list_taxes = [];
        //         var currency_rounding_bak = currency_rounding;
        //         if (this.pos.company.tax_calculation_rounding_method == "round_globally") {
        //             currency_rounding = currency_rounding * 0.00001;
        //         }
        //         var total_excluded = round_pr(price_unit * quantity, currency_rounding);
        //         var total_included = total_excluded;
        //         var base = total_excluded;
        //         _(taxes).each(function (tax) {
        //             if (!no_map_tax) {
        //                 tax = self._map_tax_fiscal_position(tax);
        //             }
        //             if (!tax) {
        //                 return;
        //             }
        //             if (tax.amount_type === 'group') {
        //                 var ret = self.compute_all(tax.children_tax_ids, price_unit, quantity, currency_rounding);
        //                 total_excluded = ret.total_excluded;
        //                 base = ret.total_excluded;
        //                 total_included = ret.total_included;
        //                 list_taxes = list_taxes.concat(ret.taxes);
        //             } else {
        //                 var tax_amount = self._compute_all(tax, base, quantity);
        //                 tax_amount = round_pr(tax_amount, currency_rounding);
        //
        //                 if (tax_amount) {
        //                     if (tax.price_include) {
        //                         total_excluded -= tax_amount;
        //                         base -= tax_amount;
        //                     } else {
        //                         total_included += tax_amount;
        //                     }
        //                     if (tax.include_base_amount) {
        //                         base += tax_amount;
        //                     }
        //                     var data = {
        //                         id: tax.id,
        //                         amount: tax_amount,
        //                         name: tax.name,
        //                     };
        //                     list_taxes.push(data);
        //                 }
        //             }
        //         });
        //         var tax_values = {
        //             taxes: list_taxes,
        //             total_excluded: round_pr(total_excluded, currency_rounding_bak),
        //             total_included: round_pr(total_included, currency_rounding_bak)
        //         };
        //         return tax_values;
        //     }
        // },
    });
});
