"use strict";
odoo.define('pos_retail.screen_client_list', function (require) {

    var screens = require('point_of_sale.screens');
    var core = require('web.core');
    var qweb = core.qweb;
    var _t = core._t;

    screens.ClientListScreenWidget.include({
        start: function () {
            var self = this;
            this._super();
            this.pos.bind('update:point-client', function () {
                var partners = self.pos.db.get_partners_sorted(1000);
                self.re_render_list(partners);
            });
            this.pos.bind('sync:partner', function (partner_data) {
                self.pos.database['res.partner'] = _.filter(self.pos.database['res.partner'], function (partner) {
                    return partner.id != partner_data['id']
                });
                self.pos.database['res.partner'].push(partner_data);
                self.partner_cache.cache_node(partner_data['id'], null);
                self.pos.db.add_partners([partner_data])
            });
        },
        re_render_list: function (partners) {
            var contents = this.$el[0].querySelector('.client-list-contents');
            contents.innerHTML = "";
            for (var i = 0, len = Math.min(partners.length, 1000); i < len; i++) {
                var partner = partners[i];
                var clientline_html = qweb.render('ClientLine', {widget: this, partner: partners[i]});
                var clientline = document.createElement('tbody');
                clientline.innerHTML = clientline_html;
                clientline = clientline.childNodes[1];
                this.partner_cache.cache_node(partner.id, clientline);
                if (partner === this.old_client) {
                    clientline.classList.add('highlight');
                } else {
                    clientline.classList.remove('highlight');
                }
                contents.appendChild(clientline);
            }
        },
        show: function () {
            var self = this;
            this.search_partners = [];
            this._super();
            this.$('.back').click(function () {
                var order_selected = self.pos.get_order();
                if (self.pos.config.required_add_customer_before_put_product_to_cart && order_selected && !order_selected.get_client()) {
                    return self.pos.gui.show_popup('confirm', {
                        'title': _t('Warning'),
                        'body': 'You have to select customer first',
                        confirm: function () {
                            return self.pos.gui.show_screen('clientlist');
                        },
                        cancel: function () {
                            return self.pos.gui.show_screen('clientlist');
                        }
                    });
                }
            });
            var $search_box = $('.clientlist-screen .searchbox >input');
            $search_box.autocomplete({
                source: this.pos.db.partners_autocomplete,
                minLength: this.pos.config.min_length_search,
                select: function (event, ui) {
                    if (ui && ui['item'] && ui['item']['value']) {
                        var partner = self.pos.db.partner_by_id[parseInt(ui['item']['value'])];
                        if (partner) {
                            self.pos.get_order().set_client(partner);
                            self.pos.gui.back();
                        }
                        setTimeout(function () {
                            self.clear_search();
                        }, 10);
                    }
                }
            });
            this.$('.only_customer').click(function () {
                self.pos.only_customer = !self.pos.only_customer;
                self.pos.only_supplier = !self.pos.only_customer;
                if (self.pos.only_customer) {
                    self.$('.only_customer').addClass('highlight');
                    self.$('.only_supplier').removeClass('highlight');
                } else {
                    self.$('.only_customer').removeClass('highlight');
                    self.$('.only_supplier').addClass('highlight');
                }
                var partners = self.pos.db.get_partners_sorted(1000);
                self.render_list(partners);
            });
            this.$('.only_supplier').click(function () {
                self.pos.only_supplier = !self.pos.only_supplier;
                self.pos.only_customer = !self.pos.only_supplier;
                if (self.pos.only_supplier) {
                    self.$('.only_supplier').addClass('highlight');
                    self.$('.only_customer').removeClass('highlight');
                } else {
                    self.$('.only_supplier').removeClass('highlight');
                    self.$('.only_customer').addClass('highlight');
                }
                var partners = self.pos.db.get_partners_sorted(1000);
                self.render_list(partners);
            });
            this.$('.back').click(function () {
                self.pos.trigger('back:order');
            });
            this.$('.next').click(function () {
                self.pos.trigger('back:order');
            });
            this.$('.sort_by_id').click(function () {
                if (self.search_partners.length == 0) {
                    var partners = self.pos.db.get_partners_sorted(1000).sort(self.pos.sort_by('id', self.reverse, parseInt));
                    self.render_list(partners);
                    self.reverse = !self.reverse;
                } else {
                    self.search_partners = self.search_partners.sort(self.pos.sort_by('id', self.reverse, parseInt));
                    self.render_list(self.search_partners);
                    self.reverse = !self.reverse;
                }
            });
            this.$('.sort_by_name').click(function () {
                if (self.search_partners.length == 0) {
                    var partners = self.pos.db.get_partners_sorted(1000).sort(self.pos.sort_by('name', self.reverse, function (a) {
                        if (!a) {
                            a = 'N/A';
                        }
                        return a.toUpperCase()
                    }));
                    self.render_list(partners);
                    self.reverse = !self.reverse;
                } else {
                    self.search_partners = self.search_partners.sort(self.pos.sort_by('name', self.reverse, function (a) {
                        if (!a) {
                            a = 'N/A';
                        }
                        return a.toUpperCase()
                    }));
                    self.render_list(self.search_partners);
                    self.reverse = !self.reverse;
                }
            });
            this.$('.sort_by_address').click(function () {
                if (self.search_partners.length == 0) {
                    var partners = self.pos.db.get_partners_sorted(1000).sort(self.pos.sort_by('name', self.reverse, function (a) {
                        if (!a) {
                            a = 'N/A';
                        }
                        return a.toUpperCase()
                    }));
                    self.render_list(partners);
                    self.reverse = !self.reverse;
                } else {
                    self.search_partners = self.search_partners.sort(self.pos.sort_by('name', self.reverse, function (a) {
                        if (!a) {
                            a = 'N/A';
                        }
                        return a.toUpperCase()
                    }));
                    self.render_list(self.search_partners);
                    self.reverse = !self.reverse;
                }
            });
            this.$('.sort_by_phone').click(function () {
                if (self.search_partners.length == 0) {
                    var partners = self.pos.db.get_partners_sorted(1000).sort(self.pos.sort_by('phone', self.reverse, function (a) {
                        if (!a) {
                            a = 'N/A';
                        }
                        return a.toUpperCase()
                    }));
                    self.render_list(partners);
                    self.reverse = !self.reverse;
                } else {
                    self.search_partners = self.search_partners.sort(self.pos.sort_by('phone', self.reverse, function (a) {
                        if (!a) {
                            a = 'N/A';
                        }
                        return a.toUpperCase()
                    }));
                    self.render_list(self.search_partners);
                    self.reverse = !self.reverse;
                }
            });
            this.$('.sort_by_mobile').click(function () {
                if (self.search_partners.length == 0) {
                    var partners = self.pos.db.get_partners_sorted(1000).sort(self.pos.sort_by('mobile', self.reverse, function (a) {
                        if (!a) {
                            a = 'N/A';
                        }
                        return a.toUpperCase()
                    }));
                    self.render_list(partners);
                    self.reverse = !self.reverse;
                } else {
                    self.search_partners = self.search_partners.sort(self.pos.sort_by('mobile', self.reverse, function (a) {
                        if (!a) {
                            a = 'N/A';
                        }
                        return a.toUpperCase()
                    }));
                    self.render_list(self.search_partners);
                    self.reverse = !self.reverse;
                }
            });
        },
        render_list: function (partners) {
            if (this.pos.only_customer) {
                var partners = _.filter(partners, function (partner) {
                    return partner['customer'] == true;
                });
                this.search_partners = partners;
                return this._super(partners);
            }
            if (this.pos.only_supplier) {
                var partners = _.filter(partners, function (partner) {
                    return partner['supplier'] == true;
                });
                this.search_partners = partners;
                return this._super(partners);
            }
            this.search_partners = partners;
            return this._super(partners);
        },
        clear_search: function () {
            this.search_partners = [];
            return this._super();
        },
        save_client_details: function (partner) {
            var id = partner.id || false;
            var fields = {};
            this.$('.client-details-contents .detail').each(function (idx, el) {
                fields[el.name] = el.value || false;
            });
            if (this.pos.config.check_duplicate_email && fields['email']) {
                if (id) {
                    var old_partners = _.filter(this.pos.db.partners, function (partner_check) {
                        return partner_check['id'] != id && partner_check['email'] == fields['email'];
                    });
                    if (old_partners.length != 0) {
                        return this.pos.gui.show_popup('confirm', {
                            title: 'Warning',
                            body: 'Email is duplicated with other customer' + old_partners[0]['name']
                        })
                    }
                } else {
                    var old_partners = _.filter(this.pos.db.partners, function (partner_check) {
                        return partner_check['email'] == fields['email'];
                    });
                    if (old_partners.length != 0) {
                        return this.pos.gui.show_popup('confirm', {
                            title: 'Warning',
                            body: 'Email is duplicated with other customer' + old_partners[0]['name']
                        })
                    }
                }
            }
            if (this.pos.config.check_duplicate_phone && fields['phone']) {
                if (id) {
                    var old_partners = _.filter(this.pos.db.partners, function (partner_check) {
                        return partner_check['id'] != id && partner_check['phone'] == fields['phone'];
                    });
                    if (old_partners.length != 0) {
                        return this.pos.gui.show_popup('confirm', {
                            title: 'Warning',
                            body: 'Phone have used before, your phone input of other client ' + old_partners[0]['name']
                        })
                    }
                } else {
                    var old_partners = _.filter(this.pos.db.partners, function (partner_check) {
                        return partner_check['phone'] == fields['phone'];
                    });
                    if (old_partners.length != 0) {
                        return this.pos.gui.show_popup('confirm', {
                            title: 'Warning',
                            body: 'Phone have used before, your phone input of other client ' + old_partners[0]['name']
                        })
                    }
                }
            }
            return this._super(partner);
        }
    });

});