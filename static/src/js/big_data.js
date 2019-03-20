odoo.define('pos_retail.big_data', function (require) {
    var models = require('point_of_sale.models');
    var core = require('web.core');
    var _t = core._t;
    var rpc = require('pos.rpc');
    var ParameterDB = require('pos_retail.parameter');
    var pos_chanel = require('pos_retail.pos_chanel');
    var WebClient = require('web.AbstractWebClient');
    var indexed_db = require('pos_retail.indexedDB');
    var db = require('point_of_sale.DB');
    var voucher = require('pos_retail.screen_voucher');

    var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;

    if (!indexedDB) {
        window.alert("Your browser doesn't support a stable version of IndexedDB.")
    }
    models.load_models([
        {
            label: 'products',
            loaded: function (self) {
                return indexed_db.get_products(self, self.session.model_ids['product.product']['max_id'] / 100000 + 1)
            },
        },
        {
            label: 'pricelist items',
            loaded: function (self) {
                return indexed_db.get_pricelist_items(self, self.session.model_ids['product.pricelist.item']['max_id'] / 100000 + 1)
            },
        },
        {
            label: 'partners',
            loaded: function (self) {
                return indexed_db.get_clients(self, self.session.model_ids['res.partner']['max_id'] / 100000 + 1)
            },
        },
        {
            label: 'invoices',
            loaded: function (self) {
                return indexed_db.get_invoices(self, self.session.model_ids['account.invoice']['max_id'] / 100000 + 1)
            },
        },
        {
            label: 'invoice lines',
            loaded: function (self) {
                return indexed_db.get_invoice_lines(self, self.session.model_ids['account.invoice.line']['max_id'] / 100000 + 1)
            },
        },
        {
            label: 'pos orders',
            loaded: function (self) {
                return indexed_db.get_pos_orders(self, self.session.model_ids['pos.order']['max_id'] / 100000 + 1)
            },
        },
        {
            label: 'pos order lines',
            loaded: function (self) {
                return indexed_db.get_pos_order_lines(self, self.session.model_ids['pos.order.line']['max_id'] / 100000 + 1)
            },
        },
        {
            label: 'sale orders',
            loaded: function (self) {
                return indexed_db.get_sale_orders(self, self.session.model_ids['sale.order']['max_id'] / 100000 + 1)
            },
        },
        {
            label: 'sale order lines',
            loaded: function (self) {
                return indexed_db.get_sale_order_lines(self, self.session.model_ids['sale.order.line']['max_id'] / 100000 + 1)
            },
        },
    ]);

    db.include({
        add_products: function (products) { // store product to pos
            if (!products instanceof Array) {
                products = [products];
            }
            if (self.posmodel.server_version == 10) {
                var pricelist = self.posmodel.pricelist;
                for (var i = 0; i < products.length; i++) {
                    var product = products[i];
                    if (pricelist) {
                        product['price'] = self.posmodel.get_price(product, pricelist, 1);
                    } else {
                        product['price'] = product['list_price'];
                    }
                }
            }
            this._super(products);

        }
    });
    var _super_PosModel = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({
        sort_by: function (field, reverse, primer) {
            var key = primer ?
                function (x) {
                    return primer(x[field])
                } :
                function (x) {
                    return x[field]
                };
            reverse = !reverse ? 1 : -1;
            return function (a, b) {
                return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
            }
        },
        initialize: function (session, attributes) {
            this.total_products = 0;
            this.total_clients = 0;
            this.max_load = 9999;
            this.next_load = 10000;
            this.database = {};
            this.write_date = '';
            this.stock_datas = session.stock_datas;
            this.session = session;
            this.sequence = 0;
            this.model_lock = [];
            this.model_unlock = [];
            this.model_ids = session['model_ids'];
            this.limited_size = false;
            for (var i = 0; i < this.models.length; i++) {
                var this_model = this.models[i];
                if (this_model.model && this.model_ids[this_model.model]) {
                    this_model['max_id'] = this.model_ids[this_model.model]['max_id'];
                    this_model['min_id'] = this.model_ids[this_model.model]['min_id'];
                    this.model_lock = _.filter(this.model_lock, function (model_check) {
                        return model_check['model'] != this_model.model;
                    });
                    this.model_lock.push(this_model);

                } else {
                    this.model_unlock.push(this_model);
                }
            }
            this.ParameterDB = new ParameterDB({});
            var config_id = this.ParameterDB.load(session.db + '_config_id');
            if (config_id) {
                var config_model = _.find(this.models, function (model) {
                    return model.model && model.model == "pos.config"
                });
                config_model.domain = [['id', '=', config_id]];
                this.config_id = config_id;
            }
            if (this.server_version == 10) {
                var currency_model = _.find(this.models, function (model) {
                    return model.model && model.model == "res.currency"
                });
                currency_model.ids = function (self) {
                    return [session.currency_id]
                }
            }
            if (this.server_version == 10) {
                this.models.push(
                    {
                        model: 'product.pricelist.item',
                        fields: [],
                        domain: [],
                        loaded: function (self, pricelist_items) {
                            _.each(pricelist_items, function (item) {
                                var pricelist = self.pricelist_by_id[item.pricelist_id[0]];
                                if (pricelist) {
                                    pricelist.items.push(item);
                                }
                                var base_pricelist = self.pricelist_by_id[item.base_pricelist_id[0]];
                                if (base_pricelist) {
                                    item.base_pricelist = base_pricelist;
                                }

                            });
                        }
                    }
                );
                var pricelist_loaded = this.get_model('product.pricelist');
                pricelist_loaded.ids = undefined;
                pricelist_loaded.fields = [];
                pricelist_loaded.domain = [];
                var pricelist_loaded_super = pricelist_loaded.loaded;
                pricelist_loaded.loaded = function (self, pricelists) {
                    pricelist_loaded_super(self, pricelists);
                    self.pricelist_by_id = {};
                    self.default_pricelist = _.find(pricelists, {id: self.config.pricelist_id[0]});
                    self.pricelists = pricelists;
                    _.map(pricelists, function (pricelist) {
                        pricelist.items = [];
                        self.pricelist_by_id[pricelist['id']] = pricelist;
                    });
                };
            }
            if ([11, 12].indexOf(this.server_version) != -1) {
                var wait_pricelist = this.get_model('product.pricelist');
                var _wait_super_loaded = wait_pricelist.loaded;
                wait_pricelist.loaded = function (self, pricelists) {
                    var pricelists_need_load = [];
                    for (var i = 0; i < pricelists.length; i++) {
                        var pricelist = pricelists[i];
                        if (self.config.available_pricelist_ids.indexOf(pricelist['id']) != -1) {
                            pricelists_need_load.push(pricelist)
                        }
                    }
                    _wait_super_loaded(self, pricelists_need_load);
                };
                var product_pricelist_item_model = this.get_model('product.pricelist.item');
                product_pricelist_item_model.fields = [];
                var _super_product_pricelist_item_loaded = product_pricelist_item_model.loaded;
                product_pricelist_item_model.loaded = function (self, pricelist_items) {
                    // *************************************
                    // if pricelist active == false
                    // no need loads items
                    // *************************************
                    var new_items = [];
                    var pricelist_by_id = {};
                    _.each(self.pricelists, function (pricelist) {
                        pricelist_by_id[pricelist.id] = pricelist;
                    });

                    _.each(pricelist_items, function (item) {
                        var pricelist = pricelist_by_id[item.pricelist_id[0]];
                        if (pricelist) {
                            new_items.push(item)
                        }
                    });
                    _super_product_pricelist_item_loaded(self, new_items);
                };
            }
            return _super_PosModel.initialize.call(this, session, attributes)
        },
        get_process_time: function (min, max) {
            if (min > max) {
                return 1
            } else {
                return (min / max).toFixed(2)
            }
        },
        save_parameter_models_load: function () {
            var models = {};
            var models_cache = [];
            for (var number in this.model_lock) {
                var model = this.model_lock[number];
                models[model['model']] = {
                    fields: model['fields'] || [],
                    domain: model['domain'] || [],
                    context: model['context'] || [],
                };
                if (model['model'] == 'res.partner' || model['model'] == 'product.pricelist.item') {
                    models[model['model']]['domain'] = []
                }
                if (model['model'] == 'product.pricelist.item') {
                    models[model['model']]['domain'] = []
                }
                models_cache.push(model['model'])
            }
            models['models_cache'] = models_cache;
            return rpc.query({
                model: 'pos.cache.database',
                method: 'save_parameter_models_load',
                args:
                    [models]
            })
        },
        set_last_write_date: function (results) {
            /*
                We need to know last records updated (change by backend clients)
                And use field write_date compare datas of pos and datas of backend
                We are get best of write date and compare
             */
            for (var i = 0; i < results.length; i++) {
                var line = results[i];
                if (!this.write_date) {
                    this.write_date = line.write_date;
                    continue;
                }
                if (this.write_date != line.write_date && new Date(this.write_date).getTime() < new Date(line.write_date).getTime()) {
                    this.write_date = line.write_date;
                }
            }
        },
        set_quantity_available: function (products) {
            if (!this.stock_datas) {
                return;
            }
            for (var i = 0; i < products.length; i++) {
                var product = products[i];
                if (this.stock_datas[product['id']]) {
                    product['qty_available'] = this.stock_datas[product['id']]
                }
            }
        },
        save_results: function (object_name, results) {
            /*
                All master datas use on pos we are save to 1 varialble database (pos.database)
                This is dict datas of products, customers, invoices, orders, sales order and lines....
             */
            if (!this.database[object_name]) {
                this.database[object_name] = results;
            } else {
                this.database[object_name] = this.database[object_name].concat(results);
            }
            this.set_last_write_date(results);
        },
        restore_datas: function (object_name) {
            /*
                This method calling model loaded of original pos odoo
             */
            var results = this.database[object_name];
            if (results != undefined) {
                var object = _.find(this.model_lock, function (object_loaded) {
                    return object_loaded.model == object_name;
                });
                if (object) {
                    console.log('Indexdb restoring: ' + object_name + ' rows: ' + results.length);
                    object.loaded(this, results, {})
                }
            }
        },
        reload_pos:
        /*
            When installed pos datas done, auto reload pos sessions
         */
            function () {
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
        ,
        api_install_datas: function (model_name) {
            var self = this;
            var loaded = new $.Deferred();
            var model = _.find(this.model_lock, function (model) {
                return model.model == model_name;
            });
            if (!model) {
                return loaded.resolve();
            }

            function installing_data(model_name, min_id, max_id) {
                var domain = [['id', '>=', min_id], ['id', '<', max_id]];
                var context = {};
                context['retail'] = true;
                if (model['model'] == 'product.product') {
                    domain.push(['available_in_pos', '=', true]);
                    var price_id = null;
                    if (self.pricelist) {
                        price_id = self.pricelist.id;
                    }
                    var stock_location_id = null;
                    if (self.config.stock_location_id) {
                        stock_location_id = self.config.stock_location_id[0]
                    }
                    context['location'] = stock_location_id;
                    context['pricelist'] = price_id;
                    context['display_default_code'] = false;
                }
                if (min_id == 0) {
                    max_id = self.max_load;
                }
                return rpc.query({
                    model: 'pos.config',
                    method: 'install_data',
                    args: [model_name, min_id, max_id]
                }).then(function (results) {
                    min_id += self.next_load;
                    if (typeof results == "string") {
                        results = JSON.parse(results);
                    }
                    if (results.length > 0) {
                        var process = self.get_process_time(min_id, model['max_id']);
                        self.chrome.loading_message(_t('Keep POS online, caching datas of ') + model['model'] + ': ' + (process * 100).toFixed(3) + ' %', process);
                        max_id += self.next_load;
                        installing_data(model_name, min_id, max_id);
                        indexed_db.write(model_name, results);
                    } else {
                        if (max_id < model['max_id']) {
                            max_id += self.next_load;
                            installing_data(model_name, min_id, max_id);
                        } else {
                            loaded.resolve();
                        }
                    }
                }).fail(function (error) {
                    var db = self.session.db;
                    for (var i = 0; i <= 100; i++) {
                        indexedDB.deleteDatabase(db + '_' + i);
                    }
                    self.reload_pos();
                    if (error.code == -32098) {
                        self.chrome.loading_message(_t('Your odoo backend offline, or your internet connection have problem'));
                    } else {
                        self.chrome.loading_message(_t('Installing error, remove cache and try again'));
                    }
                });
            }

            installing_data(model_name, 0, self.first_load);
            return loaded;
        },
        load_server_data: function () {
            var self = this;
            this.models = this.model_unlock;
            this.cached = false;
            return _super_PosModel.load_server_data.apply(this, arguments).then(function () {
                for (var index_number in self.model_lock) {
                    self.models.push(self.model_lock[index_number]);
                }
                if (!self.product_installed) {
                    return $.when(self.api_install_datas('product.pricelist.item')).then(function () {
                        return $.when(self.api_install_datas('product.product')).then(function () {
                            return $.when(self.api_install_datas('res.partner')).then(function () {
                                return $.when(self.api_install_datas('account.invoice')).then(function () {
                                    return $.when(self.api_install_datas('account.invoice.line')).then(function () {
                                        return $.when(self.api_install_datas('pos.order')).then(function () {
                                            return $.when(self.api_install_datas('pos.order.line')).then(function () {
                                                return $.when(self.api_install_datas('sale.order')).then(function () {
                                                    return $.when(self.api_install_datas('sale.order.line')).then(function () {
                                                        setTimeout(function () {
                                                            self.reload_pos();
                                                        }, 5000);
                                                        return true;
                                                    })
                                                })
                                            })
                                        })
                                    })
                                })
                            })
                        })
                    })
                } else {
                    for (var obj_name in self.model_ids) {
                        self.restore_datas(obj_name);
                    }
                    return true;
                }
            }).then(function () {
                setTimeout(function () {
                    if (self.write_date) {
                        rpc.query({
                            model: 'pos.cache.database',
                            method: 'get_datas_backend_modified',
                            args: [self.write_date]
                        }).then(function (results) {
                            console.log('big_data: total records backend modified: ' + results.length)
                            for (var i = 0; i < results.length; i++) {
                                var result = results[i];
                                if (self.server_version != 12) {
                                    self.sync_backend.sync_with_backend(result);
                                } else {
                                    self.sync_with_backend(result);
                                }
                            }
                        });
                    }
                    self.save_parameter_models_load()
                }, 5000);
                return true;
            })
        }
    });
})
;
