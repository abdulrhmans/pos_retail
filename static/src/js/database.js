/*
    This module create by: thanhchatvn@gmail.com
    License: OPL-1
    Please do not modification if i not accept
    Thanks for understand
 */
odoo.define('pos_retail.database', function (require) {
    var db = require('point_of_sale.DB');

    db.include({
        init: function (options) {
            this._super(options);
            this.sequence = 1;
            // pos orders
            this.order_by_id = {};
            this.orders_store = [];
            this.order_by_ean13 = {};
            this.order_search_string = "";
            this.order_line_by_id = {};
            this.pos_order_lines = [];
            this.lines_by_order_id = {};
            this.product_by_supplier_barcode = {};
            // account invoices
            this.invoices = [];
            this.invoice_by_id = {};
            this.invoices = [];
            this.invoice_by_partner_id = {};
            this.invoice_search_string = "";
            this.invoice_lines_by_invoice_id = {};
            // auto complete search
            this.suppliers_autocomplete = [];
            this.partners_autocomplete = [];
            this.products_autocomplete = [];
            this.pos_orders_autocomplete = [];
            this.invoices_autocomplete = [];
            // sale orders
            this.sale_order_by_id = {};
            this.sale_order_by_name = {};
            this.sale_orders = [];
            this.sale_orders_autocomplete = [];
            this.sale_search_string = '';
            this.sale_line_by_id = {};
            this.sale_lines_by_sale_id = {};
            this.suppliers = [];
            this.supplier_by_id = {};
            this.partners = [];
            this.products = [];
            // medical
            this.insurances = [];
            this.insurances_autocomplete = [];
            this.insurance_by_id = {};
            this.insurance_by_partner_id = {};
        },
        add_partners: function (new_partners) {
            var updated_count = this._super(new_partners);
            if (!this.partners) {
                this.partners = new_partners;
            } else {
                for (var i = 0; i < new_partners.length; i++) {
                    this.partners = _.filter(this.partners, function (partner) {
                        return partner.id != new_partners[i].id
                    })
                }
                this.partners = this.partners.concat(new_partners);
            }
            this.partners_autocomplete = [];
            for (var i = 0; i < this.partners.length; i++) {
                var partner = this.partners[i];
                var label = partner['ref'] || '';
                if (partner['name']) {
                    label += '/' + partner['name']
                }
                if (partner['barcode']) {
                    label += '/' + partner['barcode']
                }
                if (partner['email']) {
                    label += '/' + partner['email']
                }
                if (partner['phone']) {
                    label += '/' + partner['phone']
                }
                if (partner['mobile']) {
                    label += '/' + partner['mobile']
                }
                if (partner['address']) {
                    label += '/' + partner['address']
                }
                if (partner['credit']) {
                    label += '/[credit] ' + partner['credit']
                }
                if (partner['point']) {
                    label += '/[point] ' + partner['point']
                }
                if (partner['point']) {
                    label += '/[wallet] ' + partner['wallet']
                }
                this.partners_autocomplete.push({
                    value: partner['id'],
                    label: label
                });
                if (partner.property_product_pricelist && self.posmodel.pricelist_by_id) { // re-update pricelist when pricelist change the same
                    var pricelist = self.posmodel.pricelist_by_id[partner.property_product_pricelist[0]];
                    if (pricelist) {
                        partner.property_product_pricelist = [pricelist.id, pricelist.display_name]
                    }
                }
                if (partner.pos_loyalty_type) {
                    partner.pos_loyalty_type_name = partner.pos_loyalty_type[1];
                }
            }
            return 1;
        },
        add_suppliers: function (suppliers) {
            if (!this.suppliers_autocomplete) {
                this.suppliers_autocomplete = [];
            }
            for (var i = 0; i < suppliers.length; i++) {
                var supplier = suppliers[i];
                this.supplier_by_id[supplier['id']] = supplier;
                var label = supplier.name;
                if (supplier['ref']) {
                    label += ', ' + supplier['ref']
                }
                if (supplier['barcode']) {
                    label += ', ' + supplier['barcode']
                }
                if (supplier['email']) {
                    label += ', ' + supplier['email']
                }
                if (supplier['phone']) {
                    label += ', ' + supplier['phone']
                }
                if (supplier['mobile']) {
                    label += ', ' + supplier['mobile']
                }
                if (supplier['address']) {
                    label += ', ' + supplier['address']
                }
                this.suppliers_autocomplete.push({
                    value: supplier['id'],
                    label: label
                });
            }
            if (!this.suppliers) {
                this.suppliers = suppliers;
            } else {
                this.suppliers.concat(suppliers);
            }
        },
        get_product_by_category: function (category_id) {
            var list = this._super(category_id);
            if (self.posmodel.config.active_product_sort_by) {
                if (self.posmodel.config.default_product_sort_by == 'a_z') {
                    list = list.sort(self.posmodel.sort_by('display_name', false, function (a) {
                        if (!a) {
                            a = 'N/A';
                        }
                        return a.toUpperCase()
                    }));
                } else if (self.posmodel.config.default_product_sort_by == 'z_a') {
                    list = list.sort(self.posmodel.sort_by('display_name', true, function (a) {
                        if (!a) {
                            a = 'N/A';
                        }
                        return a.toUpperCase()
                    }));
                } else if (self.posmodel.config.default_product_sort_by == 'low_price') {
                    list = list.sort(self.posmodel.sort_by('list_price', false, parseInt));
                } else if (self.posmodel.config.default_product_sort_by == 'high_price') {
                    list = list.sort(self.posmodel.sort_by('list_price', true, parseInt));
                } else if (self.posmodel.config.default_product_sort_by == 'pos_sequence') {
                    list = list.sort(self.posmodel.sort_by('pos_sequence', false, function (a) {
                        if (!a) {
                            a = 'N/A';
                        }
                        return a.toUpperCase()
                    }));
                }
            }
            return list
        },
        add_products: function (products) { // store product to pos
            if (!products instanceof Array) {
                products = [products];
            }
            /*
                We only render products filter by store/branch (bus)
             */
            if (self.posmodel.config.bus_id) {
                var products_filter_by_bus_id = []
                var bus_id = self.posmodel.config.bus_id[0];
                self.posmodel.bus_id = bus_id;
                for (var i = 0; i < products.length; i++) {
                    var product = products[i];
                    if (product.bus_ids && product.bus_ids.length != 0 && product.bus_ids.indexOf(bus_id) != -1) {
                        products_filter_by_bus_id.push(product);
                    }
                    if (product.bus_ids && product.bus_ids.length == 0) {
                        products_filter_by_bus_id.push(product);
                    }
                    if (product.bus_ids == undefined) {
                        products_filter_by_bus_id.push(product);
                    }
                }
                products = products_filter_by_bus_id;
            }
            if (!self.posmodel.products) {
                self.posmodel.products = products;
            } else {
                self.posmodel.products.concat(products);
            }
            this._super(products);
            if (!products instanceof Array) {
                products = [products];
            }
            for (var i = 0, len = products.length; i < len; i++) {
                var product = products[i];
                if (product['uom_id']) {
                    product['base_uom_id'] = product['uom_id'];
                }
                var label = product['default_code'] || '';
                if (product['barcode']) {
                    label += '/' + product['barcode'];
                }
                if (product['name']) {
                    label += '/' + product['name'];
                }
                if (product['description']) {
                    label += '/' + product['description'];
                }
                if (product['product_description']) {
                    label += '/' + product['product_description'];
                }
                if (product['price']) {
                    label += '/' + product['price'];
                }
                this.products_autocomplete.push({
                    value: product['id'],
                    label: label
                });
                var stored_categories = this.product_by_category_id;
                product = products[i];
                if (product.pos_categ_id) {
                    product.pos_categ = product.pos_categ_id[1]
                } else {
                    product.pos_categ = 'N/A';
                }
                var search_string = this._product_search_string(product);
                var category_ids = products[i].pos_categ_ids;
                if (!category_ids) {
                    continue
                }
                if (category_ids.length == 0) {
                    category_ids = [this.root_category_id];
                }
                for (var n = 0; n < category_ids.length; n++) {
                    var category_id = category_ids[n];
                    if (!stored_categories[category_id]) {
                        stored_categories[category_id] = [product.id];
                    } else {
                        stored_categories[category_id].push(product.id);
                    }
                    if (this.category_search_string[category_id] === undefined) {
                        this.category_search_string[category_id] = '';
                    }
                    this.category_search_string[category_id] += search_string;
                    var ancestors = this.get_category_ancestors_ids(category_id) || [];
                    for (var j = 0, jlen = ancestors.length; j < jlen; j++) {
                        var ancestor = ancestors[j];
                        if (!stored_categories[ancestor]) {
                            stored_categories[ancestor] = [];
                        }
                        stored_categories[ancestor].push(product.id);
                        if (this.category_search_string[ancestor] === undefined) {
                            this.category_search_string[ancestor] = '';
                        }
                        this.category_search_string[ancestor] += search_string;
                    }
                }
                // product by suppliers barcode
                if (product['supplier_barcode']) {
                    if (!this.product_by_supplier_barcode[product['supplier_barcode']]) {
                        this.product_by_supplier_barcode[product['supplier_barcode']] = [product];
                    } else {
                        this.product_by_supplier_barcode[product['supplier_barcode']].push(product);
                    }
                }
            }
        },
        _order_search_string: function (order) {
            var str = order.ean13;
            str += '|' + order.name;
            if (order.partner_id) {
                var partner = this.partner_by_id[order.partner_id[0]]
                if (partner) {
                    if (partner['name']) {
                        str += '|' + partner['name'];
                    }
                    if (partner.mobile) {
                        str += '|' + partner['mobile'];
                    }
                    if (partner.phone) {
                        str += '|' + partner['phone'];
                    }
                    if (partner.email) {
                        str += '|' + partner['email'];
                    }
                }
            }
            if (order.date_order) {
                str += '|' + order['date_order'];
            }
            str = '' + order['id'] + ':' + str.replace(':', '') + '\n';
            return str;
        },
        search_order: function (query) {
            try {
                query = query.replace(/[\[\]\(\)\+\*\?\.\-\!\&\^\$\|\~\_\{\}\:\,\\\/]/g, '.');
                query = query.replace(' ', '.+');
                var re = RegExp("([0-9]+):.*?" + query, "gi");
            } catch (e) {
                return [];
            }
            var results = [];
            for (var i = 0; i < this.limit; i++) {
                var r = re.exec(this.order_search_string);
                if (r && r[1]) {
                    var id = r[1];
                    if (this.order_by_id[id] !== undefined) {
                        results.push(this.order_by_id[id]);
                    }
                } else {
                    break;
                }
            }
            return results;
        },
        save_pos_orders: function (orders) { // stores pos orders
            if (this.orders_store.length == 0) {
                this.orders_store = orders;
            } else {
                this.orders_store = this.orders_store.concat(orders);
            }
            for (var i = 0; i < orders.length; i++) {
                var order = orders[i];
                if (order.partner_id) {
                    var partner;
                    if (order.partner_id && order.partner_id[0]) {
                        partner = this.get_partner_by_id(order.partner_id[0]);
                    } else {
                        partner = this.get_partner_by_id(order.partner_id);
                    }
                    if (partner) {
                        order.partner = partner;
                        order.partner_name = partner.name;
                    }
                }
                this.order_by_id[order['id']] = order;
                this.order_by_ean13[order.ean13] = order;
                var label = order['name']; // auto complete
                if (order['ean13']) {
                    label += ', ' + order['ean13']
                }
                if (order['pos_reference']) {
                    label += ', ' + order['pos_reference']
                }
                if (order.partner_id) {
                    var partner = this.get_partner_by_id(order.partner_id[0]);
                    if (partner) {
                        label += ', ' + partner['name'];
                        if (partner['email']) {
                            label += ', ' + partner['email']
                        }
                        if (partner['phone']) {
                            label += ', ' + partner['phone']
                        }
                        if (partner['mobile']) {
                            label += ', ' + partner['mobile']
                        }
                    }
                }
                this.order_search_string += this._order_search_string(order);
                this.pos_orders_autocomplete.push({
                    value: order['id'],
                    label: label
                })
            }
        },
        save_pos_order_line: function (lines) { // save order line from backend
            if (this.pos_order_lines) {
                this.pos_order_lines = lines;
            } else {
                this.pos_order_lines = this.pos_order_lines.concat(lines);
            }
            for (var i = 0; i < lines.length; i++) {
                this.order_line_by_id[lines[i]['id']] = lines[i];
                if (!this.lines_by_order_id[lines[i].order_id[0]]) {
                    this.lines_by_order_id[lines[i].order_id[0]] = [lines[i]]
                } else {
                    this.lines_by_order_id[lines[i].order_id[0]].push(lines[i])
                }
            }
        },

        _invoice_search_string: function (invoice) {
            var str = invoice.number;
            str += '|' + invoice.name;
            if (invoice.partner_id) {
                var partner = this.partner_by_id[invoice.partner_id[0]]
                if (partner) {
                    if (partner['name']) {
                        str += '|' + partner['name'];
                    }
                    if (partner.mobile) {
                        str += '|' + partner['mobile'];
                    }
                    if (partner.phone) {
                        str += '|' + partner['phone'];
                    }
                    if (partner.email) {
                        str += '|' + partner['email'];
                    }
                }
                str += '|' + invoice['origin'];
            }
            if (invoice.date_invoice) {
                str += '|' + invoice['date_invoice'];
            }
            str = '' + invoice['id'] + ':' + str.replace(':', '') + '\n';
            return str;
        },
        search_invoice: function (query) {
            try {
                query = query.replace(/[\[\]\(\)\+\*\?\.\-\!\&\^\$\|\~\_\{\}\:\,\\\/]/g, '.');
                query = query.replace(' ', '.+');
                var re = RegExp("([0-9]+):.*?" + query, "gi");
            } catch (e) {
                return [];
            }
            var results = [];
            for (var i = 0; i < this.limit; i++) {
                var r = re.exec(this.invoice_search_string);
                if (r && r[1]) {
                    var id = r[1];
                    if (this.invoice_by_id[id] !== undefined) {
                        results.push(this.invoice_by_id[id]);
                    }
                } else {
                    break;
                }
            }
            return results;
        },
        save_invoices: function (invoices) {
            if (this.invoices.length == 0) {
                this.invoices = invoices;
            } else {
                this.invoices = this.invoices.concat(invoices);
            }
            for (var i = 0; i < invoices.length; i++) {
                var invoice = invoices[i];
                this.invoice_by_id[invoice.id] = invoice;
                if (!this.invoice_by_partner_id[invoice.partner_id[0]]) {
                    this.invoice_by_partner_id[invoice.partner_id[0]] = [invoice]
                } else {
                    this.invoice_by_partner_id[invoice.partner_id[0]].push(invoice);
                }
                this.invoice_search_string += this._invoice_search_string(invoice);
                invoice['partner_name'] = invoice.partner_id[1];
                if (invoice.payment_term_id) {
                    invoice['payment_term'] = invoice.payment_term_id[1];
                } else {
                    invoice['payment_term'] = 'N/A';
                }
                if (invoice.user_id) {
                    invoice['user'] = invoice.user_id[1];
                } else {
                    invoice['user'] = 'N/A';
                }
                var invoice = this.invoices[i];
                var partner = this.get_partner_by_id(invoice.partner_id[0]);
                if (!partner) {
                    partner = this.supplier_by_id[invoice.partner_id[0]]
                }
                if (!partner) {
                    continue;
                }
                var label = invoice['number'];
                if (invoice['name']) {
                    label += ', ' + invoice['name'];
                }
                if (partner['display_name']) {
                    label += ', ' + partner['display_name']
                }
                if (partner['email']) {
                    label += ', ' + partner['email']
                }
                if (partner['phone']) {
                    label += ', ' + partner['phone']
                }
                if (partner['mobile']) {
                    label += ', ' + partner['mobile']
                }
                this.invoices_autocomplete.push({
                    value: invoice['id'],
                    label: label
                })
            }
        },
        save_invoice_lines: function (lines) {
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                if (!this.invoice_lines_by_invoice_id[line.invoice_id[0]]) {
                    this.invoice_lines_by_invoice_id[line.invoice_id[0]] = [line]
                } else {
                    this.invoice_lines_by_invoice_id[line.invoice_id[0]].push(line)
                }
            }
        },
        save_data_sync_invoice_line: function (line) {
            var invoice_id = line.invoice_id[0];
            var invoice_lines = this.invoice_lines_by_invoice_id[invoice_id];
            if (!invoice_lines) {
                this.invoice_lines_by_invoice_id[invoice_id] = [line];
            } else {
                var exist = false;
                for (var i = 0; i < invoice_lines.length; i++) {
                    var old_line = invoice_lines[i];
                    if (old_line.id == line.id) {
                        old_line = line;
                        exist = true
                    }
                }
                if (exist == false) {
                    this.invoice_lines_by_invoice_id[invoice_id].push(line);
                }
            }
        },
        get_invoice_by_id: function (id) {
            return this.invoice_by_id[id];
        },
        _sale_order_search_string: function (sale) {
            var str = sale.name;
            str += '|' + sale.origin;
            str += '|' + sale.client_order_ref;
            if (sale.partner_id) {
                var partner = this.partner_by_id[sale.partner_id[0]]
                if (partner) {
                    if (partner['name']) {
                        str += '|' + partner['name'];
                    }
                    if (partner.mobile) {
                        str += '|' + partner['mobile'];
                    }
                    if (partner.phone) {
                        str += '|' + partner['phone'];
                    }
                    if (partner.email) {
                        str += '|' + partner['email'];
                    }
                }
            }
            if (sale.note) {
                str += '|' + sale.note;
            }
            if (sale.date_order) {
                str += '|' + sale.date_order;
            }
            if (sale.user_id) {
                str += '|' + sale.user_id[1];
            }
            if (sale.origin) {
                str += '|' + sale.origin;
            }
            if (sale.validity_date) {
                str += '|' + sale.validity_date;
            }
            if (sale.payment_term_id) {
                str += '|' + sale.payment_term_id[1];
            }
            str = '' + sale['id'] + ':' + str.replace(':', '') + '\n';
            return str;
        },
        search_sale_orders: function (query) {
            try {
                query = query.replace(/[\[\]\(\)\+\*\?\.\-\!\&\^\$\|\~\_\{\}\:\,\\\/]/g, '.');
                query = query.replace(' ', '.+');
                var re = RegExp("([0-9]+):.*?" + query, "gi");
            } catch (e) {
                return [];
            }
            var sale_orders = [];
            for (var i = 0; i < this.limit; i++) {
                var r = re.exec(this.sale_search_string);
                if (r && r[1]) {
                    var id = r[1];
                    if (this.sale_order_by_id[id] !== undefined) {
                        sale_orders.push(this.sale_order_by_id[id]);
                    }
                } else {
                    break;
                }
            }
            return sale_orders;
        },
        save_sale_orders: function (sale_orders) {
            for (var i = 0; i < sale_orders.length; i++) {
                var sale = sale_orders[i];
                var label = sale['name']; // auto complete
                if (sale['origin']) {
                    label += ',' + sale['origin'];
                }
                if (sale.partner_id) {
                    var partner = this.get_partner_by_id(sale.partner_id[0]);
                    sale.partner = partner;
                    if (partner) {
                        label += ', ' + partner['name'];
                        if (partner['email']) {
                            label += ', ' + partner['email']
                        }
                        if (partner['phone']) {
                            label += ', ' + partner['phone']
                        }
                        if (partner['mobile']) {
                            label += ', ' + partner['mobile']
                        }
                    }
                    sale['partner_name'] = sale.partner_id[1];
                }
                this.sale_orders_autocomplete.push({
                    value: sale['id'],
                    label: label
                });
                this.sale_order_by_id[sale['id']] = sale;
                this.sale_order_by_name[sale['name']] = sale;
                this.sale_search_string += this._sale_order_search_string(sale);
            }
            this.sale_orders = sale_orders;
        },
        save_sale_order_lines: function (lines) {
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                if (!this.sale_lines_by_sale_id[line.order_id[0]]) {
                    this.sale_lines_by_sale_id[line.order_id[0]] = [line]
                } else {
                    this.sale_lines_by_sale_id[line.order_id[0]].push(line)
                }
            }
        },

        _insurance_search_string: function (insurance) {
            var str = insurance.insurance_company_id[1];
            str += '|' + insurance.code;
            if (insurance.subscriber_id) {
                var partner = this.partner_by_id[insurance.subscriber_id[0]]
                if (partner) {
                    if (partner['name']) {
                        str += '|' + partner['name'];
                    }
                    if (partner.mobile) {
                        str += '|' + partner['mobile'];
                    }
                    if (partner.phone) {
                        str += '|' + partner['phone'];
                    }
                    if (partner.email) {
                        str += '|' + partner['email'];
                    }
                }
            }
            if (insurance.patient_name) {
                str += '|' + insurance['patient_name'];
            }
            if (insurance.patient_number) {
                str += '|' + insurance['patient_number'];
            }
            if (insurance.medical_number) {
                str += '|' + insurance['medical_number'];
            }
            if (insurance.employee) {
                str += '|' + insurance['employee'];
            }
            if (insurance.phone) {
                str += '|' + insurance['phone'];
            }
            str = '' + insurance['id'] + ':' + str.replace(':', '') + '\n';
            return str;
        },
        search_insurances: function (query) {
            try {
                query = query.replace(/[\[\]\(\)\+\*\?\.\-\!\&\^\$\|\~\_\{\}\:\,\\\/]/g, '.');
                query = query.replace(' ', '.+');
                var re = RegExp("([0-9]+):.*?" + query, "gi");
            } catch (e) {
                return [];
            }
            var results = [];
            for (var i = 0; i < this.limit; i++) {
                var r = re.exec(this.insurances_search_string);
                if (r && r[1]) {
                    var id = r[1];
                    if (this.insurance_by_id[id] !== undefined) {
                        results.push(this.insurance_by_id[id]);
                    }
                } else {
                    break;
                }
            }
            return results;
        },
        save_insurances: function (insurances) {
            if (this.insurances.length == 0) {
                this.insurances = insurances;
            } else {
                this.insurances = this.insurances.concat(insurances);
            }
            for (var i = 0; i < this.insurances.length; i++) {
                var insurance = this.insurances[i];
                this.insurance_by_id[insurance.id] = insurance;
                this.insurance_by_partner_id[insurance.subscriber_id[0]] = insurance
                var str = this._insurance_search_string(insurance);
                this.insurances_autocomplete.push({
                    value: insurance['id'],
                    label: str
                });
                this.insurances_search_string += str;
            }
        },
    });
});
