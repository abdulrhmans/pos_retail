"use strict";
odoo.define('pos_retail.promotion', function (require) {
    var time = require('web.time');
    var models = require('point_of_sale.models');
    var screens = require('point_of_sale.screens');
    var core = require('web.core');
    var qweb = core.qweb;
    var gui = require('point_of_sale.gui');
    var PopupWidget = require('point_of_sale.popups');

    models.load_models([
        {
            model: 'pos.promotion',
            condition: function (self) {
                return self.config.promotion_ids && self.config.promotion_ids.length != 0;
            },
            fields: ['name', 'start_date', 'end_date', 'type', 'product_id', 'discount_lowest_price', 'product_ids', 'minimum_items', 'discount_first_order'],
            domain: function (self) {
                return [
                    ['id', 'in', self.config.promotion_ids],
                    ['start_date', '<=', time.date_to_str(new Date()) + " " + time.time_to_str(new Date())],
                    ['end_date', '>=', time.date_to_str(new Date()) + " " + time.time_to_str(new Date())]
                ]
            },
            loaded: function (self, promotions) {
                self.promotions = promotions;
                self.promotion_by_id = {};
                self.promotion_ids = [];
                var i = 0;
                while (i < promotions.length) {
                    self.promotion_by_id[promotions[i].id] = promotions[i];
                    self.promotion_ids.push(promotions[i].id);
                    i++;
                }
            }
        }, {
            model: 'pos.promotion.discount.order',
            fields: ['minimum_amount', 'discount', 'promotion_id'],
            condition: function (self) {
                return self.promotion_ids && self.promotion_ids.length > 0;
            },
            domain: function (self) {
                return [['promotion_id', 'in', self.promotion_ids]]
            },
            loaded: function (self, discounts) {
                self.promotion_discount_order_by_id = {};
                self.promotion_discount_order_by_promotion_id = {};
                var i = 0;
                while (i < discounts.length) {
                    self.promotion_discount_order_by_id[discounts[i].id] = discounts[i];
                    if (!self.promotion_discount_order_by_promotion_id[discounts[i].promotion_id[0]]) {
                        self.promotion_discount_order_by_promotion_id[discounts[i].promotion_id[0]] = [discounts[i]]
                    } else {
                        self.promotion_discount_order_by_promotion_id[discounts[i].promotion_id[0]].push(discounts[i])
                    }
                    i++;
                }
            }
        }, {
            model: 'pos.promotion.discount.category',
            fields: ['category_id', 'discount', 'promotion_id'],
            condition: function (self) {
                return self.promotion_ids && self.promotion_ids.length > 0;
            },
            domain: function (self) {
                return [['promotion_id', 'in', self.promotion_ids]]
            },
            loaded: function (self, discounts_category) {
                self.promotion_by_category_id = {};
                var i = 0;
                while (i < discounts_category.length) {
                    self.promotion_by_category_id[discounts_category[i].category_id[0]] = discounts_category[i];
                    i++;
                }
            }
        }, {
            model: 'pos.promotion.discount.quantity',
            fields: ['product_id', 'quantity', 'discount', 'promotion_id'],
            condition: function (self) {
                return self.promotion_ids && self.promotion_ids.length > 0;
            },
            domain: function (self) {
                return [['promotion_id', 'in', self.promotion_ids]]
            },
            loaded: function (self, discounts_quantity) {
                self.promotion_quantity_by_product_id = {};
                var i = 0;
                while (i < discounts_quantity.length) {
                    if (!self.promotion_quantity_by_product_id[discounts_quantity[i].product_id[0]]) {
                        self.promotion_quantity_by_product_id[discounts_quantity[i].product_id[0]] = [discounts_quantity[i]]
                    } else {
                        self.promotion_quantity_by_product_id[discounts_quantity[i].product_id[0]].push(discounts_quantity[i])
                    }
                    i++;
                }
            }
        }, {
            model: 'pos.promotion.gift.condition',
            fields: ['product_id', 'minimum_quantity', 'promotion_id'],
            condition: function (self) {
                return self.promotion_ids && self.promotion_ids.length > 0;
            },
            domain: function (self) {
                return [['promotion_id', 'in', self.promotion_ids]]
            },
            loaded: function (self, gift_conditions) {
                self.promotion_gift_condition_by_promotion_id = {};
                var i = 0;
                while (i < gift_conditions.length) {
                    if (!self.promotion_gift_condition_by_promotion_id[gift_conditions[i].promotion_id[0]]) {
                        self.promotion_gift_condition_by_promotion_id[gift_conditions[i].promotion_id[0]] = [gift_conditions[i]]
                    } else {
                        self.promotion_gift_condition_by_promotion_id[gift_conditions[i].promotion_id[0]].push(gift_conditions[i])
                    }
                    i++;
                }
            }
        }, {
            model: 'pos.promotion.gift.free',
            fields: ['product_id', 'quantity_free', 'promotion_id'],
            condition: function (self) {
                return self.promotion_ids && self.promotion_ids.length > 0;
            },
            domain: function (self) {
                return [['promotion_id', 'in', self.promotion_ids]]
            },
            loaded: function (self, gifts_free) {
                self.promotion_gift_free_by_promotion_id = {};
                var i = 0;
                while (i < gifts_free.length) {
                    if (!self.promotion_gift_free_by_promotion_id[gifts_free[i].promotion_id[0]]) {
                        self.promotion_gift_free_by_promotion_id[gifts_free[i].promotion_id[0]] = [gifts_free[i]]
                    } else {
                        self.promotion_gift_free_by_promotion_id[gifts_free[i].promotion_id[0]].push(gifts_free[i])
                    }
                    i++;
                }
            }
        }, {
            model: 'pos.promotion.discount.condition',
            fields: ['product_id', 'minimum_quantity', 'promotion_id'],
            condition: function (self) {
                return self.promotion_ids && self.promotion_ids.length > 0;
            },
            domain: function (self) {
                return [['promotion_id', 'in', self.promotion_ids]]
            },
            loaded: function (self, discount_conditions) {
                self.promotion_discount_condition_by_promotion_id = {};
                var i = 0;
                while (i < discount_conditions.length) {
                    if (!self.promotion_discount_condition_by_promotion_id[discount_conditions[i].promotion_id[0]]) {
                        self.promotion_discount_condition_by_promotion_id[discount_conditions[i].promotion_id[0]] = [discount_conditions[i]]
                    } else {
                        self.promotion_discount_condition_by_promotion_id[discount_conditions[i].promotion_id[0]].push(discount_conditions[i])
                    }
                    i++;
                }
            }
        }, {
            model: 'pos.promotion.discount.apply',
            fields: ['product_id', 'discount', 'promotion_id', 'type'],
            condition: function (self) {
                return self.promotion_ids && self.promotion_ids.length > 0;
            },
            domain: function (self) {
                return [['promotion_id', 'in', self.promotion_ids]]
            },
            loaded: function (self, discounts_apply) {
                self.promotion_discount_apply_by_promotion_id = {};
                var i = 0;
                while (i < discounts_apply.length) {
                    if (!self.promotion_discount_apply_by_promotion_id[discounts_apply[i].promotion_id[0]]) {
                        self.promotion_discount_apply_by_promotion_id[discounts_apply[i].promotion_id[0]] = [discounts_apply[i]]
                    } else {
                        self.promotion_discount_apply_by_promotion_id[discounts_apply[i].promotion_id[0]].push(discounts_apply[i])
                    }
                    i++;
                }
            }
        }, {
            model: 'pos.promotion.price',
            fields: ['product_id', 'minimum_quantity', 'price_down', 'promotion_id'],
            condition: function (self) {
                return self.promotion_ids && self.promotion_ids.length > 0;
            },
            domain: function (self) {
                return [['promotion_id', 'in', self.promotion_ids]]
            },
            loaded: function (self, prices) {
                self.promotion_price_by_promotion_id = {};
                var i = 0;
                while (i < prices.length) {
                    if (!self.promotion_price_by_promotion_id[prices[i].promotion_id[0]]) {
                        self.promotion_price_by_promotion_id[prices[i].promotion_id[0]] = [prices[i]]
                    } else {
                        self.promotion_price_by_promotion_id[prices[i].promotion_id[0]].push(prices[i])
                    }
                    i++;
                }
            }
        }, {
            model: 'pos.promotion.special.category',
            fields: ['category_id', 'type', 'count', 'discount', 'promotion_id', 'product_id', 'qty_free'],
            condition: function (self) {
                return self.promotion_ids && self.promotion_ids.length > 0;
            },
            domain: function (self) {
                return [['promotion_id', 'in', self.promotion_ids]]
            },
            loaded: function (self, promotion_lines) {
                self.promotion_special_category_by_promotion_id = {};
                var i = 0;
                while (i < promotion_lines.length) {
                    if (!self.promotion_special_category_by_promotion_id[promotion_lines[i].promotion_id[0]]) {
                        self.promotion_special_category_by_promotion_id[promotion_lines[i].promotion_id[0]] = [promotion_lines[i]]
                    } else {
                        self.promotion_special_category_by_promotion_id[promotion_lines[i].promotion_id[0]].push(promotion_lines[i])
                    }
                    i++;
                }
            }
        }, {
            model: 'pos.promotion.multi.buy',
            fields: ['promotion_id', 'product_id', 'list_price', 'next_number'],
            condition: function (self) {
                return self.promotion_ids && self.promotion_ids.length > 0;
            },
            domain: function (self) {
                return [['promotion_id', 'in', self.promotion_ids]]
            },
            loaded: function (self, multi_buy) {
                self.multi_buy = multi_buy;
                self.multi_buy_by_product_id = {};
                for (var i = 0; i < multi_buy.length; i++) {
                    var rule = multi_buy[i];
                    self.multi_buy_by_product_id[rule['product_id'][0]] = rule;
                }
            }
        },
    ]);
    var _super_Orderline = models.Orderline.prototype;
    models.Orderline = models.Orderline.extend({
        init_from_JSON: function (json) {
            var res = _super_Orderline.init_from_JSON.apply(this, arguments);
            if (json.promotion) {
                this.promotion = json.promotion;
            }
            if (json.promotion_reason) {
                this.promotion_reason = json.promotion_reason;
            }
            if (json.promotion_discount_total_order) {
                this.promotion_discount_total_order = json.promotion_discount_total_order;
            }
            if (json.promotion_discount_category) {
                this.promotion_discount_category = json.promotion_discount_category;
            }
            if (json.promotion_discount_by_quantity) {
                this.promotion_discount_by_quantity = json.promotion_discount_by_quantity;
            }
            if (json.promotion_gift) {
                this.promotion_gift = json.promotion_gift;
            }
            if (json.promotion_discount) {
                this.promotion_discount = json.promotion_discount;
            }
            if (json.promotion_price_by_quantity) {
                this.promotion_price_by_quantity = json.promotion_price_by_quantity;
            }
            return res;
        },
        export_as_JSON: function () {
            var json = _super_Orderline.export_as_JSON.apply(this, arguments);
            if (this.promotion) {
                json.promotion = this.promotion;
            }
            if (this.promotion_reason) {
                json.promotion_reason = this.promotion_reason;
            }
            if (this.promotion_discount_total_order) {
                json.promotion_discount_total_order = this.promotion_discount_total_order;
            }
            if (this.promotion_discount_category) {
                json.promotion_discount_category = this.promotion_discount_category;
            }
            if (this.promotion_discount_by_quantity) {
                json.promotion_discount_by_quantity = this.promotion_discount_by_quantity;
            }
            if (this.promotion_discount) {
                json.promotion_discount = this.promotion_discount;
            }
            if (this.promotion_gift) {
                json.promotion_gift = this.promotion_gift;
            }
            if (this.promotion_price_by_quantity) {
                json.promotion_price_by_quantity = this.promotion_price_by_quantity;
            }

            return json;
        },
        export_for_printing: function () {
            var receipt_line = _super_Orderline.export_for_printing.apply(this, arguments);
            receipt_line['promotion'] = null;
            receipt_line['promotion_reason'] = null;
            if (this.promotion) {
                receipt_line.promotion = this.promotion;
                receipt_line.promotion_reason = this.promotion_reason;
            }
            return receipt_line;
        },
        can_be_merged_with: function (orderline) {
            var merge = _super_Orderline.can_be_merged_with.apply(this, arguments);
            if (this.promotion) {
                return false;
            }
            return merge
        },
        set_quantity: function (quantity, keep_price) {
            _super_Orderline.set_quantity.apply(this, arguments);
            if (!this.promotion && quantity == 'remove' || quantity == '') {
                this.order.remove_all_promotion_line();
            }
        }
    });
    var _super_Order = models.Order.prototype;
    models.Order = models.Order.extend({
        export_as_JSON: function () {
            var json = _super_Order.export_as_JSON.apply(this, arguments);
            if (this.promotion_amount) {
                json.promotion_amount = this.promotion_amount;
            }
            return json;
        },
        export_for_printing: function () {
            var receipt = _super_Order.export_for_printing.call(this);
            if (this.promotion_amount) {
                receipt.promotion_amount = this.promotion_amount;
            }
            return receipt
        },
        validate_promotion: function () {
            var self = this;
            var datas = this.get_promotions_active();
            var promotions_active = datas['promotions_active'];
            if (promotions_active.length) {
                this.pos.gui.show_screen('products');
                this.pos.gui.show_popup('confirm', {
                    title: 'Promotion active',
                    body: 'Do you want to apply promotion on this order ?',
                    confirm: function () {
                        self.remove_all_promotion_line();
                        self.compute_promotion();
                        setTimeout(function () {
                            self.validate_global_discount();
                        }, 1000);
                        self.pos.gui.show_screen('payment');
                    },
                    cancel: function () {
                        setTimeout(function () {
                            self.validate_global_discount();
                        }, 1000);
                        self.pos.gui.show_screen('payment');
                    }
                });
            } else {
                setTimeout(function () {
                    self.validate_global_discount();
                }, 1000);
            }
        },
        get_amount_total_without_promotion: function () {
            var lines = this.orderlines.models;
            var amount_total = 0;
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                if (!line.promotion) {
                    if (this.pos.config.iface_tax_included === 'total') {
                        amount_total += line.get_price_with_tax();
                    } else {
                        amount_total += line.get_price_without_tax();
                    }
                }
            }
            return amount_total;
        },
        manual_compute_promotion: function (promotions) {
            this.remove_all_promotion_line();
            for (var i = 0; i < promotions.length; i++) {
                var type = promotions[i].type
                var order = this;
                if (order.orderlines.length) {
                    if (type == '1_discount_total_order') {
                        order.compute_discount_total_order(promotions[i]);
                    }
                    if (type == '2_discount_category') {
                        order.compute_discount_category(promotions[i]);
                    }
                    if (type == '3_discount_by_quantity_of_product') {
                        order.compute_discount_by_quantity_of_products(promotions[i]);
                    }
                    if (type == '4_pack_discount') {
                        order.compute_pack_discount(promotions[i]);
                    }
                    if (type == '5_pack_free_gift') {
                        order.compute_pack_free_gift(promotions[i]);
                    }
                    if (type == '6_price_filter_quantity') {
                        order.compute_price_filter_quantity(promotions[i]);
                    }
                    if (type == '7_special_category') {
                        order.compute_special_category(promotions[i]);
                    }
                    if (type == '8_discount_lowest_price') {
                        order.compute_discount_lowest_price(promotions[i]);
                    }
                    if (type == '9_multi_buy') {
                        order.compute_multi_buy(promotions[i]);
                    }
                    if (type == '10_buy_x_get_another_free') {
                        order.compute_buy_x_get_another_free(promotions[i]);
                    }
                    if (type == '11_first_order') {
                        order.compute_first_order(promotions[i]);
                    }
                }
            }
            var applied_promotion = false;
            for (var i = 0; i < this.orderlines.models.length; i++) {
                if (this.orderlines.models[i]['promotion'] == true) {
                    applied_promotion = true;
                    break;
                }
            }
            if (applied_promotion == false) {
                return this.pos.gui.show_popup('confirm', {
                    title: 'Warning',
                    body: 'Have not any promotion applied',
                });
            }
        },
        compute_promotion: function () {
            var promotions = this.pos.promotions;
            if (promotions) {
                this.remove_all_promotion_line();
                for (var i = 0; i < promotions.length; i++) {
                    var type = promotions[i].type
                    var order = this;
                    if (order.orderlines.length) {
                        if (type == '1_discount_total_order') {
                            order.compute_discount_total_order(promotions[i]);
                        }
                        if (type == '2_discount_category') {
                            order.compute_discount_category(promotions[i]);
                        }
                        if (type == '3_discount_by_quantity_of_product') {
                            order.compute_discount_by_quantity_of_products(promotions[i]);
                        }
                        if (type == '4_pack_discount') {
                            order.compute_pack_discount(promotions[i]);
                        }
                        if (type == '5_pack_free_gift') {
                            order.compute_pack_free_gift(promotions[i]);
                        }
                        if (type == '6_price_filter_quantity') {
                            order.compute_price_filter_quantity(promotions[i]);
                        }
                        if (type == '7_special_category') {
                            order.compute_special_category(promotions[i]);
                        }
                        if (type == '8_discount_lowest_price') {
                            order.compute_discount_lowest_price(promotions[i]);
                        }
                        if (type == '9_multi_buy') {
                            order.compute_multi_buy(promotions[i]);
                        }
                        if (type == '10_buy_x_get_another_free') {
                            order.compute_buy_x_get_another_free(promotions[i]);
                        }
                        if (type == '11_first_order') {
                            order.compute_first_order(promotions[i]);
                        }
                    }
                }
                var applied_promotion = false;
                for (var i = 0; i < this.orderlines.models.length; i++) {
                    if (this.orderlines.models[i]['promotion'] == true) {
                        applied_promotion = true;
                        break;
                    }
                }
                if (applied_promotion == false) {
                    return this.pos.gui.show_popup('confirm', {
                        title: 'Warning',
                        body: 'Have not any promotion applied',
                    });
                }
            }
        },
        remove_all_buyer_promotion_line: function () {
            var lines = this.orderlines.models;
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                if (line['buyer_promotion']) {
                    this.remove_orderline(line);
                }
            }
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                if (line['buyer_promotion']) {
                    this.remove_orderline(line);
                }
            }
        },
        remove_all_promotion_line: function () {
            var lines = this.orderlines.models;
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                if (line['promotion'] || line['promotion_discount_total_order'] || line['promotion_discount_category'] || line['promotion_discount_by_quantity'] || line['promotion_discount'] || line['promotion_gift'] || line['promotion_price_by_quantity']) {
                    this.remove_orderline(line);
                }
            }
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                if (line['promotion'] || line['promotion_discount_total_order'] || line['promotion_discount_category'] || line['promotion_discount_by_quantity'] || line['promotion_discount'] || line['promotion_gift'] || line['promotion_price_by_quantity']) {
                    this.remove_orderline(line);
                }
            }
        },
        product_quantity_by_product_id: function () {
            var lines_list = {};
            var lines = this.orderlines.models;
            var i = 0;
            while (i < lines.length) {
                var line = lines[i];
                if (line.promotion) {
                    i++;
                    continue
                }
                if (!lines_list[line.product.id]) {
                    lines_list[line.product.id] = line.quantity;
                } else {
                    lines_list[line.product.id] += line.quantity;
                }
                i++;
            }
            return lines_list
        },
        // 1) check current order can apply discount by total order
        checking_apply_total_order: function (promotion) {
            var discount_lines = this.pos.promotion_discount_order_by_promotion_id[promotion.id];
            var total_order = this.get_amount_total_without_promotion();
            var discount_line_tmp = null;
            var discount_tmp = 0;
            if (discount_lines) {
                var i = 0;
                while (i < discount_lines.length) {
                    var discount_line = discount_lines[i];
                    if (total_order >= discount_line.minimum_amount && total_order >= discount_tmp) {
                        discount_line_tmp = discount_line;
                        discount_tmp = discount_line.minimum_amount
                    }
                    i++;
                }
            }
            return discount_line_tmp;
        },
        // 2) check current order can apply discount by categories
        checking_can_discount_by_categories: function (promotion) {
            var can_apply = false;
            var product = this.pos.db.get_product_by_id(promotion.product_id[0]);
            if (!product || !this.pos.promotion_by_category_id) {
                return false;
            }
            for (var i in this.pos.promotion_by_category_id) {
                var promotion_line = this.pos.promotion_by_category_id[i];
                var amount_total_by_category = 0;
                var z = 0;
                var lines = this.orderlines.models;
                while (z < lines.length) {
                    if (!lines[z].product.pos_categ_id) {
                        z++;
                        continue;
                    }
                    if (lines[z].product.pos_categ_id[0] == promotion_line.category_id[0]) {
                        amount_total_by_category += lines[z].get_price_without_tax();
                    }
                    z++;
                }
                if (amount_total_by_category > 0) {
                    can_apply = true
                }
            }
            return can_apply
        },
        // 3) check condition for apply discount by quantity product
        checking_apply_discount_filter_by_quantity_of_product: function (promotion) {
            var can_apply = false;
            var rules = this.pos.promotion_quantity_by_product_id;
            var product_quantity_by_product_id = this.product_quantity_by_product_id();
            for (var product_id in product_quantity_by_product_id) {
                var rules_by_product_id = rules[product_id];
                if (rules_by_product_id) {
                    for (var i = 0; i < rules_by_product_id.length; i++) {
                        var rule = rules_by_product_id[i];
                        if (rule && product_quantity_by_product_id[product_id] >= rule.quantity) {
                            can_apply = true;
                        }
                    }
                }
            }
            return can_apply;
        },
        // 4 & 5 : check pack free gift and pack discount product
        checking_pack_discount_and_pack_free_gift: function (rules) {
            var can_apply = true;
            var product_quantity_by_product_id = this.product_quantity_by_product_id();
            for (var i = 0; i < rules.length; i++) {
                var rule = rules[i];
                var product_id = parseInt(rule.product_id[0]);
                var minimum_quantity = rule.minimum_quantity;
                if (!product_quantity_by_product_id[product_id] || product_quantity_by_product_id[product_id] < minimum_quantity) {
                    can_apply = false;
                }
            }
            return can_apply
        },
        // 6. check condition for apply price filter by quantity of product
        checking_apply_price_filter_by_quantity_of_product: function (promotion) {
            var condition = false;
            var rules = this.pos.promotion_price_by_promotion_id[promotion.id];
            var product_quantity_by_product_id = this.product_quantity_by_product_id();
            for (var i = 0; i < rules.length; i++) {
                var rule = rules[i];
                if (rule && product_quantity_by_product_id[rule.product_id[0]] && product_quantity_by_product_id[rule.product_id[0]] >= rule.minimum_quantity) {
                    condition = true;
                }
            }
            return condition;
        },
        // 7. checking promotion special category
        checking_apply_specical_category: function (promotion) {
            var condition = false;
            var promotion_lines = this.pos.promotion_special_category_by_promotion_id[promotion['id']];
            this.lines_by_category_id = {};
            for (var i = 0; i < this.orderlines.models.length; i++) {
                var line = this.orderlines.models[i];
                var pos_categ_id = line['product']['pos_categ_id'][0]
                if (pos_categ_id) {
                    if (!this.lines_by_category_id[pos_categ_id]) {
                        this.lines_by_category_id[pos_categ_id] = [line]
                    } else {
                        this.lines_by_category_id[pos_categ_id].push(line)
                    }
                }
            }
            for (var i = 0; i < promotion_lines.length; i++) {
                var promotion_line = promotion_lines[i];
                var categ_id = promotion_line['category_id'][0];
                var total_quantity = 0;

                if (this.lines_by_category_id[categ_id]) {
                    var total_quantity = 0;
                    for (var i = 0; i < this.lines_by_category_id[categ_id].length; i++) {
                        total_quantity += this.lines_by_category_id[categ_id][i]['quantity']
                    }
                    if (promotion_line['count'] <= total_quantity) {
                        condition = true;
                    }
                }
            }
            return condition;
        },
        // 9. checking multi buy
        checking_multi_by: function (promotion) {
            var can_apply = false;
            var total_qty_by_product = {};
            for (var i = 0; i < this.orderlines.models.length; i++) {
                var line = this.orderlines.models[i];
                if (!total_qty_by_product[line.product.id]) {
                    total_qty_by_product[line.product.id] = line.quantity;
                } else {
                    total_qty_by_product[line.product.id] += line.quantity;
                }
            }
            for (var i = 0; i < this.orderlines.models.length; i++) {
                var line = this.orderlines.models[i];
                var product_id = line.product.id;
                var rule = this.pos.multi_buy_by_product_id[product_id];
                if (rule && rule['next_number'] <= total_qty_by_product[product_id]) {
                    can_apply = true;
                    break;
                }

            }
            return can_apply;
        },
        // 10. checking multi buy
        checking_buy_x_get_another_free: function (promotion) {
            var can_apply = false;
            var minimum_items = promotion['minimum_items'];
            var lines_will_apply_promotion = _.filter(this.orderlines.models, function (line) {
                if (promotion['product_ids'].indexOf(line.product.id) != -1 && !line.promotion) {
                    return true
                }
            });
            if (lines_will_apply_promotion.length && lines_will_apply_promotion.length >= minimum_items) {
                can_apply = true;
            }
            return can_apply;
        },
        // 11. checking first order of customer
        checking_first_order_of_customer: function () {
            var order;
            if (this.get_client()) {
                var client = this.get_client();
                order = _.filter(this.pos.db.orders_store, function(order) {
                    return order.partner_id && order.partner_id[0] == client['id']
                })
            }
            if (order) {
                return true
            } else {
                return false
            }
        },

        compute_discount_total_order: function (promotion) { // 1. compute discount filter by total order
            /*
                1. Promotion discount by total order
            */
            var discount_line_tmp = this.checking_apply_total_order(promotion)
            if (discount_line_tmp == null) {
                return false;
            }
            var total_order = this.get_amount_total_without_promotion();
            if (discount_line_tmp && total_order > 0) {
                var product = this.pos.db.get_product_by_id(promotion.product_id[0]);
                var price = -total_order / 100 * discount_line_tmp.discount
                if (product && price != 0) {
                    var options = {};
                    options.promotion_discount_total_order = true;
                    options.promotion = true;
                    options.promotion_reason = 'discount ' + discount_line_tmp.discount + ' % ' + ' because total order greater or equal ' + discount_line_tmp.minimum_amount;
                    this.add_promotion(product, price, 1, options)
                }
            }
        },
        compute_discount_category: function (promotion) { // 2. compute discount filter by product categories
            /*
                2. Promotion discount by pos categories
            */
            var product = this.pos.db.get_product_by_id(promotion.product_id[0]);
            if (!product || !this.pos.promotion_by_category_id) {
                return false;
            }
            var can_apply = this.checking_can_discount_by_categories(promotion);
            if (can_apply == false) {
                return false;
            }
            for (var i in this.pos.promotion_by_category_id) {
                var promotion_line = this.pos.promotion_by_category_id[i];
                var amount_total_by_category = 0;
                var lines = this.orderlines.models;
                for (var i = 0; i < lines.length; i++) {
                    var line = lines[i];
                    if (line.promotion || line.product.pos_categ_id[0] != promotion_line.category_id[0]) {
                        continue
                    } else {
                        if (this.pos.config.iface_tax_included === 'total') {
                            amount_total_by_category += line.get_price_with_tax() * (1 - line.get_discount() / 100)
                        } else {
                            amount_total_by_category += line.get_unit_price() * line.get_quantity() * (1 - line.get_discount() / 100)
                        }
                    }
                }
                if (amount_total_by_category != 0) {
                    var price = -amount_total_by_category / 100 * promotion_line.discount
                    this.add_promotion(product, price, 1, {
                        promotion_discount_category: true,
                        promotion: true,
                        promotion_reason: ' discount ' + promotion_line.discount + ' % from ' + promotion_line.category_id[1],
                    })
                }
            }
        },
        compute_discount_by_quantity_of_products: function (promotion) {
            /*
                3. Promotion discount by quantities of product
            */
            var check = this.checking_apply_discount_filter_by_quantity_of_product(promotion)
            if (check == false) {
                return;
            }
            if (this.orderlines.models.length == 0) {
                return;
            }
            var quantity_by_product_id = {}
            var product = this.pos.db.get_product_by_id(promotion.product_id[0]);
            var i = 0;
            var lines = this.orderlines.models;
            while (i < lines.length) {
                var line = lines[i];
                if (!quantity_by_product_id[line.product.id]) {
                    quantity_by_product_id[line.product.id] = line.quantity;
                } else {
                    quantity_by_product_id[line.product.id] += line.quantity;
                }
                i++;
            }
            for (i in quantity_by_product_id) {
                var product_id = i;
                var promotion_lines = this.pos.promotion_quantity_by_product_id[product_id];
                if (!promotion_lines) {
                    continue;
                }
                var quantity_tmp = 0;
                var promotion_line = null;
                var j = 0;
                for (j in promotion_lines) {
                    if (quantity_tmp <= promotion_lines[j].quantity && quantity_by_product_id[i] >= promotion_lines[j].quantity) {
                        promotion_line = promotion_lines[j];
                        quantity_tmp = promotion_lines[j].quantity
                    }
                }
                var lines = this.orderlines.models;
                var amount_total_by_product = 0;
                for (var i = 0; i < lines.length; i++) {
                    var line = lines[i];
                    if (line.promotion_discount_by_quantity) {
                        this.remove_orderline(lines[i]);
                    }
                    if (line.promotion) {
                        continue
                    }
                    if (line.product.id == product_id && !line.promotio) {
                        if (this.pos.config.iface_tax_included === 'total') {
                            amount_total_by_product += line.get_price_with_tax() * (1 - line.get_discount() / 100)
                        } else {
                            amount_total_by_product += line.get_unit_price() * line.get_quantity() * (1 - line.get_discount() / 100)
                        }
                    }
                }
                if (amount_total_by_product != 0 && promotion_line) {
                    this.add_promotion(product, -amount_total_by_product / 100 * promotion_line.discount, 1, {
                        promotion_discount_by_quantity: true,
                        promotion: true,
                        promotion_reason: ' discount ' + promotion_line.discount + ' % when ' + promotion_line.product_id[1] + ' have quantity greater or equal ' + promotion_line.quantity,
                    })
                }
            }
        },
        compute_pack_discount: function (promotion) {
            /*
                4. Promotion discount by pack products
            */
            var promotion_condition_items = this.pos.promotion_discount_condition_by_promotion_id[promotion.id];
            var product = this.pos.db.get_product_by_id(promotion.product_id[0]);
            var check = this.checking_pack_discount_and_pack_free_gift(promotion_condition_items);
            if (check == true) {
                var discount_items = this.pos.promotion_discount_apply_by_promotion_id[promotion.id]
                if (!discount_items) {
                    return;
                }
                var i = 0;
                while (i < discount_items.length) {
                    var discount_item = discount_items[i];
                    var discount = 0;
                    var total_qty = 0;
                    var lines = this.orderlines.models;
                    for (var j = 0; j < lines.length; j++) {
                        if (lines[j].promotion) {
                            continue;
                        }
                        var line = lines[j];
                        if (line.product.id == discount_item.product_id[0]) {
                            total_qty += line.quantity
                            if (this.pos.config.iface_tax_included === 'total') {
                                discount += line.get_price_with_tax() * (1 - line.get_discount() / 100)
                            } else {
                                discount += line.get_unit_price() * line.get_quantity() * (1 - line.get_discount() / 100)
                            }
                        }
                    }
                    if (discount_item.type == 'one') {
                        discount = discount / total_qty;
                    }
                    if (product && discount != 0) {
                        this.add_promotion(product, -discount / 100 * discount_item.discount, 1, {
                            promotion: true,
                            promotion_discount: true,
                            promotion_reason: promotion['name'] + ', discount ' + discount_item.product_id[1]
                        })
                    }
                    i++;
                }
            }
        },
        count_quantity_by_product: function (product) {
            /*
                Function return total qty filter by product of order
            */
            var qty = 0;
            for (var i = 0; i < this.orderlines.models.length; i++) {
                var line = this.orderlines.models[i];
                if (line.product['id'] == product['id']) {
                    qty += line['quantity'];
                }
            }
            return qty;
        },
        compute_pack_free_gift: function (promotion) {
            /*
                5. Promotion free gift by pack products
            */
            var promotion_condition_items = this.pos.promotion_gift_condition_by_promotion_id[promotion.id];
            var check = this.checking_pack_discount_and_pack_free_gift(promotion_condition_items);
            if (check == true) {
                var gifts = this.pos.promotion_gift_free_by_promotion_id[promotion.id]
                if (!gifts) {
                    return;
                }
                var products_condition = {};
                for (var i = 0; i < promotion_condition_items.length; i++) {
                    var condition = promotion_condition_items[i];
                    var product = this.pos.db.get_product_by_id(condition.product_id[0]);
                    products_condition[product['id']] = this.count_quantity_by_product(product)
                }
                var can_continue = true;
                var temp = 1;
                for (var i = 1; i < 100; i++) {
                    for (var j = 0; j < promotion_condition_items.length; j++) {
                        var condition = promotion_condition_items[j];
                        var condition_qty = condition.minimum_quantity;
                        var product = this.pos.db.get_product_by_id(condition.product_id[0]);
                        var total_qty = this.count_quantity_by_product(product);
                        if (i * condition_qty <= total_qty) {
                            can_continue = true;
                        } else {
                            can_continue = false
                        }
                    }
                    if (can_continue == true) {
                        temp = i;
                    } else {
                        break;
                    }
                }
                var i = 0;
                while (i < gifts.length) {
                    var product = this.pos.db.get_product_by_id(gifts[i].product_id[0]);
                    if (product) {
                        this.add_promotion(product, 0, -(gifts[i].quantity_free * temp), {
                            promotion: true,
                            promotion_gift: true,
                            promotion_reason: 'Applied  ' + promotion['name'] + ', give ' + (gifts[i].quantity_free * temp) + ' ' + product['display_name'],
                        })
                    }
                    i++;
                }
            }
        },
        compute_price_filter_quantity: function (promotion) {
            /*
                6. Promotion set price filter by quantities of product
                Sale off each products
            */
            var promotion_prices = this.pos.promotion_price_by_promotion_id[promotion.id];
            var product = this.pos.db.get_product_by_id(promotion.product_id[0]);
            var lines = this.orderlines.models;
            if (promotion_prices) {
                var prices_item_by_product_id = {};
                for (var i = 0; i < promotion_prices.length; i++) {
                    var item = promotion_prices[i];
                    if (!prices_item_by_product_id[item.product_id[0]]) {
                        prices_item_by_product_id[item.product_id[0]] = [item]
                    } else {
                        prices_item_by_product_id[item.product_id[0]].push(item)
                    }
                }
                var quantity_by_product_id = this.product_quantity_by_product_id();
                for (i in quantity_by_product_id) {
                    var price_discount = 0;
                    if (prices_item_by_product_id[i]) {
                        var quantity_tmp = 0;
                        var price_item_tmp = null;
                        // root: quantity line, we'll compare this with 2 variable quantity line greater minimum quantity of item and greater quantity temp
                        for (var j = 0; j < prices_item_by_product_id[i].length; j++) {
                            var price_item = prices_item_by_product_id[i][j];
                            if (quantity_by_product_id[i] >= price_item.minimum_quantity && quantity_by_product_id[i] >= quantity_tmp) {
                                quantity_tmp = price_item.minimum_quantity;
                                price_item_tmp = price_item;
                            }
                        }
                        if (price_item_tmp) {
                            var price_discount = 0;
                            for (var j = 0; j < lines.length; j++) {
                                var line = lines[j];
                                if (line.quantity <= 0) {
                                    continue;
                                }
                                if (line.product.id == price_item_tmp.product_id[0]) {
                                    price_discount += line.quantity * price_item_tmp['price_down'];
                                }
                            }
                            if (price_discount != 0) {
                                this.add_promotion(product, price_discount, -1, {
                                    promotion: true,
                                    promotion_price_by_quantity: true,
                                    promotion_reason: promotion['name'] + ', By greater or equal ' + price_item_tmp.minimum_quantity + ' ' + price_item_tmp.product_id[1] + ' price down  ' + price_item_tmp['price_down'] + ' / unit.'
                                })
                            }
                        }
                    }
                }
            }
        },
        compute_special_category: function (promotion) {
            /*
                7. Promotion filter by special category
            */
            var product_service = this.pos.db.product_by_id[promotion['product_id'][0]];
            var promotion_lines = this.pos.promotion_special_category_by_promotion_id[promotion['id']];
            this.lines_by_category_id = {};
            for (var i = 0; i < this.orderlines.models.length; i++) {
                var line = this.orderlines.models[i];
                if (line.promotion) {
                    continue;
                }
                var pos_categ_id = line['product']['pos_categ_id'][0]
                if (pos_categ_id) {
                    if (!this.lines_by_category_id[pos_categ_id]) {
                        this.lines_by_category_id[pos_categ_id] = [line]
                    } else {
                        this.lines_by_category_id[pos_categ_id].push(line)
                    }
                }
            }
            for (var i = 0; i < promotion_lines.length; i++) {
                var promotion_line = promotion_lines[i];
                var categ_id = promotion_line['category_id'][0];
                if (this.lines_by_category_id[categ_id]) {
                    var total_quantity = 0;
                    for (var i = 0; i < this.lines_by_category_id[categ_id].length; i++) {
                        total_quantity += this.lines_by_category_id[categ_id][i]['quantity']
                    }
                    if (promotion_line['count'] <= total_quantity) {
                        var promotion_type = promotion_line['type'];
                        if (promotion_type == 'discount') {
                            var discount = 0;
                            var quantity = 0;
                            var lines = this.lines_by_category_id[categ_id];
                            for (var j = 0; j < lines.length; j++) {
                                quantity += lines[j]['quantity'];
                                var line = lines[j];
                                if (quantity >= promotion_line['count']) {
                                    if (this.pos.config.iface_tax_included === 'total') {
                                        discount += line.get_price_with_tax() / 100 / line['quantity'] * promotion_line['discount']
                                    } else {
                                        discount += line.get_price_without_tax() / 100 / line['quantity'] * promotion_line['discount']
                                    }
                                }
                            }
                            if (discount != 0) {
                                this.add_promotion(product_service, -discount, 1, {
                                    promotion: true,
                                    promotion_special_category: true,
                                    promotion_reason: promotion['name'] + ',Buy bigger than or equal ' + promotion_line['count'] + ' product of ' + promotion_line['category_id'][1] + ' discount ' + promotion_line['discount'] + ' %'
                                })
                            }
                        }
                        if (promotion_type == 'free') {
                            var product_free = this.pos.db.product_by_id[promotion_line['product_id'][0]];
                            if (product_free) {
                                this.add_promotion(product_free, 0, promotion_line['qty_free'], {
                                    promotion: true,
                                    promotion_special_category: true,
                                    promotion_reason: promotion['name'] + ', Buy bigger than or equal ' + promotion_line['count'] + ' product of ' + promotion_line['category_id'][1] + ' free ' + promotion_line['qty_free'] + ' ' + product_free['display_name']
                                })
                            }
                        }
                    }
                }
            }
        },
        compute_discount_lowest_price: function (promotion) { // compute discount lowest price
            var orderlines = this.orderlines.models;
            var line_apply = null;
            for (var i = 0; i < orderlines.length; i++) {
                var line = orderlines[i];
                if (!line_apply) {
                    line_apply = line
                } else {
                    if (line.get_price_with_tax() < line_apply.get_price_with_tax()) {
                        line_apply = line;
                    }
                }
            }
            var product_discount = this.pos.db.product_by_id[promotion.product_id[0]];
            if (line_apply && product_discount) {
                var price;
                if (this.pos.config.iface_tax_included === 'total') {
                    price = line_apply.get_price_with_tax()
                } else {
                    price = line_apply.get_price_without_tax()
                }
                this.add_promotion(product_discount, price, -1, {
                    promotion: true,
                    promotion_discount_lowest_price: true,
                    promotion_reason: promotion['name'] + ', discount ' + promotion.discount_lowest_price + ' % on product ' + line_apply.product.display_name
                })
            }
        },
        compute_multi_buy: function (promotion) { // compute multi by
            var rule_applied = {};
            var total_qty_by_product = {};
            var total_price_by_product = {};
            for (var i = 0; i < this.orderlines.models.length; i++) {
                var line = this.orderlines.models[i];
                var product_id = line.product.id;
                var rule = this.pos.multi_buy_by_product_id[product_id];
                if (!total_qty_by_product[line.product.id]) {
                    total_qty_by_product[line.product.id] = line.quantity;
                } else {
                    total_qty_by_product[line.product.id] += line.quantity;
                }
                if (rule && rule['promotion_id'][0] == promotion['id']) {
                    rule_applied[rule['product_id'][0]] = rule;
                }
                if (this.pos.config.iface_tax_included === 'total') {
                    if (!total_price_by_product[line.product.id]) {
                        total_price_by_product[line.product.id] = line.get_price_with_tax();
                    } else {
                        total_price_by_product[line.product.id] += line.get_price_with_tax();
                    }
                } else {
                    if (!total_price_by_product[line.product.id]) {
                        total_price_by_product[line.product.id] = line.get_price_without_tax();
                    } else {
                        total_price_by_product[line.product.id] += line.get_price_without_tax();
                    }
                }
            }
            var product_discount = this.pos.db.product_by_id[promotion.product_id[0]];
            if (rule_applied && product_discount) {
                var price_discount = 0;
                for (var product_id in rule_applied) {
                    var product = this.pos.db.get_product_by_id(product_id);
                    var total_qty = total_qty_by_product[product_id];
                    var sub_price;
                    var price_discount;
                    if (total_qty >= rule_applied[product_id]['next_number'] && line.quantity > 0) {
                        if (total_qty % rule_applied[product_id]['next_number'] == 0) {
                            price_discount = total_price_by_product[product_id] - rule_applied[product_id]['list_price'] * total_qty;
                        } else {
                            var qty_temp = total_qty % rule_applied[product_id]['next_number'];
                            sub_price = qty_temp * total_price_by_product[product_id] / total_qty_by_product[product_id];
                            sub_price += (total_qty_by_product[product_id] - qty_temp) * rule_applied[product_id]['list_price'];
                            price_discount = total_price_by_product[product_id] - sub_price;
                        }
                    }
                    if (price_discount) {
                        if (price_discount < 0) {
                            price_discount = -price_discount
                        }
                        this.add_promotion(product_discount, price_discount, -1, {
                            promotion: true,
                            promotion_multi_buy: true,
                            promotion_reason: promotion['name'] + ', multi buy ' + product['display_name']
                        })
                    }
                }
            }
        },
        get_line_lowest_price: function (list_items) {
            var line_lowest_price = null;
            for (var i = 0; i < list_items.length; i++) {
                var line = list_items[i];
                if (!line_lowest_price) {
                    line_lowest_price = line;
                    continue
                }
                if (line_lowest_price.price >= line.price) {
                    line_lowest_price = line;
                }
            }
            return line_lowest_price
        },
        get_price_discount: function (lines_will_apply_promotion, quantity_promotion) {
            var list_items = [];
            var price_discount = 0;
            var unit_id = 1;
            for (var i = 0; i < lines_will_apply_promotion.length; i++) {
                var line = lines_will_apply_promotion[i];
                for (var j = 0; j < line.quantity; j++) {
                    if (this.pos.config.iface_tax_included === 'total') {
                        list_items.push({
                            price: line.get_price_with_tax() / line.quantity,
                            number: unit_id
                        })
                    } else {
                        list_items.push({
                            price: line.get_price_without_tax() / line.quantity,
                            number: unit_id
                        })
                    }
                    unit_id += 1
                }
            }
            for (var i = 0; i < quantity_promotion; i++) {
                var line_lowest_price = this.get_line_lowest_price(list_items);
                price_discount += line_lowest_price.price;
                list_items = _.filter(list_items, function (line) {
                    return line.number != line_lowest_price.number
                })
            }
            return price_discount
        },
        compute_buy_x_get_another_free: function (promotion) { // promotion 10
            var lines_will_apply_promotion = _.filter(this.orderlines.models, function (line) {
                if (promotion['product_ids'].indexOf(line.product.id) != -1 && !line.promotion && line.quantity > 0) {
                    return true
                }
            });
            var total_quantity_line = 0;for (var i = 0; i < lines_will_apply_promotion.length; i++) {
                total_quantity_line += lines_will_apply_promotion[i].quantity
            }
            var minimum_items = promotion['minimum_items'];
            if (lines_will_apply_promotion.length && total_quantity_line >= minimum_items) {
                var promotion_service = this.pos.db.get_product_by_id(promotion.product_id[0]);
                var quantity_promotion = parseInt(total_quantity_line / minimum_items);
                var price_discount = this.get_price_discount(lines_will_apply_promotion, quantity_promotion);
                if (price_discount != 0) {
                    this.add_promotion(promotion_service, price_discount, -1, {
                        promotion: true,
                        promotion_multi_buy: true,
                        promotion_reason: promotion['name'] + ' : Buy ' + total_quantity_line + ' free ' + quantity_promotion + ' items lowest price'
                    })
                }
            }
        },

        compute_first_order: function (promotion) {
            /*
                Promotion first order
            */
            var can_apply_promotion = this.checking_first_order_of_customer();
            if (!can_apply_promotion) {
                return;
            }
            var total_order = this.get_amount_total_without_promotion();
            if (total_order > 0 && promotion['discount_first_order']) {
                var product = this.pos.db.get_product_by_id(promotion.product_id[0]);
                var price = -total_order / 100 * promotion.discount_first_order;
                if (product && price != 0) {
                    var options = {};
                    options.promotion_discount_total_order = true;
                    options.promotion = true;
                    options.promotion_reason = 'discount of ' + promotion.name + ' with ' + promotion.discount_first_order + ' % ';
                    return this.add_promotion(product, price, 1, options);

                }
            }
        },
        add_promotion: function (product, price, quantity, options) {
            /*
                    Function apply promotions to current order
             */
            var line = new models.Orderline({}, {pos: this.pos, order: this.pos.get_order(), product: product});
            if (options.promotion) {
                line.promotion = options.promotion;
            }
            if (options.buyer_promotion) {
                line.promotion = options.buyer_promotion;
            }
            if (options.frequent_buyer_id) {
                line.frequent_buyer_id = options.frequent_buyer_id;
            }
            if (options.promotion_reason) {
                line.promotion_reason = options.promotion_reason;
            }
            if (options.promotion_discount_total_order) {
                line.promotion_discount_total_order = options.promotion_discount_total_order;
            }
            if (options.promotion_discount_category) {
                line.promotion_discount_category = options.promotion_discount_category;
            }
            if (options.promotion_discount_by_quantity) {
                line.promotion_discount_by_quantity = options.promotion_discount_by_quantity;
            }
            if (options.promotion_discount) {
                line.promotion_discount = options.promotion_discount;
            }
            if (options.promotion_gift) {
                line.promotion_gift = options.promotion_gift;
            }
            if (options.promotion_price_by_quantity) {
                line.promotion_price_by_quantity = options.promotion_price_by_quantity;
            }
            if (options.promotion_special_category) {
                line.promotion_special_category = options.promotion_special_category;
            }
            if (options.promotion_discount_lowest_price) {
                line.promotion_discount_lowest_price = options.promotion_discount_lowest_price;
            }
            line.price_manually_set = true; // no need pricelist change, price of promotion change the same, i blocked
            line.set_quantity(quantity);
            line.set_unit_price(price);
            line.price_manually_set = true;
            this.orderlines.add(line);
            this.trigger('change', this);
        },
        get_promotions_active: function () {
            var can_apply = null;
            var promotions_active = [];
            if (!this.pos.promotions) {
                return {
                    can_apply: can_apply,
                    promotions_active: []
                };
            }
            for (var i = 0; i < this.pos.promotions.length; i++) {
                var promotion = this.pos.promotions[i];
                if (promotion['type'] == '1_discount_total_order' && this.checking_apply_total_order(promotion)) {
                    can_apply = true;
                    promotions_active.push(promotion);
                }
                else if (promotion['type'] == '2_discount_category' && this.checking_can_discount_by_categories(promotion)) {
                    can_apply = true;
                    promotions_active.push(promotion);
                }
                else if (promotion['type'] == '3_discount_by_quantity_of_product' && this.checking_apply_discount_filter_by_quantity_of_product(promotion)) {
                    can_apply = true;
                    promotions_active.push(promotion);
                }
                else if (promotion['type'] == '4_pack_discount') {
                    var promotion_condition_items = this.pos.promotion_discount_condition_by_promotion_id[promotion.id];
                    var checking_pack_discount_and_pack_free = this.checking_pack_discount_and_pack_free_gift(promotion_condition_items);
                    if (checking_pack_discount_and_pack_free) {
                        can_apply = true;
                        promotions_active.push(promotion);
                    }
                }
                else if (promotion['type'] == '5_pack_free_gift') {
                    var promotion_condition_items = this.pos.promotion_gift_condition_by_promotion_id[promotion.id];
                    var checking_pack_discount_and_pack_free = this.checking_pack_discount_and_pack_free_gift(promotion_condition_items);
                    if (checking_pack_discount_and_pack_free) {
                        can_apply = checking_pack_discount_and_pack_free;
                        promotions_active.push(promotion);
                    }
                }
                else if (promotion['type'] == '6_price_filter_quantity' && this.checking_apply_price_filter_by_quantity_of_product(promotion)) { // sale off
                    can_apply = true;
                    promotions_active.push(promotion);
                }
                else if (promotion['type'] == '7_special_category' && this.checking_apply_specical_category(promotion)) {
                    can_apply = true;
                    promotions_active.push(promotion);
                }
                else if (promotion['type'] == '8_discount_lowest_price') {
                    can_apply = true;
                    promotions_active.push(promotion);
                }
                else if (promotion['type'] == '9_multi_buy') {
                    var check_multi_by = this.checking_multi_by(promotion);
                    if (check_multi_by) {
                        can_apply = check_multi_by;
                        promotions_active.push(promotion);
                    }
                }
                else if (promotion['type'] == '10_buy_x_get_another_free') {
                    var check_by_x_get_another_free = this.checking_buy_x_get_another_free(promotion);
                    if (check_by_x_get_another_free) {
                        can_apply = check_by_x_get_another_free;
                        promotions_active.push(promotion);
                    }
                }
                else if (promotion['type'] == '11_first_order') {
                    var can_apply_promotion = this.checking_first_order_of_customer();
                    if (can_apply_promotion) {
                        can_apply = can_apply_promotion;
                        promotions_active.push(promotion);
                    }
                }
            }
            return {
                can_apply: can_apply,
                promotions_active: promotions_active
            };
        }
    });
    screens.OrderWidget.include({
        active_promotion: function (buttons, selected_order) {
            if (selected_order.orderlines && selected_order.orderlines.length > 0 && this.pos.config.promotion_ids.length > 0) {
                var lines = selected_order.orderlines.models;
                var promotion_amount = 0;
                for (var i = 0; i < lines.length; i++) {
                    var line = lines[i]
                    if (line.promotion) {
                        promotion_amount += line.get_price_without_tax()
                    }
                }
                var promotion_datas = selected_order.get_promotions_active();
                var can_apply = promotion_datas['can_apply'];
                if (buttons && buttons.button_promotion) {
                    buttons.button_promotion.highlight(can_apply);
                }
                var promotions_active = promotion_datas['promotions_active'];
                if (promotions_active.length) {
                    var promotion_recommend_customer_html = qweb.render('promotion_recommend_customer', {
                        promotions: promotions_active
                    });
                    $('.promotion_recommend_customer').html(promotion_recommend_customer_html);
                } else {
                    $('.promotion_recommend_customer').html("");
                }
            }
        },
        promotion_added: function (buttons, selected_order) {
            var promotion_added = false;
            if (selected_order.orderlines && selected_order.orderlines.length > 0 && this.pos.config.promotion_ids.length > 0) {
                var lines = selected_order.orderlines.models;
                for (var i = 0; i < lines.length; i++) {
                    var line = lines[i]
                    if (line.promotion) {
                        promotion_added = true;
                        break
                    }
                }
                if (buttons && buttons.button_remove_promotion) {
                    buttons.button_remove_promotion.highlight(promotion_added);
                }
            }
            return promotion_added;
        },
        active_buyers_promotion: function (buttons, selected_order) {
            if (buttons.button_buyer_promotion) {
                var check = false;
                if (selected_order.orderlines.length == 0) {
                    check = false;
                }
                var customer = selected_order.get_client();
                if (!customer) {
                    check = false;
                } else {
                    var buyers = this.pos.buyer_by_partner_id[customer.id];
                    if (buyers && buyers.length > 0) {
                        for (var i = 0; i < buyers.length; i++) {
                            var buyer = buyers[i];
                            var promotion_id = buyer['promotion_id'][0];
                            var promotion = this.pos.buyer_by_promotion_id[promotion_id];
                            if (promotion) {
                                var buyer_group_id = promotion['buyers_group'][0];
                                var buyer_group = this.pos.buyer_group_by_id[buyer_group_id];
                                if (buyer_group) {
                                    var product_ids = buyer_group['products_ids'];
                                    if (product_ids.length > 0) {
                                        var number_of_sales = buyer_group['number_of_sales'];
                                        var lines = _.filter(selected_order.orderlines.models, function (line) {
                                            return product_ids.indexOf(line.product.id) != -1
                                        });
                                        var products_add_promotion = {};
                                        for (var j = 0; j < lines.length; j++) {
                                            var line = lines[j];
                                            if (!products_add_promotion[line.product.id]) {
                                                var qty_total = selected_order.count_quantity_by_product(line.product);
                                                if (qty_total >= number_of_sales) {
                                                    check = true;
                                                }
                                            }
                                        }
                                    }
                                }

                            }
                        }
                    }
                }
                buttons.button_buyer_promotion.highlight(check);
            }
        },
        update_summary: function () {
            this._super();
            var selected_order = this.pos.get_order();
            var buttons = this.getParent().action_buttons;
            if (selected_order && buttons) {
                this.active_promotion(buttons, selected_order);
                this.promotion_added(buttons, selected_order);
                this.active_buyers_promotion(buttons, selected_order);
            }
        }
    });

    var button_promotion = screens.ActionButtonWidget.extend({// promotion button
        template: 'button_promotion',
        button_click: function () {
            var order = this.pos.get('selectedOrder');
            var promotion_manual_select = this.pos.config.promotion_manual_select;
            if (!promotion_manual_select) {
                order.compute_promotion()
            } else {
                var promotion_datas = order.get_promotions_active();
                var promotions_active = promotion_datas['promotions_active'];
                if (promotions_active.length) {
                    return this.pos.gui.show_popup('popup_selection_promotions', {
                        title: 'Promotions',
                        body: 'Please choice promotions and confirm',
                        promotions_active: promotions_active
                    })
                } else {
                    return this.pos.gui.show_popup('confirm', {
                        title: 'Warning',
                        body: 'Nothing promotions active',
                    })
                }

            }
        }
    });
    screens.define_action_button({
        'name': 'button_promotion',
        'widget': button_promotion,
        'condition': function () {
            return this.pos.promotion_ids && this.pos.promotion_ids.length >= 1;
        }
    });

    var button_remove_promotion = screens.ActionButtonWidget.extend({
        template: 'button_remove_promotion',
        button_click: function () {
            var order = this.pos.get('selectedOrder');
            if (order) {
                order.remove_all_promotion_line();
                order.remove_all_promotion_line();
            }
        }
    });
    screens.define_action_button({
        'name': 'button_remove_promotion',
        'widget': button_remove_promotion,
        'condition': function () {
            return this.pos.promotion_ids && this.pos.promotion_ids.length >= 1;
        }
    });

    var popup_selection_promotions = PopupWidget.extend({ // add tags
        template: 'popup_selection_promotions',
        show: function (options) {
            var self = this;
            this._super(options);
            this.promotions_selected = {};
            var promotions = options.promotions_active;
            this.promotions = promotions;
            self.$el.find('.body').html(qweb.render('promotion_list', {
                promotions: promotions,
                widget: self
            }));
            this.$('.product').click(function () {
                var promotion_id = parseInt($(this).data('id'));
                var promotion = self.pos.promotion_by_id[promotion_id];
                if (promotion) {
                    if ($(this).closest('.product').hasClass("item-selected") == true) {
                        $(this).closest('.product').toggleClass("item-selected");
                        delete self.promotions_selected[promotion.id];
                    } else {
                        $(this).closest('.product').toggleClass("item-selected");
                        self.promotions_selected[promotion.id] = promotion;
                    }
                }
            });
            this.$('.cancel').click(function () {
                self.pos.gui.close_popup();
            });
            this.$('.confirm').click(function () {
                self.pos.gui.close_popup();
                var promotions = [];
                for (var i in self.promotions_selected) {
                    promotions.push(self.promotions_selected[i]);
                }
                if (promotions.length) {
                    self.pos.get_order().manual_compute_promotion(promotions)
                }
            });
            this.$('.add_all').click(function () {
                self.pos.get_order().manual_compute_promotion(self.promotions);
                self.pos.gui.close_popup();
            });
        }
    });
    gui.define_popup({name: 'popup_selection_promotions', widget: popup_selection_promotions});

    var button_buyer_promotion = screens.ActionButtonWidget.extend({
        template: 'button_buyer_promotion',
        init: function (parent, options) {
            this._super(parent, options);
        },
        button_click: function () {
            var order = this.pos.get_order();
            if (!order) {
                return null
            }
            if (order.orderlines.length == 0) {
                return this.pos.gui.show_popup('confirm', {
                    title: 'Warning',
                    body: 'Your order is blank'
                })
            }
            var customer = order.get_client();
            order.remove_all_buyer_promotion_line();
            if (!customer) {
                return this.pos.gui.show_popup('confirm', {
                    title: 'Warning',
                    body: 'Please choice customer, customer of order is blank'
                })
            } else {
                var buyers = this.pos.buyer_by_partner_id[customer.id];
                if (buyers && buyers.length > 0) {
                    for (var i = 0; i < buyers.length; i++) {
                        var buyer = buyers[i];
                        var promotion_id = buyer['promotion_id'][0];
                        var promotion = this.pos.buyer_by_promotion_id[promotion_id];
                        if (promotion) {
                            var buyer_group_id = promotion['buyers_group'][0];
                            var buyer_group = this.pos.buyer_group_by_id[buyer_group_id];
                            if (buyer_group) {
                                var product_ids = buyer_group['products_ids'];
                                if (product_ids.length > 0) {
                                    var number_of_sales = buyer_group['number_of_sales'];
                                    var lines = _.filter(order.orderlines.models, function (line) {
                                        return product_ids.indexOf(line.product.id) != -1
                                    });
                                    var products_add_promotion = {};
                                    for (var j = 0; j < lines.length; j++) {
                                        var line = lines[j];
                                        if (!products_add_promotion[line.product.id]) {
                                            var qty_total = order.count_quantity_by_product(line.product);
                                            if (qty_total >= number_of_sales) {
                                                var qty_free = parseInt(qty_total / number_of_sales);
                                                var product_discount = this.pos.db.product_by_id[line.product.id];
                                                order.add_promotion(product_discount, 0, 1, {
                                                    'promotion': true,
                                                    'promotion_reason': 'By smaller than ' + number_of_sales + ' ' + line.product['display_name'] + ' free ' + qty_free,
                                                    'promotion_gift': true,
                                                    'frequent_buyer_id': buyer['id'],
                                                    'buyer_promotion': true
                                                });
                                                products_add_promotion[line.product.id] = line.product.id;
                                            }
                                        }
                                    }
                                }
                            } else {
                                return this.pos.gui.show_popup('confirm', {
                                    title: 'Warning',
                                    body: 'Could not find buyer group',
                                })
                            }

                        } else {
                            return this.pos.gui.show_popup('confirm', {
                                title: 'Warning',
                                body: 'Could not find promotion',
                            })
                        }
                    }
                } else {
                    return this.pos.gui.show_popup('confirm', {
                        title: 'Warning',
                        body: 'Customer have not promotion',
                    })
                }
            }
        }
    });
    screens.define_action_button({
        'name': 'button_buyer_promotion',
        'widget': button_buyer_promotion,
        'condition': function () {
            return this.pos.buyers_promotion && this.pos.buyers_promotion.length;
        }
    });


});
