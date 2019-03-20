"use strict";
odoo.define('pos_retail.screen_product_list', function (require) {

    var models = require('point_of_sale.models');
    var screens = require('point_of_sale.screens');
    var core = require('web.core');
    var utils = require('web.utils');
    var round_pr = utils.round_precision;
    var qweb = core.qweb;
    var _t = core._t;

    screens.ProductScreenWidget.include({
        start: function () {
            this._super();
            var action_buttons = this.action_buttons;
            if (!this.pos.config.mobile_responsive) {
                for (var key in action_buttons) {
                    action_buttons[key].appendTo(this.$('.button-list'));
                }
            }
            this.$('.control-buttons').addClass('oe_hidden');
        },
        show: function () {
            var self = this;
            this._super();
            if (!this.pos.config.mobile_responsive) {
                if (this.pos.show_left_buttons == true) {
                    $('.buttons_pane').animate({width: 300}, 'fast');
                    $('.leftpane').animate({left: 300}, 'fast');
                    $('.rightpane').animate({left: 740}, 'fast');
                    $('.show_hide_buttons .fa-caret-right').toggleClass('fa fa-th fa fa fa-caret-left');
                    this.pos.show_left_buttons = true;
                }
                if (this.pos.show_left_buttons == false) {
                    $('.buttons_pane').animate({width: 0}, 'fast');
                    $('.leftpane').animate({left: 0}, 'fast');
                    $('.rightpane').animate({left: 440}, 'fast');
                    $('.fa fa-list').toggleClass('highlight');
                    $('.show_hide_buttons .fa-list').toggleClass('fa fa-list fa fa-th');
                    this.pos.show_left_buttons = false;
                }
                $('.show_hide_buttons').addClass('highlight');
            }
            this.$('.add_customer').click(function () { // quickly add customer
                self.pos.gui.show_popup('popup_create_customer', {
                    title: 'Add customer'
                })
            });
            this.$('.add_product').click(function () { // quickly add product
                self.pos.gui.show_popup('popup_create_product', {
                    title: 'Add product',
                })
            });
            this.$('.add_pos_category').click(function () { // quickly add product
                self.pos.gui.show_popup('popup_create_pos_category', {
                    title: 'Add category'
                })
            });
            this.$('.quickly_payment').click(function () { // quickly payment
                if (!self.pos.config.quickly_payment_full_journal_id) {
                    return;
                }
                var order = self.pos.get_order();
                if (!order) {
                    return;
                }
                if (order.orderlines.length == 0) {
                    return self.pos.gui.show_popup('confirm', {
                        title: 'Error',
                        body: 'Your order empty'
                    })
                }
                var paymentlines = order.get_paymentlines();
                for (var i = 0; i < paymentlines.length; i++) {
                    paymentlines[i].destroy();
                }
                var register = _.find(self.pos.cashregisters, function (register) {
                    return register['journal']['id'] == self.pos.config.quickly_payment_full_journal_id[0];
                });
                if (!register) {
                    return self.pos.gui.show_popup('confirm', {
                        title: 'Error',
                        body: 'Your config not add quickly payment method, please add before use'
                    })
                }
                var amount_due = order.get_due();
                order.add_paymentline(register);
                var selected_paymentline = order.selected_paymentline;
                selected_paymentline.set_amount(amount_due);
                order.initialize_validation_date();
                self.pos.push_order(order);
                self.pos.gui.show_screen('receipt');

            });
            this.$('.product_list').click(function () {
                self.pos.config.product_view = 'list';
                self.product_list_widget = new screens.ProductListWidget(self, {
                    click_product_action: function (product) {
                        self.click_product(product);
                    },
                    product_list: self.pos.db.get_product_by_category(0)
                });
                self.product_list_widget.replace(self.$('.product-list-container'));
                self.product_categories_widget = new screens.ProductCategoriesWidget(self, {
                    product_list_widget: self.product_list_widget,
                });
                self.$('.category-list-scroller').remove();
                self.$('.categories').remove();
                self.product_categories_widget.replace(self.$('.rightpane-header'));
                $('input').click(function () {
                    self.pos.trigger('remove:keyboard_order');
                })
                self.$('.product_list').addClass('oe_hidden');
                self.$('.product_box').removeClass('oe_hidden');
            });
            this.$('.product_box').click(function () {
                self.pos.config.product_view = 'box';
                self.product_list_widget = new screens.ProductListWidget(self, {
                    click_product_action: function (product) {
                        self.click_product(product);
                    },
                    product_list: self.pos.db.get_product_by_category(0)
                });
                self.product_list_widget.replace(self.$('.product-list-container'));
                self.product_categories_widget = new screens.ProductCategoriesWidget(self, {
                    product_list_widget: self.product_list_widget,
                });
                self.$('.category-list-scroller').remove();
                self.$('.categories').remove();
                self.product_categories_widget.replace(self.$('.rightpane-header'));
                $('input').click(function () {
                    self.pos.trigger('remove:keyboard_order');
                })
                self.$('.product_box').addClass('oe_hidden');
                self.$('.product_list').removeClass('oe_hidden');
            });
            this.$('.lock_session').click(function () {
                $('.pos-content').addClass('oe_hidden');
                $('.pos-topheader').addClass('oe_hidden');
                return self.pos.gui.show_popup('ask_password', {
                    title: 'Locked',
                    body: 'Use pos security pin for unlock',
                    confirm: function (pw) {
                        if (!self.pos.user.pos_security_pin) {
                            $('.pos-content').removeClass('oe_hidden');
                            $('.pos-topheader').removeClass('oe_hidden');
                            return self.pos.gui.close_popup();
                        } else if (pw !== self.pos.user.pos_security_pin) {
                            self.pos.gui.show_popup('confirm', {
                                title: 'Warning',
                                body: 'Wrong pos security pin of user ' + self.pos.user.name
                            });
                            return setTimeout(function () {
                                $('.lock_session').click();
                            }, 2000);
                        } else {
                            $('.pos-content').removeClass('oe_hidden');
                            $('.pos-topheader').removeClass('oe_hidden');
                            return self.pos.gui.close_popup();
                        }
                    }
                });
            });
            this.$('.clear_blank_order').click(function () {
                var orders = self.pos.get('orders');
                var removed = 0;
                for (var i = 1; i < orders.models.length; i++) {
                    var order = orders.models[i];
                    if (order.orderlines.models.length == 0) {
                        order.destroy({'reason': 'abandon'});
                        removed += 1
                    }
                }
                if (removed == 0) {
                    return self.pos.gui.show_popup('confirm', {
                        title: 'Warning',
                        body: 'Your session have not orders blank'
                    });
                }
            });
            this.$('.sort_by').click(function () {
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
                self.gui.show_popup('selection', {
                    title: _t('Select sort by'),
                    list: list,
                    confirm: function (item) {
                        self.pos.config.default_product_sort_by = item;
                        self.pos.trigger('update:categories');
                    }
                });
            });
            this.$('.daily_report').click(function () {
                self.pos.trigger('remove:keyboard_order');
                self.pos.gui.show_screen('daily_report');
            });
            this.$('.print_receipt').click(function () {
                var order = self.pos.get_order();
                if (!order || order.orderlines.length == 0) {
                    return self.pos.gui.show_popup('confirm', {
                        title: 'Warning',
                        body: 'Your Order blank'
                    });
                }
                if (self.pos.config.lock_order_printed_receipt) {
                    self.pos.trigger('remove:keyboard_order');
                    return self.pos.gui.show_popup('confirm', {
                        title: _t('Are you want print receipt?'),
                        body: 'If POS-BOX(printer) is ready config IP, please check receipt at printer, else if POS-BOX and printer not ready will go to Receipt Screen',
                        confirm: function () {
                            var order = self.pos.get_order();
                            if (order) {
                                order['lock'] = true;
                                this.pos.lock_order();
                                if (self.pos.pos_bus) {
                                    this.pos.pos_bus.push_message_to_other_sessions({
                                        data: order.uid,
                                        action: 'lock_order',
                                        bus_id: this.pos.config.bus_id[0],
                                        order_uid: order['uid']
                                    });
                                }
                                return self.pos.gui.show_screen('receipt_review');
                            }
                        }
                    });
                } else {
                    self.pos.trigger('remove:keyboard_order');
                    return self.pos.gui.show_screen('receipt_review');
                }
            });
            var $order_screen_find_product_box = $('.search_products >input');
            $order_screen_find_product_box.autocomplete({
                source: this.pos.db.products_autocomplete,
                minLength: this.pos.config.min_length_search,
                select: function (event, ui) {
                    if (ui && ui['item'] && ui['item']['value'])
                        var product = self.pos.db.get_product_by_id(ui['item']['value']);
                    setTimeout(function () {
                        $('.order-container .searchbox >input').value = '';
                    }, 10);
                    if (product) {
                        return self.pos.get_order().add_product(product);
                    }
                }
            });
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
                            }, 10);
                        }
                    }
                }
            });
        }
    });

    screens.ProductListWidget.include({
        init: function (parent, options) {
            var self = this;
            this._super(parent, options);
            this.pos.bind('update:categories', function () {
                self.renderElement();
            }, this);
            // bind action only for v10
            // we are only change price of items display, not loop and change all, lost many memory RAM
            this.pos.bind('product:change_price_list', function (products) {
                try {
                    var $products_element = $('.product .product-img .price-tag');
                    for (var i = 0; i < $products_element.length; i++) {
                        var element = $products_element[i];
                        var product_id = parseInt(element.parentElement.parentElement.dataset.productId);
                        var product = self.pos.db.product_by_id(product_id);
                        if (product) {
                            var product = products[i];
                            var $product_el = $("[data-product-id='" + product['id'] + "'] .price-tag");
                            $product_el.html(self.format_currency(product['price']) + '/' + product['uom_id'][1]);
                        }
                    }
                } catch (e) {
                }
            });
            this.pos.bind('sync:product', function (product_data) { // product screen update screen
                self.pos.db.products_autocomplete = _.filter(self.pos.db.products_autocomplete, function (values) {
                    return values['value'] != product_data['id'];
                });
                var label = "";
                if (product_data['default_code']) {
                    label = '[' + product_data['default_code'] + ']'
                }
                if (product_data['barcode']) {
                    label = '[' + product_data['barcode'] + ']'
                }
                if (product_data['display_name']) {
                    label = '[' + product_data['display_name'] + ']'
                }
                if (product_data['description']) {
                    label = '[' + product_data['description'] + ']'
                }
                self.pos.db.products_autocomplete.push({
                    value: product_data['id'],
                    label: label
                });
                if (self.pos.server_version == 10) {
                    self.pos.db.add_products([product_data]);
                    self.pos.db.product_by_id[product_data['id']] = product_data;
                    self.product_cache.cache_node(product_data['id'], null);
                    var product_node = self.render_product(product_data);
                    product_node.addEventListener('click', self.click_product_handler);
                    var $product_el = $(".product-list " + "[data-product-id='" + product_data['id'] + "']");
                    if ($product_el.length > 0) {
                        $product_el.replaceWith(product_node);
                    }
                }
                if ([11, 12].indexOf(self.pos.server_version) != -1) {
                    var using_company_currency = self.pos.config.currency_id[0] === self.pos.company.currency_id[0];
                    if (self.pos.company_currency) {
                        var conversion_rate = self.pos.currency.rate / self.pos.company_currency.rate;
                    } else {
                        var conversion_rate = 1;
                    }
                    if (self.pos.stock_datas && self.pos.stock_datas[product_data['id']]) {
                        product_data['qty_available'] = self.pos.stock_datas[product_data['id']];
                    }
                    self.pos.db.add_products(_.map([product_data], function (product) {
                        if (!using_company_currency) {
                            product.lst_price = round_pr(product.lst_price * conversion_rate, self.pos.currency.rounding);
                        }
                        product.categ = _.findWhere(self.pos.product_categories, {'id': product['categ_id'][0]});
                        var product = new models.Product({}, product);
                        var current_pricelist = self._get_active_pricelist();
                        var cache_key = self.calculate_cache_key(product, current_pricelist);
                        self.product_cache.cache_node(cache_key, null);
                        var product_node = self.render_product(product);
                        product_node.addEventListener('click', self.click_product_handler);
                        var contents = document.querySelector(".product-list " + "[data-product-id='" + product['id'] + "']");
                        if (contents) {
                            contents.replaceWith(product_node)
                        }
                        return product;
                    }));
                }
            });
            this.mouse_down = false;
            this.moved = false;
            this.auto_tooltip;
            this.product_mouse_down = function (e) {
                if (e.which == 1) {
                    $('.info_tooltip').remove();
                    self.right_arrangement = false;
                    self.moved = false;
                    self.mouse_down = true;
                    self.touch_start(this.dataset.productId, e.pageX, e.pageY);
                }
            };
            this.product_mouse_move = function (e) {
                $('.info_tooltip').remove();
                self.touch_start(this.dataset.productId, e.pageX, e.pageY);
            };
        },
        touch_start: function (product_id, x, y) {
            var self = this;
            this.auto_tooltip = setTimeout(function () {
                if (self.moved == false) {
                    this.right_arrangement = false;
                    var product = self.pos.db.get_product_by_id(parseInt(product_id));
                    var inner_html = self.generate_html(product);
                    $('.product-list-container').prepend(inner_html);
                    $(".close_button").on("click", function () {
                        $('#info_tooltip').remove();
                    });
                }
            }, 30);
        },
        generate_html: function (product) {
            var self = this;
            var last_price;
            var last_order_name;
            var lines_need_check = [];
            var write_date;
            var order = this.pos.get_order();
            if (order && order.get_client()) {
                var client = order.get_client();
                var orders = _.filter(this.pos.db.orders_store, function (order) {
                    return order.partner_id && order.partner_id[0] == client['id'];
                });
                if (orders) {
                    for (var i = 0; i < orders.length; i++) {
                        var order = orders[i];
                        var old_lines = this.pos.db.lines_by_order_id[order.id];
                        for (var j = 0; j < old_lines.length; j++) {
                            var line = old_lines[j];
                            if (line.product_id && line.product_id[0] == product['id']) {
                                lines_need_check.push(line)
                            }
                        }
                    }
                }
            }
            if (lines_need_check.length) {
                for (var j = 0; j < lines_need_check.length; j++) {
                    var line = lines_need_check[j];
                    if (!write_date) {
                        write_date = line.write_date;
                        last_price = line.price_unit;
                        last_order_name = line.order_id[1];
                        continue;
                    }
                    if (last_price != line.write_date && new Date(last_price).getTime() < new Date(line.write_date).getTime()) {
                        write_date = line.write_date;
                        last_price = line.price_unit;
                        last_order_name = line.order_id[1];
                    }
                }
            }
            var product_tooltip_html = qweb.render('product_tooltip', {
                widget: self,
                product: product,
                last_price: last_price,
                last_order_name: last_order_name
            });
            return product_tooltip_html;
        },
        touch_end: function () {
            if (this.auto_tooltip) {
                clearTimeout(this.auto_tooltip);
            }
        },
        render_product: function (product) {
            if (this.pos.config.product_view == 'box') {
                return this._super(product)
            } else {
                if (this.pos.server_version == 10) {
                    var cached = this.product_cache.get_node(product.id);
                    if (!cached) {
                        var product_html = qweb.render('Product', {
                            widget: this,
                            product: product,
                            image_url: this.get_product_image_url(product),
                        });
                        var product_node = document.createElement('tbody');
                        product_node.innerHTML = product_html;
                        product_node = product_node.childNodes[1];
                        this.product_cache.cache_node(product.id, product_node);
                        return product_node;
                    }
                    return cached;
                }
                if ([11, 12].indexOf(this.pos.server_version) != -1) {
                    var current_pricelist = this._get_active_pricelist();
                    var cache_key = this.calculate_cache_key(product, current_pricelist);
                    var cached = this.product_cache.get_node(cache_key);
                    if (!cached) {
                        var product_html = qweb.render('Product', {
                            widget: this,
                            product: product,
                            pricelist: current_pricelist,
                            image_url: this.get_product_image_url(product),
                        });
                        var product_node = document.createElement('tbody');
                        product_node.innerHTML = product_html;
                        product_node = product_node.childNodes[1];
                        this.product_cache.cache_node(cache_key, product_node);
                        return product_node;
                    }
                    return cached;
                }
            }
        },
        renderElement: function () {
            var self = this;
            if (this.pos.config.active_product_sort_by) {
                if (this.pos.config.default_product_sort_by == 'a_z') {
                    this.product_list = this.product_list.sort(this.pos.sort_by('display_name', false, function (a) {
                        if (!a) {
                            a = 'N/A';
                        }
                        return a.toUpperCase()
                    }));
                } else if (this.pos.config.default_product_sort_by == 'z_a') {
                    this.product_list = this.product_list.sort(this.pos.sort_by('display_name', true, function (a) {
                        if (!a) {
                            a = 'N/A';
                        }
                        return a.toUpperCase()
                    }));
                } else if (this.pos.config.default_product_sort_by == 'low_price') {
                    this.product_list = this.product_list.sort(this.pos.sort_by('list_price', false, parseInt));
                } else if (this.pos.config.default_product_sort_by == 'high_price') {
                    this.product_list = this.product_list.sort(this.pos.sort_by('list_price', true, parseInt));
                } else if (this.pos.config.default_product_sort_by == 'pos_sequence') {
                    this.product_list = this.product_list.sort(this.pos.sort_by('pos_sequence', false, function (a) {
                        if (!a) {
                            a = 'N/A';
                        }
                        return a.toUpperCase()
                    }));
                }
            }
            if (this.pos.config.product_view == 'box') {
                this._super();
            } else {
                var el_str = qweb.render(this.template, {widget: this});
                var el_node = document.createElement('div');
                el_node.innerHTML = el_str;
                el_node = el_node.childNodes[1];

                if (this.el && this.el.parentNode) {
                    this.el.parentNode.replaceChild(el_node, this.el);
                }
                this.el = el_node;
                var list_container = el_node.querySelector('.product-list-contents');
                if (list_container) {
                    for (var i = 0, len = this.product_list.length; i < len; i++) {
                        var product_node = this.render_product(this.product_list[i]);
                        product_node.addEventListener('click', this.click_product_handler);
                        list_container.appendChild(product_node);
                    }
                }
            }
            if (this.pos.config.tooltip) {
                var caches = this.product_cache;
                for (var cache_key in caches.cache) {
                    var product_node = this.product_cache.get_node(cache_key);
                    product_node.addEventListener('click', this.click_product_handler);
                    product_node.addEventListener('mousedown', this.product_mouse_down);
                    product_node.addEventListener('mousemove', this.product_mouse_move);
                }
                $(".product-list-scroller").scroll(function (event) {
                    $('#info_tooltip').remove();
                });
            }
            $('.sort_by_product_id').click(function () {
                self.product_list = self.product_list.sort(self.pos.sort_by('id', self.reverse, parseInt));
                self.renderElement();
                self.reverse = !self.reverse;
            });
            $('.sort_by_product_name').click(function () {
                self.product_list = self.product_list.sort(self.pos.sort_by('display_name', self.reverse, function (a) {
                    if (!a) {
                        a = 'N/A';
                    }
                    return a.toUpperCase()
                }));
                self.renderElement();
                self.reverse = !self.reverse;
            });
            $('.sort_by_product_list_price').click(function () {
                self.product_list = self.product_list.sort(self.pos.sort_by('list_price', self.reverse, parseInt));
                self.renderElement();
                self.reverse = !self.reverse;
            });
            $('.sort_by_product_standard_price').click(function () {
                self.product_list = self.product_list.sort(self.pos.sort_by('standard_price', self.reverse, parseInt));
                self.renderElement();
                self.reverse = !self.reverse;
            });
            $('.sort_by_product_qty_available').click(function () {
                self.product_list = self.product_list.sort(self.pos.sort_by('qty_available', self.reverse, parseInt));
                self.renderElement();
                self.reverse = !self.reverse;
            });
        },
        _get_active_pricelist: function () {
            var current_order = this.pos.get_order();
            var current_pricelist = this.pos.default_pricelist;
            if (current_order && current_order.pricelist) {
                return this._super()
            } else {
                return current_pricelist
            }
        }
    });
});
