"use strict";
odoo.define('pos_retail.daily_report', function (require) {

    var screens = require('point_of_sale.screens');
    var core = require('web.core');
    var gui = require('point_of_sale.gui');
    var rpc = require('pos.rpc');
    var qweb = core.qweb;

    var daily_report = screens.ScreenWidget.extend({  // daily report screen
        template: 'daily_report',
        start: function () {
            this.user_id = null;
            this.line_selected = [];
            this._super();
        },
        show: function () {
            var self = this;
            if (this.line_selected.length == 0) {
                this.line_selected = this.pos.db.pos_order_lines
            }
            this._super();
            this.$('.search-clear').click();
            this.$('.datetimepicker').datetimepicker({
                format: 'YYYY-MM-DD H:mm:00',
                icons: {
                    time: "fa fa-clock-o",
                    date: "fa fa-calendar",
                    up: "fa fa-chevron-up",
                    down: "fa fa-chevron-down",
                    previous: 'fa fa-chevron-left',
                    next: 'fa fa-chevron-right',
                    today: 'fa fa-screenshot',
                    clear: 'fa fa-trash',
                    close: 'fa fa-remove'
                }
            });
            var users = this.pos.users;
            var users_list = [];
            for (var i = 0; i < users.length; i++) {
                var user = users[i];
                var label = user.name;
                users_list.push({
                    value: user['id'],
                    label: label
                })
            }
            var $search_box = this.$('.search_user >input');
            $search_box.autocomplete({
                source: users_list,
                minLength: this.pos.config.min_length_search,
                select: function (event, ui) {
                    if (ui && ui['item'] && ui['item']['value']) {
                        var user_id = ui['item']['value'];
                        var user = self.pos.user_by_id[user_id];
                        self.line_selected = _.filter(self.pos.db.pos_order_lines, function (line) {
                            return line['create_uid'][0] == user_id;
                        });
                        self.$('.search_user input').value = user['display_name'];
                        var start_date = self.$('.start_date').val();
                        var end_date = self.$('.end_date').val();
                        self.$('.pos-receipt-container').empty();
                        if (start_date && end_date) {
                            self.line_selected = _.filter(self.line_selected, function (line) {
                                return line['create_date'] >= start_date && line['create_date'] <= end_date
                            })
                        }
                        self.user_id = user_id;

                        self.render_report();
                        setTimeout(function () {
                            var input = self.el.querySelector('.search_user input');
                            input.value = user['display_name'];
                            input.focus();
                        }, 500);
                    }
                }
            });
            var self = this;
            this.line_selected = this.pos.db.pos_order_lines;
            this.$('.back').click(function () {
                self.pos.trigger('back:order');
                self.pos.gui.show_screen('products');
            });
            this.$('.search-clear').click(function () {
                self.user_id = null;
                self.line_selected = self.pos.db.pos_order_lines;
                var $start_date = self.el.querySelector('.start_date');
                $start_date.value = '';
                var $end_date = self.el.querySelector('.end_date');
                $end_date.value = '';
                var $search_user = self.el.querySelector('.search_user input');
                $search_user.value = '';
                self.render_report();
            });
            this.$('.start_date').blur(function () {
                self.line_selected = self.pos.db.pos_order_lines;
                var start_date = self.$(this).val();
                var end_date = self.$('.end_date').val();
                if (end_date) {
                    self.line_selected = _.filter(self.line_selected, function (line) {
                        return line['create_date'] >= start_date && line['create_date'] <= end_date;
                    })
                } else {
                    self.line_selected = _.filter(self.line_selected, function (line) {
                        return line['create_date'] >= start_date;
                    })
                }
                self.render_report();

            });
            this.$('.end_date').blur(function () {
                self.line_selected = self.pos.db.pos_order_lines;
                var start_date = self.$('.start_date').val();
                var end_date = self.$(this).val();
                if (start_date) {
                    self.line_selected = _.filter(self.line_selected, function (line) {
                        return line['create_date'] >= start_date && line['create_date'] <= end_date;
                    })
                } else {
                    self.line_selected = _.filter(self.line_selected, function (line) {
                        return line['end_date'] <= end_date;
                    })
                }
                self.render_report();
            });
            this.$('.print_daily_report').click(function () {
                if (self.pos.config.iface_print_via_proxy) {
                    self.render_report(true);
                } else {
                    return self.pos.gui.show_popup('confirm', {
                        title: 'Warning',
                        body: 'Your printer and posbox not available',
                    });
                }
            });
            this.render_report();
        },
        product_icon_url: function (id) {
            return '/web/image?model=product.product&id=' + id + '&field=image_small';
        },
        render_datas: function () {
            var line_selected = this.line_selected;
            var orderlines_by_user_id = {};
            for (var i = 0; i < line_selected.length; i++) {
                var line = line_selected[i];
                if (!orderlines_by_user_id[line['create_uid'][0]]) {
                    orderlines_by_user_id[line['create_uid'][0]] = [line]
                } else {
                    orderlines_by_user_id[line['create_uid'][0]].push(line)
                }
            }
            var datas = [];
            var user_id;
            for (user_id in orderlines_by_user_id) {
                var user = this.pos.user_by_id[user_id];
                var orderlines = orderlines_by_user_id[user_id];
                var amount_total = 0;
                for (var i = 0; i < orderlines.length; i++) {
                    var line = orderlines[i];
                    amount_total += line['price_unit'] * line['qty']
                }
                if (user) {
                    datas.push({
                        user: user,
                        orderlines: orderlines,
                        amount_total: amount_total
                    })
                }
            }
            return datas
        },
        render_report: function (print_xml) {
            var $daily_report = this.$('.pos-receipt-container');
            $daily_report.empty();
            var datas = this.render_datas();
            if (datas.length) {
                var report_html = qweb.render('daily_report_user_html', {
                    datas: datas,
                    pos: this.pos,
                    widget: this
                });
                $daily_report.html(report_html);
                if (print_xml) {
                    var report_xml = qweb.render('daily_report_user_xml', {
                        datas: datas,
                        pos: this.pos,
                        widget: this
                    });
                    this.pos.proxy.print_receipt(report_xml);
                }
            }
        }

    });
    gui.define_screen({name: 'daily_report', widget: daily_report});

});