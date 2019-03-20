"use strict";
odoo.define('pos_retail.screen_products_operation', function (require) {
    var screens = require('point_of_sale.screens');
    var core = require('web.core');
    var PopupWidget = require('point_of_sale.popups');
    var _t = core._t;
    var gui = require('point_of_sale.gui');
    var rpc = require('pos.rpc');
    var qweb = core.qweb;

    var popup_create_pos_category = PopupWidget.extend({
        template: 'popup_create_pos_category',
        show: function (options) {
            var self = this;
            this.uploaded_picture = null;
            this._super(options);
            var contents = this.$('.create_product');
            contents.scrollTop(0);
            this.$('.confirm').click(function () {
                var fields = {};
                var validate;
                $('.category_input').each(function (idx, el) {
                    fields[el.name] = el.value || false;
                });
                if (!fields.name) {
                    self.wrong_input('#name');
                    validate = false;
                } else {
                    self.passed_input('#name');
                }
                if (validate == false) {
                    return;
                }
                if (this.uploaded_picture) {
                    fields.image = this.uploaded_picture.split(',')[1];
                }
                if (fields['parent_id']) {
                    fields['parent_id'] = parseInt(fields['parent_id'])
                }
                return rpc.query({
                    model: 'pos.category',
                    method: 'create',
                    args: [fields]
                }).then(function (category_id) {
                    console.log('{category_id} created : ' + category_id);
                    return self.pos.gui.show_popup('confirm', {
                        title: 'Done',
                        body: 'Created new category'
                    })
                }, function (type, err) {
                    if (err.code && err.code == 200 && err.data && err.data.message && err.data.name) {
                        self.pos.gui.show_popup('confirm', {
                            title: err.data.name,
                            body: err.data.message,
                        })
                    } else {
                        self.pos.gui.show_popup('confirm', {
                            title: 'Error',
                            body: 'Odoo connection fail, could not save'
                        })
                    }
                });
            });
            this.$('.cancel').click(function () {
                self.click_cancel();
            });
            contents.find('.image-uploader').on('change', function (event) {
                self.load_image_file(event.target.files[0], function (res) {
                    if (res) {
                        contents.find('.client-picture img, .client-picture .fa').remove();
                        contents.find('.client-picture').append("<img src='" + res + "'>");
                        contents.find('.detail.picture').remove();
                        self.uploaded_picture = res;
                    }
                });
            });
        },
        load_image_file: function (file, callback) {
            var self = this;
            if (!file) {
                return;
            }
            if (file.type && !file.type.match(/image.*/)) {
                return this.pos.gui.show_popup('confirm', {
                    title: 'Error',
                    body: 'Unsupported File Format, Only web-compatible Image formats such as .png or .jpeg are supported',
                });
            }

            var reader = new FileReader();
            reader.onload = function (event) {
                var dataurl = event.target.result;
                var img = new Image();
                img.src = dataurl;
                self.resize_image_to_dataurl(img, 600, 400, callback);
            };
            reader.onerror = function () {
                return self.pos.gui.show_popup('confirm', {
                    title: 'Error',
                    body: 'Could Not Read Image, The provided file could not be read due to an unknown error',
                });
            };
            reader.readAsDataURL(file);
        },
        resize_image_to_dataurl: function (img, maxwidth, maxheight, callback) {
            img.onload = function () {
                var canvas = document.createElement('canvas');
                var ctx = canvas.getContext('2d');
                var ratio = 1;

                if (img.width > maxwidth) {
                    ratio = maxwidth / img.width;
                }
                if (img.height * ratio > maxheight) {
                    ratio = maxheight / img.height;
                }
                var width = Math.floor(img.width * ratio);
                var height = Math.floor(img.height * ratio);

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                var dataurl = canvas.toDataURL();
                callback(dataurl);
            };
        }
    });
    gui.define_popup({name: 'popup_create_pos_category', widget: popup_create_pos_category});

    var popup_create_product = PopupWidget.extend({
        template: 'popup_create_product',
        show: function (options) {
            var self = this;
            var validate;
            this.uploaded_picture = null;
            this._super(options);
            var contents = this.$('.create_product');
            contents.scrollTop(0);
            this.$('.confirm').click(function () {
                var fields = {};
                $('.product_input').each(function (idx, el) {
                    fields[el.name] = el.value || false;
                });
                if (!fields.name) {
                    self.wrong_input('#name');
                    validate = false;
                } else {
                    self.passed_input('#name');
                }
                if (validate == false) {
                    return;
                }
                if (this.uploaded_picture) {
                    fields.image = this.uploaded_picture.split(',')[1];
                }
                if (fields['pos_categ_id']) {
                    fields['pos_categ_id'] = parseInt(fields['pos_categ_id'])
                }
                self.gui.close_popup();
                return rpc.query({
                    model: 'product.product',
                    method: 'create',
                    args: [fields]
                }).then(function (product_id) {
                    console.log('{product_id} created : ' + product_id);
                    return self.pos.gui.show_popup('confirm', {
                        title: 'Done',
                        body: 'Created new product'
                    })
                }, function (type, err) {
                    if (err.code && err.code == 200 && err.data && err.data.message && err.data.name) {
                        self.pos.gui.show_popup('confirm', {
                            title: err.data.name,
                            body: err.data.message
                        })
                    } else {
                        self.pos.gui.show_popup('confirm', {
                            title: 'Error',
                            body: 'Odoo connection fail, could not save'
                        })
                    }
                });
            });
            this.$('.cancel').click(function () {
                self.click_cancel();
            });
            contents.find('.image-uploader').on('change', function (event) {
                self.load_image_file(event.target.files[0], function (res) {
                    if (res) {
                        contents.find('.client-picture img, .client-picture .fa').remove();
                        contents.find('.client-picture').append("<img src='" + res + "'>");
                        contents.find('.detail.picture').remove();
                        self.uploaded_picture = res;
                    }
                });
            });
        },
        load_image_file: function (file, callback) {
            var self = this;
            if (!file) {
                return;
            }
            if (file.type && !file.type.match(/image.*/)) {
                return this.pos.gui.show_popup('confirm', {
                    title: 'Error',
                    body: 'Unsupported File Format, Only web-compatible Image formats such as .png or .jpeg are supported',
                });
            }

            var reader = new FileReader();
            reader.onload = function (event) {
                var dataurl = event.target.result;
                var img = new Image();
                img.src = dataurl;
                self.resize_image_to_dataurl(img, 600, 400, callback);
            };
            reader.onerror = function () {
                return self.pos.gui.show_popup('confirm', {
                    title: 'Error',
                    body: 'Could Not Read Image, The provided file could not be read due to an unknown error',
                });
            };
            reader.readAsDataURL(file);
        },
        resize_image_to_dataurl: function (img, maxwidth, maxheight, callback) {
            img.onload = function () {
                var canvas = document.createElement('canvas');
                var ctx = canvas.getContext('2d');
                var ratio = 1;

                if (img.width > maxwidth) {
                    ratio = maxwidth / img.width;
                }
                if (img.height * ratio > maxheight) {
                    ratio = maxheight / img.height;
                }
                var width = Math.floor(img.width * ratio);
                var height = Math.floor(img.height * ratio);

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                var dataurl = canvas.toDataURL();
                callback(dataurl);
            };
        }
    });
    gui.define_popup({name: 'popup_create_product', widget: popup_create_product});

    var products_screen = screens.ScreenWidget.extend({ // products screen
        template: 'products_screen',
        start: function () {
            var self = this;
            this._super();
            this.products = this.pos.database['product.product'];
            this.product_by_id = {};
            this.product_by_string = "";
            if (this.products) {
                this.save_products(this.products);
            }
        },
        init: function (parent, options) {
            var self = this;
            this._super(parent, options);
            this.product_cache = new screens.DomCache();
            this.pos.bind('sync:product', function (product_data) { // product operation update screen
                var products = _.filter(self.pos.database['product.product'], function (product) {
                    return product['id'] != product_data['id'];
                });
                products.push(product_data);
                self.product_by_id[product_data['id']] = product_data;
                self.product_by_string += self.pos.db._product_search_string(product_data);
                self.clear_search();
                self.display_product_edit('show', product_data);
            });
        },
        save_products: function (products) {
            for (var i = 0; i < products.length; i++) {
                var product = products[i];
                this.product_by_id[product['id']] = product;
                this.product_by_string += this.pos.db._product_search_string(product);
            }
        },
        search_products: function (query) {
            try {
                query = query.replace(/[\[\]\(\)\+\*\?\.\-\!\&\^\$\|\~\_\{\}\:\,\\\/]/g, '.');
                query = query.replace(' ', '.+');
                var re = RegExp("([0-9]+):.*?" + query, "gi");
            } catch (e) {
                return [];
            }
            var results = [];
            for (var i = 0; i < 1000; i++) {
                var r = re.exec(this.product_by_string);
                if (r && r[1]) {
                    var id = r[1];
                    if (this.product_by_id[id] !== undefined) {
                        results.push(this.product_by_id[id]);
                    } else {
                        var code = r
                    }
                } else {
                    break;
                }
            }
            return results;
        },
        show: function () {
            this.products_last_search = [];
            var self = this;
            this._super();
            this.renderElement();
            this.details_visible = false;
            this.old_product = null;
            this.$('.back').click(function () {
                self.gui.back();
            });
            this.$('.searchbox .search-clear').click(function () {
                self.clear_search();
            });
            this.$('.new-product').click(function () {
                self.display_product_edit('show', {});
            });
            if (this.products) {
                this.render_list(this.products);
            }
            if (this.old_product) {
                this.display_product_edit('show', this.old_product, 0);
            }
            this.$('.client-list-contents').delegate('.product_row', 'click', function (event) {
                self.product_selected(event, $(this), parseInt($(this).data('id')));
            });
            var search_timeout = null;
            if (this.pos.config.iface_vkeyboard && this.chrome.widget.keyboard) {
                this.chrome.widget.keyboard.connect(this.$('.searchbox input'));
            }
            this.$('.searchbox input').on('keypress', function (event) {
                clearTimeout(search_timeout);
                var query = this.value;
                search_timeout = setTimeout(function () {
                    self.perform_search(query, event.which === 13);
                }, 70);
            });
            this.$('.searchbox .search-product').click(function () {
                self.clear_search();
            });
            if (!this.init_autocomplete_search) {
                var $search_box = $('.clientlist-screen .searchbox >input');
                $search_box.autocomplete({
                    source: this.pos.db.products_autocomplete,
                    minLength: this.pos.config.min_length_search,
                    select: function (event, ui) {
                        if (ui && ui['item'] && ui['item']['value']) {
                            var product = self.product_by_id[ui['item']['value']];
                            if (product) {
                                self.display_product_edit('show', product);
                            }
                            self.clear_search();
                        }
                    }
                });
                this.init_autocomplete_search = true;
            }
            this.$('.sort_by_product_operation_id').click(function () {
                if (self.products_last_search.length == 0) {
                    var products = self.products.sort(self.pos.sort_by('id', self.reverse, parseInt));
                    self.render_list(products);
                    self.reverse = !self.reverse;
                } else {
                    self.products = self.products_last_search.sort(self.pos.sort_by('id', self.reverse, parseInt));
                    self.render_list(self.products);
                    self.reverse = !self.reverse;
                }
            });
            this.$('.sort_by_product_operation_default_code').click(function () {
                if (self.products_last_search.length == 0) {
                    var products = self.products.sort(self.pos.sort_by('default_code', self.reverse, function (a) {
                        if (!a) {
                            a = 'N/A';
                        }
                        return a.toUpperCase()
                    }));
                    self.render_list(products);
                    self.reverse = !self.reverse;
                } else {
                    self.products_last_search = self.products_last_search.sort(self.pos.sort_by('default_code', self.reverse, function (a) {
                        if (!a) {
                            a = 'N/A';
                        }
                        return a.toUpperCase()
                    }));
                    self.render_list(self.products_last_search);
                    self.reverse = !self.reverse;
                }
            });
            this.$('.sort_by_product_operation_barcode').click(function () {
                if (self.products_last_search.length == 0) {
                    var products = self.products.sort(self.pos.sort_by('barcode', self.reverse, function (a) {
                        if (!a) {
                            a = 'N/A';
                        }
                        return a.toUpperCase()
                    }));
                    self.render_list(products);
                    self.reverse = !self.reverse;
                } else {
                    self.products_last_search = self.products_last_search.sort(self.pos.sort_by('barcode', self.reverse, function (a) {
                        if (!a) {
                            a = 'N/A';
                        }
                        return a.toUpperCase()
                    }));
                    self.render_list(self.products_last_search);
                    self.reverse = !self.reverse;
                }
            });
            this.$('.sort_by_product_operation_display_name').click(function () {
                if (self.products_last_search.length == 0) {
                    var products = self.products.sort(self.pos.sort_by('display_name', self.reverse, function (a) {
                        if (!a) {
                            a = 'N/A';
                        }
                        return a.toUpperCase()
                    }));
                    self.render_list(products);
                    self.reverse = !self.reverse;
                } else {
                    self.products_last_search = self.products_last_search.sort(self.pos.sort_by('display_name', self.reverse, function (a) {
                        if (!a) {
                            a = 'N/A';
                        }
                        return a.toUpperCase()
                    }));
                    self.render_list(self.products_last_search);
                    self.reverse = !self.reverse;
                }
            });
            this.$('.sort_by_product_operation_list_price').click(function () {
                if (self.products_last_search.length == 0) {
                    var products = self.products.sort(self.pos.sort_by('list_price', self.reverse, parseInt));
                    self.render_list(products);
                    self.reverse = !self.reverse;
                } else {
                    self.products = self.products_last_search.sort(self.pos.sort_by('list_price', self.reverse, parseInt));
                    self.render_list(self.products);
                    self.reverse = !self.reverse;
                }
            });
            this.$('.sort_by_product_operation_type').click(function () {
                if (self.products_last_search.length == 0) {
                    var products = self.products.sort(self.pos.sort_by('type', self.reverse, function (a) {
                        if (!a) {
                            a = 'N/A';
                        }
                        return a.toUpperCase()
                    }));
                    self.render_list(products);
                    self.reverse = !self.reverse;
                } else {
                    self.products_last_search = self.products_last_search.sort(self.pos.sort_by('type', self.reverse, function (a) {
                        if (!a) {
                            a = 'N/A';
                        }
                        return a.toUpperCase()
                    }));
                    self.render_list(self.products_last_search);
                    self.reverse = !self.reverse;
                }
            });
            this.$('.sort_by_product_operation_qty_available').click(function () {
                if (self.products_last_search.length == 0) {
                    var products = self.products.sort(self.pos.sort_by('qty_available', self.reverse, parseInt));
                    self.render_list(products);
                    self.reverse = !self.reverse;
                } else {
                    self.products = self.products_last_search.sort(self.pos.sort_by('qty_available', self.reverse, parseInt));
                    self.render_list(self.products);
                    self.reverse = !self.reverse;
                }
            });
            this.$('.sort_by_product_operation_pos_categ_id').click(function () {
                if (self.products_last_search.length == 0) {
                    var products = self.products.sort(self.pos.sort_by('pos_categ', self.reverse, function (a) {
                        if (!a) {
                            a = 'N/A';
                        }
                        return a.toUpperCase()
                    }));
                    self.render_list(products);
                    self.reverse = !self.reverse;
                } else {
                    self.products_last_search = self.products_last_search.sort(self.pos.sort_by('pos_categ', self.reverse, function (a) {
                        if (!a) {
                            a = 'N/A';
                        }
                        return a.toUpperCase()
                    }));
                    self.render_list(self.products_last_search);
                    self.reverse = !self.reverse;
                }
            });
        },
        hide: function () {
            this._super();
        },
        perform_search: function (query, associate_result) {
            var products = this.search_products(query);
            this.products_last_search = products;
            this.render_list(products);
        },
        clear_search: function () {
            this.render_list(this.products);
            var $input_search = $('.search-product input');
            if ($input_search.length) {
                $('.search-product input')[0].value = '';
            }
            this.products_last_search = [];
        },
        render_list: function (products) {
            if (!products) {
                return;
            }
            var self = this;
            var contents = this.$el[0].querySelector('.client-list-contents');
            contents.innerHTML = "";
            for (var i = 0, len = Math.min(products.length, 100); i < len; i++) {
                var product = products[i];
                var product_line_html = qweb.render('product_row', {widget: this, product: products[i]});
                var product_line = document.createElement('tbody');
                product_line.innerHTML = product_line_html;
                product_line = product_line.childNodes[1];
                this.product_cache.cache_node(product.id, product_line);
                if (product === this.old_product) {
                    product_line.classList.add('highlight');
                } else {
                    product_line.classList.remove('highlight');
                }
                contents.appendChild(product_line);
            }
        },
        product_selected: function (event, $line, id) {
            var product = this.product_by_id[id];
            if ($line.hasClass('highlight')) {
                $line.removeClass('highlight');
                this.display_product_edit('hide', product);
            } else {
                this.$('.client-list .highlight').removeClass('highlight');
                $line.addClass('highlight');
                var y = event.pageY - $line.parent().offset().top;
                this.display_product_edit('show', product, y);
            }
        },
        product_icon_url: function (id) {
            return '/web/image?model=product.product&id=' + id + '&field=image_small';
        },
        save_product_edit: function (product) {
            var self = this;
            var fields = {};
            this.$('.product-details-contents .detail').each(function (idx, el) {
                fields[el.name] = el.value || false;
            });
            if (!fields.name) {
                return this.pos.gui.show_popup('confirm', {
                    title: 'Error',
                    body: 'A Product name is required'
                });
            }
            if (this.uploaded_picture) {
                fields.image = this.uploaded_picture.split(',')[1];
            }
            fields['list_price'] = parseFloat(fields['list_price']);
            fields['pos_categ_id'] = parseFloat(fields['pos_categ_id']);
            if (fields['id']) {
                rpc.query({
                    model: 'product.product',
                    method: 'write',
                    args: [[parseInt(fields['id'])], fields],
                })
                    .then(function (result) {
                        if (result == true) {
                            self.pos.gui.show_popup('confirm', {
                                title: 'Saved',
                                body: 'Product saved'
                            })
                        }
                    }, function (type, err) {
                        self.pos.gui.show_popup('confirm', {
                            title: 'Error',
                            body: 'Odoo connection fail, could not save'
                        })
                    });
            } else {
                rpc.query({
                    model: 'product.product',
                    method: 'create',
                    args: [fields],
                })
                    .then(function (product_id) {
                        self.$('.product-details-contents').hide();
                        self.pos.gui.show_popup('confirm', {
                            title: 'Saved',
                            body: 'Product saved'
                        })
                    }, function (type, err) {
                        self.pos.gui.show_popup('confirm', {
                            title: 'Error',
                            body: 'Odoo connection fail, could not save'
                        })
                    });
            }
        },
        resize_image_to_dataurl: function (img, maxwidth, maxheight, callback) {
            img.onload = function () {
                var canvas = document.createElement('canvas');
                var ctx = canvas.getContext('2d');
                var ratio = 1;

                if (img.width > maxwidth) {
                    ratio = maxwidth / img.width;
                }
                if (img.height * ratio > maxheight) {
                    ratio = maxheight / img.height;
                }
                var width = Math.floor(img.width * ratio);
                var height = Math.floor(img.height * ratio);

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                var dataurl = canvas.toDataURL();
                callback(dataurl);
            };
        },
        load_image_file: function (file, callback) {
            var self = this;
            if (!file) {
                return;
            }
            if (file.type && !file.type.match(/image.*/)) {
                return this.pos.gui.show_popup('confirm', {
                    title: 'Error',
                    body: 'Unsupported File Format, Only web-compatible Image formats such as .png or .jpeg are supported',
                });
            }
            var reader = new FileReader();
            reader.onload = function (event) {
                var dataurl = event.target.result;
                var img = new Image();
                img.src = dataurl;
                self.resize_image_to_dataurl(img, 600, 400, callback);
            };
            reader.onerror = function () {
                return self.pos.gui.show_popup('confirm', {
                    title: 'Error',
                    body: 'Could Not Read Image, The provided file could not be read due to an unknown error',
                });
            };
            reader.readAsDataURL(file);
        },
        display_product_edit: function (visibility, product, clickpos) { // display product details to header page
            var self = this;
            var contents = this.$('.product-details-contents');
            contents.empty();
            if (visibility == 'show') {
                contents.append($(qweb.render('product_edit', {widget: this, product: product})));
                contents.find('.save').on('click', function (event) {
                    self.save_product_edit(event);
                });
                contents.find('.print_label').on('click', function (event) {
                    var fields = {};
                    $('.product-details-contents .detail').each(function (idx, el) {
                        fields[el.name] = el.value || false;
                    });
                    var product_id = fields['id'];
                    var product = self.pos.db.product_by_id[product_id];
                    if (product && product['barcode']) {
                        var product_label_html = qweb.render('product_label_xml', {
                            product: product
                        });
                        self.pos.proxy.print_receipt(product_label_html);
                        self.pos.gui.show_popup('confirm', {
                            title: 'Printed barcode',
                            body: 'Please get product label at your printer'
                        })
                    } else {
                        self.pos.gui.show_popup('confirm', {
                            title: 'Missing barcode',
                            body: 'Barcode of product not set'
                        })
                    }
                });
                contents.find('.update_qty_on_hand').on('click', function (event) {
                    self.pos.gui.show_popup('popup_update_quantity_each_location', {
                        title: 'Update qty on hand',
                        product: product
                    })
                });
                this.$('.product-details-contents').show();
            }
            if (visibility == 'hide') {
                this.$('.product-details-contents').hide();
            }
            contents.find('input').blur(function () {
                setTimeout(function () {
                    self.$('.window').scrollTop(0);
                }, 0);
            });
            contents.find('.image-uploader').on('change', function (event) {
                self.load_image_file(event.target.files[0], function (res) {
                    if (res) {
                        contents.find('.client-picture img, .client-picture .fa').remove();
                        contents.find('.client-picture').append("<img src='" + res + "'>");
                        contents.find('.detail.picture').remove();
                        self.uploaded_picture = res;
                    }
                });
            });
        },
        close: function () {
            this._super();
        }
    });
    gui.define_screen({name: 'productlist', widget: products_screen});

    var popup_update_quantity_each_location = PopupWidget.extend({
        template: 'popup_update_quantity_each_location',
        show: function (options) {
            var self = this;
            this._super(options);
            this.product = options.product;
            var locations = this.pos.stock_locations;
            this.location_selected = this.pos.get_location() || null;
            self.$el.find('.body').html(qweb.render('locations_list', {
                locations: locations,
                widget: self
            }));

            this.$('.location').click(function () {
                var location_id = parseInt($(this).data('id'));
                var location = self.pos.stock_location_by_id[location_id];
                var product_tmpl_id;
                if (self.pos.server_version == 10) {
                    product_tmpl_id = self.product.product_tmpl_id
                } else {
                    product_tmpl_id = self.product.product_tmpl_id[0];
                }
                if (location) {
                    self.pos.gui.show_popup('number', {
                        'title': _t('New Quantity on Hand'),
                        'value': self.pos.config.discount_limit_amount,
                        'confirm': function (new_quantity) {
                            var new_quantity = parseFloat(new_quantity)
                            return rpc.query({
                                model: 'stock.change.product.qty',
                                method: 'create',
                                args: [{
                                    product_id: self.product.id,
                                    product_tmpl_id: product_tmpl_id,
                                    new_quantity: new_quantity,
                                    location_id: location.id
                                }],
                                context: {}
                            }).then(function (wizard_id) {
                                return rpc.query({
                                    model: 'stock.change.product.qty',
                                    method: 'change_product_qty',
                                    args: [wizard_id],
                                    context: {}
                                }).then(function (result) {
                                    return rpc.query({
                                        model: 'pos.cache.database',
                                        method: 'get_stock_datas',
                                        args: [location.id, [self.product.id]],
                                        context: {}
                                    }).then(function (datas) {
                                        if (!datas) {
                                            return true;
                                        }
                                        var product_need_update = _.find(self.pos.database['product.product'], function (product_check) {
                                            return product_check['id'] == self.product.id
                                        });
                                        if (product_need_update) {
                                            var qty_available = datas[self.product.id];
                                            product_need_update['qty_available'] = qty_available;
                                            if (!(product_need_update['product_tmpl_id'] instanceof Array)) {
                                                product_need_update['product_tmpl_id'] = [product_need_update['product_tmpl_id'], product_need_update['display_name']];
                                            }
                                            self.pos.trigger('sync:product', product_need_update)
                                        }
                                        return self.pos.gui.show_popup('confirm', {
                                            title: 'Finished',
                                            body: 'Add new quantity to location'
                                        })
                                    })
                                }).fail(function (type, error) {
                                    return self.pos.query_backend_fail(type, error);
                                })
                            }).fail(function (type, error) {
                                return self.pos.query_backend_fail(type, error);
                            })
                        }
                    })

                }
            });
            this.$('.close').click(function () {
                self.pos.gui.close_popup();
            });
        }
    });
    gui.define_popup({name: 'popup_update_quantity_each_location', widget: popup_update_quantity_each_location});

});
