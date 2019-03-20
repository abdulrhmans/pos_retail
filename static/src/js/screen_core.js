"use strict";
odoo.define('pos_retail.screens', function (require) {

    var screens = require('point_of_sale.screens');
    var core = require('web.core');
    var gui = require('point_of_sale.gui');
    var qweb = core.qweb;

    var TablesScreenWidget = screens.ScreenWidget.extend({
        template: 'TableScreenWidget',
        init: function (parent, options) {
            this._super(parent, options);
        },
        start: function () {
            var self = this;
            this._super();
            this.pos.bind('update:table-list', function () {
                self.renderElement();
            })
        },
        renderElement: function () {
            var self = this;
            this._super();
            var orders = this.pos.get('orders').models;
            var current_order = this.pos.get('selectedOrder');
            for (var i = 0; i < orders.length; i++) {
                var table = orders[i].table;
                if (table) {
                    var tablewidget = $(qweb.render('Table', {
                        widget: this,
                        table: table,
                    }));
                    tablewidget.data('id', table.id);
                    this.$('.table-items').append(tablewidget);
                    if (current_order) {
                        if (current_order.uid == orders[i].uid) {
                            tablewidget.css('background', 'rgb(110,200,155)');
                        }
                    }
                }
            }
            this.$('.table-item').on('click', function () {
                var table_id = parseInt($(this).data()['id']);
                self.clickTable(table_id);
                $(this).css('background', 'rgb(110,200,155)');
            });
        },
        get_order_by_table: function (table) {
            var orders = this.pos.get('orders').models;
            var order = orders.find(function (order) {
                if (order.table) {
                    return order.table.id == table.id;
                }
            });
            return order;
        },
        clickTable: function (table_id) {
            var self = this;
            var tables = self.pos.tables_by_id;
            var table = tables[table_id];
            if (table) {
                var order_click = this.get_order_by_table(table)
                if (order_click) {
                    this.pos.set('selectedOrder', order_click);
                    order_click.trigger('change', order_click);
                }
            }
            var items = this.$('.table-item');
            for (var i = 0; i < items.length; i++) {
                if (parseInt($(items[i]).data()['id']) != table_id) {
                    $(items[i]).css('background', '#fff');
                }
            }
        }
    });


    screens.NumpadWidget.include({
        renderElement: function () {
            var self = this;
            this._super();
            $('.pad').click(function () {
                if (!self.pos.hide_pads || self.pos.hide_pads == false) {
                    $('.actionpad').animate({height: 0}, 'low');
                    $('.numpad').animate({height: 0}, 'low');
                    $('.show_hide_pad').toggleClass('fa-caret-down fa-caret-up');
                    self.pos.hide_pads = true;
                } else {
                    $('.breadcrumbs').removeClass('oe_hidden');
                    $('.numpad').animate({height: '100%'}, 'low');
                    $('.show_hide_pad').toggleClass('fa-caret-down fa-caret-up');
                    self.pos.hide_pads = false;
                    if (self.pos.config.mobile_responsive) {
                        $('.actionpad').animate({height: '120px'}, 'low');
                    } else {
                        $('.actionpad').animate({height: '100%'}, 'low');
                    }
                }
            });
            this.pos.bind('change:selectedOrder', function () {
                if (self.pos.hide_pads) {
                    $('.actionpad').animate({height: 0}, 'low');
                    $('.numpad').animate({height: 0}, 'low');
                    $('.show_hide_pad').toggleClass('fa-caret-down fa-caret-up');
                }
            }, this);
        },
        clickChangeMode: function (event) {
            var self = this;
            var newMode = event.currentTarget.attributes['data-mode'].nodeValue;
            var order = this.pos.get_order();
            if (!order) {
                return this._super(event);
            }
            var line_selected = order.get_selected_orderline();
            if (!line_selected) {
                return this._super(event);
            }
            var is_return = order['is_return'];
            if (newMode == 'quantity' && this.pos.config.validate_quantity_change) {
                if (is_return) {
                    if (!this.pos.config.apply_validate_return_mode) {
                        return this._super(event);
                    } else {
                        return this.pos.gui.show_popup('ask_password', {
                            title: 'Pos pass pin ?',
                            body: 'Please use pos security pin for unlock',
                            confirm: function (value) {
                                var pin;
                                if (this.pos.config.validate_by_user_id) {
                                    var user_validate = this.pos.user_by_id[this.pos.config.validate_by_user_id[0]];
                                    pin = user_validate['pos_security_pin']
                                } else {
                                    pin = this.pos.user.pos_security_pin
                                }
                                if (value != pin) {
                                    return this.pos.gui.show_popup('confirm', {
                                        title: 'Wrong',
                                        body: 'Pos security pin not correct'
                                    })
                                } else {
                                    return self.state.changeMode(newMode);
                                }
                            }
                        });
                    }
                } else {
                    return this.pos.gui.show_popup('ask_password', {
                        title: 'Pos pass pin ?',
                        body: 'Please use pos security pin for unlock',
                        confirm: function (value) {
                            var pin;
                            if (this.pos.config.validate_by_user_id) {
                                var user_validate = this.pos.user_by_id[this.pos.config.validate_by_user_id[0]];
                                pin = user_validate['pos_security_pin']
                            } else {
                                pin = this.pos.user.pos_security_pin
                            }
                            if (value != pin) {
                                return this.pos.gui.show_popup('confirm', {
                                    title: 'Wrong',
                                    body: 'Pos security pin not correct'
                                })
                            } else {
                                return self.state.changeMode(newMode);
                            }
                        }
                    });
                }
            }
            if (newMode == 'discount' && this.pos.config.validate_discount_change) {
                if (is_return) {
                    if (!this.pos.config.apply_validate_return_mode) {
                        return this._super(val);
                    } else {
                        return this.pos.gui.show_popup('ask_password', {
                            title: 'Pos pass pin ?',
                            body: 'Please use pos security pin for unlock',
                            confirm: function (value) {
                                var pin;
                                if (this.pos.config.validate_by_user_id) {
                                    var user_validate = this.pos.user_by_id[this.pos.config.validate_by_user_id[0]];
                                    pin = user_validate['pos_security_pin']
                                } else {
                                    pin = this.pos.user.pos_security_pin
                                }
                                if (value != pin) {
                                    return this.pos.gui.show_popup('confirm', {
                                        title: 'Wrong',
                                        body: 'Pos security pin not correct'
                                    })
                                } else {
                                    return self.state.changeMode(newMode);
                                }
                            }
                        })
                    }
                } else {
                    return this.pos.gui.show_popup('ask_password', {
                        title: 'Pos pass pin ?',
                        body: 'Please use pos security pin for unlock',
                        confirm: function (value) {
                            var pin;
                            if (this.pos.config.validate_by_user_id) {
                                var user_validate = this.pos.user_by_id[this.pos.config.validate_by_user_id[0]];
                                pin = user_validate['pos_security_pin']
                            } else {
                                pin = this.pos.user.pos_security_pin
                            }
                            if (value != pin) {
                                return this.pos.gui.show_popup('confirm', {
                                    title: 'Wrong',
                                    body: 'Pos security pin not correct'
                                })
                            } else {
                                return self.state.changeMode(newMode);
                            }
                        }
                    })
                }
            }
            if (newMode == 'price' && this.pos.config.validate_price_change) {
                if (is_return) {
                    if (!this.pos.config.apply_validate_return_mode) {
                        return this._super(val);
                    } else {
                        return this.pos.gui.show_popup('ask_password', {
                            title: 'Pos pass pin ?',
                            body: 'Please use pos security pin for unlock',
                            confirm: function (value) {
                                var pin;
                                if (this.pos.config.validate_by_user_id) {
                                    var user_validate = this.pos.user_by_id[this.pos.config.validate_by_user_id[0]];
                                    pin = user_validate['pos_security_pin']
                                } else {
                                    pin = this.pos.user.pos_security_pin
                                }
                                if (value != pin) {
                                    return this.pos.gui.show_popup('confirm', {
                                        title: 'Wrong',
                                        body: 'Pos security pin not correct'
                                    })
                                } else {
                                    return self.state.changeMode(newMode);
                                }
                            }
                        });
                    }

                } else {
                    return this.pos.gui.show_popup('ask_password', {
                        title: 'Pos pass pin ?',
                        body: 'Please use pos security pin for unlock',
                        confirm: function (value) {
                            var pin;
                            if (this.pos.config.validate_by_user_id) {
                                var user_validate = this.pos.user_by_id[this.pos.config.validate_by_user_id[0]];
                                pin = user_validate['pos_security_pin']
                            } else {
                                pin = this.pos.user.pos_security_pin
                            }
                            if (value != pin) {
                                return this.pos.gui.show_popup('confirm', {
                                    title: 'Wrong',
                                    body: 'Pos security pin not correct'
                                })
                            } else {
                                return self.state.changeMode(newMode);
                            }
                        }
                    });
                }
            }
            return this._super(event);
        }
    });

    screens.ActionButtonWidget.include({
        highlight: function (highlight) {
            this._super(highlight);
            if (highlight) {
                this.$el.addClass('highlight');
            } else {
                this.$el.removeClass('highlight');
            }
        },
        altlight: function (altlight) {
            this._super(altlight);
            if (altlight) {
                this.$el.addClass('btn-info');
            } else {
                this.$el.removeClass('btn-info');
            }
        }
    });

    screens.ScreenWidget.include({
        show: function () {
            var self = this;
            this._super();
            $('.pos-logo').replaceWith();
            this.pos.barcode_reader.set_action_callback('order', _.bind(this.barcode_order_return_action, this));
            if (this.pos.config.is_customer_screen) {
                $('.pos .order-selector').css('display', 'none');
                $('.pos .leftpane').css('left', '0px');
                $('.pos .rightpane').css('left', '440px');
                $('.username').replaceWith();
                $('.js_synch').replaceWith();
                $('.oe_icon').css("padding-right", '60px');
                $('.pos-rightheader').css("right", '0px');
                $('.pos-rightheader').css("float", 'right');
                $('.pos-rightheader').css("left", 'auto');
                $('.find_customer').replaceWith();
                $('.full-content').css("top", '10px');
                $('.show_hide_buttons').remove();
                $('.quickly_buttons').remove();
                $('.layout-table').replaceWith();
                $('.buttons_pane').replaceWith();
                $('.collapsed').replaceWith();
                var image_url = window.location.origin + '/web/image?model=pos.config.image&field=image&id=';
                var images = self.pos.images;
                for (var i = 0; i < images.length; i++) {
                    images[i]['image_url'] = 'background-image:url(' + image_url + images[i]['id'] + ')';
                }
                this.$('.rightpane').append(qweb.render('customer_screen', {
                    widget: this,
                    images: images
                }));
                new Swiper('.gallery-top', {
                    spaceBetween: 10,
                    speed: this.pos.config.delay,
                    navigation: {
                        nextEl: '.swiper-button-next',
                        prevEl: '.swiper-button-prev'
                    },
                    autoplay: {
                        delay: 4000,
                        disableOnInteraction: false
                    }
                });
                new Swiper('.gallery-thumbs', {
                    speed: this.pos.config.delay,
                    spaceBetween: 10,
                    centeredSlides: true,
                    slidesPerView: 'auto',
                    touchRatio: 0.2,
                    slideToClickedSlide: true,
                    autoplay: {
                        delay: 4000,
                        disableOnInteraction: false
                    }
                });
            }
        },
        barcode_product_action: function (code) {
            /*
                multi scanner barcode
                controller of barcode scanner
                Please dont change this function because
                1) we're have multi screen and multi barcode type
                2) at each screen we're have difference scan and parse code
                3) default of odoo always fixed high priority for scan products
             */
            var current_screen = this.pos.gui.get_current_screen();
            if (current_screen && current_screen == 'return_products') {
                this.scan_return_product(code);
            }
            if (current_screen != 'return_products') {
                return this._super(code)
            }
        },
        barcode_order_return_action: function (datas_code) {
            if (datas_code && datas_code['type']) {
                console.log('{scanner} ean13 code: ' + datas_code.type);
            }
            if (datas_code.type == 'order') {
                var order = this.pos.db.order_by_ean13[datas_code['code']]
                var order_lines = this.pos.db.lines_by_order_id[order.id];
                if (!order_lines) {
                    this.barcode_error_action(datas_code);
                    return false;
                } else {
                    this.gui.show_popup('popup_return_pos_order_lines', {
                        order_lines: order_lines,
                        order: order
                    });
                    return true
                }
            } else {
                return false;
            }
        }
    });

    screens.ScaleScreenWidget.include({
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
    screens.ActionpadWidget.include({
        /*
                validation payment
                auto ask need apply promotion
                auto ask when have customer special discount
         */
        renderElement: function () {
            var self = this;
            this._super();
            this.$('.pay').click(function () {
                var order = self.pos.get_order();
                order.validate_payment_order();
            });
        }
    });

    var receipt_review = screens.ScreenWidget.extend({
        template: 'receipt_review',
        show: function () {
            this._super();
            var self = this;
            this.render_change();
            this.render_receipt();
            this.handle_auto_print();
        },
        handle_auto_print: function () {
            if (this.should_auto_print()) {
                this.print();
            } else {
                this.lock_screen(false);
            }
        },
        should_auto_print: function () {
            return this.pos.config.iface_print_auto && !this.pos.get_order()._printed;
        },
        should_close_immediately: function () {
            return this.pos.config.iface_print_via_proxy && this.pos.config.iface_print_skip_screen;
        },
        lock_screen: function (locked) {
            this._locked = locked;
            if (locked) {
                this.$('.back').removeClass('highlight');
            } else {
                this.$('.back').addClass('highlight');
            }
        },
        get_receipt_render_env: function () {
            var order = this.pos.get_order();
            return {
                widget: this,
                pos: this.pos,
                order: order,
                receipt: order.export_for_printing(),
                orderlines: order.get_orderlines(),
                paymentlines: order.get_paymentlines(),
            };
        },
        print_web: function () {
            window.print();
            this.pos.get_order()._printed = true;
        },
        print_xml: function () {
            var env = this.get_receipt_render_env();
            var receipt;
            if (this.pos.config.receipt_without_payment_template == 'display_price') {
                receipt = qweb.render('XmlReceipt', env);
            } else {
                receipt = qweb.render('xml_receipt_not_show_price', env);
            }
            this.pos.proxy.print_receipt(receipt);
            this.pos.get_order()._printed = true;
        },
        print: function () {
            var self = this;

            if (!this.pos.config.iface_print_via_proxy) { // browser (html) printing
                this.lock_screen(true);
                setTimeout(function () {
                    self.lock_screen(false);
                }, 1000);
                this.print_web();
            } else {    // proxy (xml) printing
                this.print_xml();
                this.lock_screen(false);
            }
        },

        click_back: function () {
            this.pos.gui.show_screen('products')
        },
        renderElement: function () {
            var self = this;
            this._super();
            this.$('.back').click(function () {
                if (!self._locked) {
                    self.click_back();
                }
                self.pos.trigger('back:order');
            });
            this.$('.button.print').click(function () {
                if (!self._locked) {
                    self.print();
                }
            });
        },
        render_change: function () {
            this.$('.change-value').html(this.format_currency(this.pos.get_order().get_change()));
        },
        render_receipt: function () {
            this.$('.pos-receipt-container').html(qweb.render('pos_ticket_review', this.get_receipt_render_env()));
        }
    });

    gui.define_screen({name: 'receipt_review', widget: receipt_review});
});
