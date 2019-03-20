"use strict";
odoo.define('pos_retail.shop_logo', function (require) {

    var PosBaseWidget = require('point_of_sale.BaseWidget');
    var chrome = require('point_of_sale.chrome');
    var PopupWidget = require('point_of_sale.popups');
    var gui = require('point_of_sale.gui');
    var rpc = require('pos.rpc');
    var models = require('point_of_sale.models');

    models.PosModel = models.PosModel.extend({
        get_shop_logo: function () {
            if (this.shop_logo_base64) {
                return 'data:image/png;base64, ' + this.config.logo
            } else {
                if (this.company.logo) {
                    return 'data:image/png;base64, ' + this.company.logo
                } else {
                    return 'http://localhost:8069/web/image?model=product.product&field=image_medium&id=null'
                }
            }
        },
        get_receipt_logo: function () {
            if (this.shop_logo_base64) {
                return this.shop_logo_base64
            } else {
                return null
            }
        }
    });
    if (odoo.is_mobile) {
        return
    }

    models.load_models([
        {
            label: 'shop logo',
            condition: function (self) {
                if (self.is_mobile || self.config.mobile_responsive) {
                    return false
                } else {
                    return true;
                }
            },
            loaded: function (self) {
                self.pos_logo = new Image();
                var logo_loaded = new $.Deferred();
                self.pos_logo.onload = function () {
                    var img = self.pos_logo;
                    var ratio = 1;
                    var targetwidth = 300;
                    var maxheight = 150;
                    if (img.width !== targetwidth) {
                        ratio = targetwidth / img.width;
                    }
                    if (img.height * ratio > maxheight) {
                        ratio = maxheight / img.height;
                    }
                    var width = Math.floor(img.width * ratio);
                    var height = Math.floor(img.height * ratio);
                    var c = document.createElement('canvas');
                    c.width = width;
                    c.height = height;
                    var ctx = c.getContext('2d');
                    ctx.drawImage(self.pos_logo, 0, 0, width, height);

                    self.shop_logo_base64 = c.toDataURL();
                    logo_loaded.resolve();
                };
                self.pos_logo.onerror = function () {
                    logo_loaded.reject();
                };
                self.pos_logo.crossOrigin = "anonymous";
                self.pos_logo.src = '/web/image?model=pos.config&field=logo&id=' + self.config.id;

                return logo_loaded;
            },
        },
    ]);

    var shop_logo_widget = PosBaseWidget.extend({
        template: 'shop_logo_widget',
        init: function (parent, options) {
            options = options || {};
            this._super(parent, options);
            this.action = options.action;
            this.label = options.label;
        },
        renderElement: function () {
            var self = this;
            this._super();
            if (self.pos.config.change_logo) {
                this.$el.click(function () {
                    self.pos.gui.show_popup('popup_change_logo', {
                        title: 'Change shop logo',
                        body: 'Are you want update shop logo',
                        confirm: function () {
                            var fields = {};
                            if (this.uploaded_picture) {
                                fields.image = this.uploaded_picture.split(',')[1];
                            }
                            if (fields.image) {
                                return rpc.query({
                                    model: 'pos.config',
                                    method: 'write',
                                    args: [[parseInt(self.pos.config.id)], {
                                        logo: fields.image
                                    }]
                                }).then(function () {
                                    return self.pos.reload_pos();
                                }, function (type, err) {
                                    self.pos.gui.show_popup('confirm', {
                                        title: 'Error',
                                        body: 'Odoo connection fail, could not save'
                                    })
                                });
                            }
                        }
                    })
                });
            }
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
                return widget['name'] != 'shop_logo_widget';
            });
            if (odoo.is_mobile || !this.pos.config.mobile_responsive) {
                this.widgets.push(
                    {
                        'name': 'shop_logo_widget',
                        'widget': shop_logo_widget,
                        'append': '.pos-rightheader'
                    }
                );
            }
            this._super();
        }
    });
    var popup_change_logo = PopupWidget.extend({
        template: 'popup_change_logo',
        show: function (options) {
            var self = this;
            this.uploaded_picture = null;
            this._super(options);
            var contents = this.$('.card');
            contents.scrollTop(0);
            $('.confirm').click(function () {
                self.click_confirm();
            });
            $('.cancel').click(function () {
                self.click_cancel();
            });
            contents.find('.image-uploader').on('change', function (event) {
                self.load_image_file(event.target.files[0], function (res) {
                    if (res) {
                        contents.find('.client-picture img, .client-picture .fa').remove();
                        contents.find('.client-picture').append("<img src='" + res + "'>");
                        contents.find('.detail.picture').remove();
                        self.uploaded_picture = res;
                        var logo_shop_header = $('.shop');
                        logo_shop_header.find('.logo_shop_header').remove();
                        logo_shop_header.append("<img src='" + res + "' class='logo_shop_header'>");
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
    gui.define_popup({name: 'popup_change_logo', widget: popup_change_logo});
});

