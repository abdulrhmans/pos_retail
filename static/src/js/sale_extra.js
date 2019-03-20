odoo.define('pos_retail.sale_extra', function (require) {
    var models = require('point_of_sale.models');
    var screens = require('point_of_sale.screens');
    var core = require('web.core');
    var qweb = core.qweb;

    models.load_models([
        {
            model: 'pos.sale.extra',
            fields: ['product_id', 'quantity', 'list_price', 'product_tmpl_id'],
            loaded: function (self, sales_extra) {
                self.sales_extra = sales_extra;
                self.sale_extra_by_product_tmpl_id = {};
                self.sale_extra_by_id = {};
                for (var i = 0; i < sales_extra.length; i++) {
                    var sale_extra = sales_extra[i];
                    sale_extra['default_quantity'] = sale_extra['quantity'];
                    self.sale_extra_by_id[sale_extra['id']] = sale_extra;
                    if (!self.sale_extra_by_product_tmpl_id[sale_extra['product_tmpl_id'][0]]) {
                        self.sale_extra_by_product_tmpl_id[sale_extra['product_tmpl_id'][0]] = [sale_extra]
                    } else {
                        self.sale_extra_by_product_tmpl_id[sale_extra['product_tmpl_id'][0]].push(sale_extra)
                    }
                }
            }
        }
    ]);
    var _super_posmodel = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({
        initialize: function (session, attributes) {
            var product_model = _.find(this.models, function (model) {
                return model.model === 'product.product';
            });
            product_model.fields.push('sale_extra');
            return _super_posmodel.initialize.apply(this, arguments);
        }
    });
    var _super_Order = models.Order.prototype;
    models.Order = models.Order.extend({
        add_product: function (product, options) {
            var res = _super_Order.add_product.apply(this, arguments);
            var self = this;
            var contents = $('.product-list-sale-extra');
            if (product && product['sale_extra']) {
                var sales_extra = this.pos.sale_extra_by_product_tmpl_id[product['product_tmpl_id']]
                if (sales_extra && sales_extra.length > 0 && contents) {
                    contents.empty();
                    contents.css({'display': 'inherit'})
                    for (var i = 0; i < sales_extra.length; i++) {
                        var sale_extra = sales_extra[i];
                        var product = this.pos.db.get_product_by_id(sale_extra['product_id'][0])
                        if (product) {
                            var image_url = this.get_product_image_url(product);
                            var product_html = qweb.render('product_sale_extra', {
                                widget: this.pos.chrome,
                                product: product,
                                sale_extra: sale_extra,
                                image_url: image_url
                            });
                            contents.append(product_html);
                        }
                    }
                    $('.product-list-sale-extra .product').click(function () {
                        var sale_extra_id = parseInt($(this).data()['saleExtraId']);
                        var order = self.pos.get_order();
                        if (order) {
                            var selected_orderline = order.selected_orderline;
                            selected_orderline.set_sale_extra_to_line(sale_extra_id)
                        }
                    })
                }
                else if ((!sales_extra && contents) || sales_extra.length == 0) {
                    contents.css({'display': 'none'});
                }
            }
            if (this.selected == false) {
                contents.css({'display': 'none'})
            }
            return res
        },
        get_product_image_url: function (product) {
            return window.location.origin + '/web/image?model=product.product&field=image_medium&id=' + product.id;
        }
    });

    var _super_order_line = models.Orderline.prototype;
    models.Orderline = models.Orderline.extend({
        initialize: function (attr, options) {
            _super_order_line.initialize.call(this, attr, options);
            this.sales_extra = this.sales_extra || {};
        },
        export_as_JSON: function () {
            var json = _super_order_line.export_as_JSON.call(this);
            json.sales_extra = {};
            if (this.sales_extra) {
                for (var sale_extra_id in this.sales_extra) {
                    json.sales_extra[sale_extra_id] = this.sales_extra[sale_extra_id]
                }
            }
            return json;
        },
        init_from_JSON: function (json) {
            _super_order_line.init_from_JSON.apply(this, arguments);
            if (json.sales_extra) {
                this.sales_extra = {};
                for (var sale_extra_id in json.sales_extra) {
                    if (json.sales_extra[sale_extra_id] == null) {
                        continue
                    }
                    this.sales_extra[sale_extra_id] = json.sales_extra[sale_extra_id]
                }
            }
        },
        get_all_prices: function () {
            var values = _super_order_line.get_all_prices.apply(this, arguments);
            var price_extra = this.get_price_extra();
            values['priceWithTax'] += price_extra;
            values['priceWithoutTax'] += price_extra;
            return values
        },
        get_sale_extra_by_id: function (sale_extra_id) { // method for xml
            return this.pos.sale_extra_by_id[sale_extra_id]
        },
        get_quantity_extra: function(sale_extras, sale_extra_id) {
            sale_extra_id = parseInt(sale_extra_id);
            var qty = sale_extras[sale_extra_id];
            return qty
        },
        set_sale_extra_to_line: function (sale_extra_id) {
            var sale_extra = this.pos.sale_extra_by_id[sale_extra_id]
            if (!sale_extra) {
                return
            }
            var product_id = sale_extra['product_id'][0];
            var order = this.pos.get_order();
            var selected_orderline = order.selected_orderline;
            if (product_id && order) {
                if (!selected_orderline) {
                    return;
                }
                var product = this.pos.db.get_product_by_id(product_id);
                if (product && selected_orderline) {
                    if (!selected_orderline['sales_extra'][sale_extra['id']]) {
                        selected_orderline['sales_extra'][sale_extra['id']] = sale_extra['quantity']
                    } else {
                        selected_orderline['sales_extra'][sale_extra['id']] += 1
                    }
                }
                selected_orderline.trigger('change', selected_orderline);
            }
        },
        get_price_extra: function () {
            var order = this.pos.get_order();
            var price_extra = 0;
            if (!order) {
                return price_extra;
            }
            var selected_orderline = order.selected_orderline;
            if (!selected_orderline) {
                return price_extra;
            }
            var sales_extra = selected_orderline['sales_extra'];
            for (var sale_extra_id in sales_extra) {
                var quantity_added = sales_extra[sale_extra_id];
                price_extra += this.pos.sale_extra_by_id[sale_extra_id]['list_price'] * quantity_added;
            }
            return price_extra;
        },
        set_selected: function (selected) {
            _super_order_line.set_selected.apply(this, arguments);
            var self = this;
            var contents = $('.product-list-sale-extra');
            if (this.product && this.selected && this.product['sale_extra']) {
                var sales_extra = this.pos.sale_extra_by_product_tmpl_id[this.product['product_tmpl_id']]
                if (sales_extra && sales_extra.length > 0 && contents) {
                    contents.empty();
                    contents.css({'display': 'inherit'})
                    for (var i = 0; i < sales_extra.length; i++) {
                        var sale_extra = sales_extra[i];
                        var product = this.pos.db.get_product_by_id(sale_extra['product_id'][0])
                        if (product) {
                            var image_url = this.order.get_product_image_url(product);
                            var product_html = qweb.render('product_sale_extra', {
                                widget: this.pos.chrome,
                                product: product,
                                sale_extra: sale_extra,
                                image_url: image_url
                            });
                            contents.append(product_html);
                        }
                    }
                    $('.product-list-sale-extra .product').click(function () {
                        var sale_extra_id = parseInt($(this).data()['saleExtraId']);
                        self.set_sale_extra_to_line(sale_extra_id)
                    })
                }
                else if ((!sales_extra && contents) || sales_extra.length == 0) {
                    contents.css({'display': 'none'});
                }
            }
            if (this.selected == false) {
                contents.css({'display': 'none'})
            }
            var order = self.pos.get_order();
            if (order) {
                var selected_orderline = order.selected_orderline;
                if (selected_orderline) {
                    selected_orderline.action_sale_extra();
                }
            }
        },
        action_sale_extra: function () {
            var self = this;
            $('.remove_sale_extra').click(function () {
                var sale_extra_id = parseInt($(this).data()['saleExtraId']);
                var sale_extra = self.pos.sale_extra_by_id[sale_extra_id];
                var order = self.pos.get_order();
                if (!order) {
                    return
                }
                var selected_orderline = order.selected_orderline;
                var new_sales_extra = {};
                var price_extra_line;
                for (var sale_extra_id in selected_orderline['sales_extra']) {
                    if (sale_extra_id == sale_extra['id']) {
                        var quantity_added = selected_orderline['sales_extra'][sale_extra_id];
                        price_extra_line = selected_orderline['price'] - sale_extra['list_price'] * quantity_added;
                    } else {
                        new_sales_extra[sale_extra_id] = selected_orderline['sales_extra'][sale_extra_id]
                    }
                }
                selected_orderline['sales_extra'] = new_sales_extra;
                selected_orderline.trigger('change', selected_orderline);
            })
        }
    });

    screens.OrderWidget.include({
        bind_lines: function () {
            var order = this.pos.get_order();
            if (order) {
                var selected_orderline = order.selected_orderline;
                if (selected_orderline) {
                    selected_orderline.action_sale_extra();
                }
            }
        },
        update_summary: function () {
            var self = this;
            this._super();
            setTimeout(function () {
                self.bind_lines()
            }, 2000);

        }
    })
});
