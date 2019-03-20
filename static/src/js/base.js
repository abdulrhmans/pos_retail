odoo.define('pos_retail.base', function (require) {
    var core = require('web.core');
    var rpc = require('web.rpc');
    var session = require('web.session');
    var _t = core._t;
    var models = require('point_of_sale.models');


    var _super_posmodel = models.PosModel.prototype;

    models.PosModel = models.PosModel.extend({
        initialize: function (session, attributes) {
            this.pos_params = [];
            return _super_posmodel.initialize.apply(this, arguments);
        },
        load_server_data: function () {
            var self = this;
            return _super_posmodel.load_server_data.apply(this, arguments).then(function () {
                if (self.config.use_parameters && self.config.time_refresh_parameter && self.config.time_refresh_parameter > 0) {
                    setInterval(function () {
                        self.auto_update_pos_parameters();
                    }, self.config.time_refresh_parameter * 1000);
                }
            })
        },
        auto_update_pos_parameters: function () {
            if (this.pos_params.length) {
                for (var i=0; i < this.pos_params.length; i++) {
                    var params = this.pos_params[i];
                    rpc.query(params).then(function (result) {
                        console.log('auto_update_pos_parameters');
                    })
                }
            }
        }

    });

    _super_posmodel.load_server_data = function () {
        var self = this;
        var loaded = new $.Deferred();
        var progress = 0;
        var progress_step = 1.0 / self.models.length;
        var tmp = {};

        function load_model(index) {
            if (index >= self.models.length) {
                loaded.resolve();
            } else {
                var model = self.models[index];
                self.chrome.loading_message(_t('Loading') + ' ' + (model.label || model.model || ''), progress);
                var cond = typeof model.condition === 'function' ? model.condition(self, tmp) : true;
                if (!cond) {
                    load_model(index + 1);
                    return;
                }
                var fields = typeof model.fields === 'function' ? model.fields(self, tmp) : model.fields;
                var domain = typeof model.domain === 'function' ? model.domain(self, tmp) : model.domain;
                var context = typeof model.context === 'function' ? model.context(self, tmp) : model.context || {};
                var ids = typeof model.ids === 'function' ? model.ids(self, tmp) : model.ids;
                var order = typeof model.order === 'function' ? model.order(self, tmp) : model.order;
                progress += progress_step;
                if (model.model) {
                    var params = {
                        model: model.model,
                        context: _.extend(context, session.user_context || {}),
                    };
                    if (model.ids) {
                        params.method = 'read';
                        params.args = [ids, fields];
                    } else {
                        params.method = 'search_read';
                        params.domain = domain;
                        params.fields = fields;
                        params.orderBy = order;
                    }
                    if (session.config_id) {
                        params['kwargs'] = {'retail': true, 'config_id': session['config_id']}
                    }
                    var parameters = self.session.parameters;
                    var restore = true;
                    if (model.model == 'pos.config' || model.model == 'restaurant.floor' || model.model == 'res.users' || model.model == 'account.journal' || !self.session.use_parameters) {
                        restore = false;
                    }
                    if (!parameters) {
                        parameters = {};
                    }
                    if (parameters[model.model] && parameters[model.model].length == 1 && restore) {
                        console.log('Bypass loading: ' + model.model);
                        self.pos_params.push(params);
                        var result = JSON.parse(parameters[model.model][0]['datas']);
                        try {
                            $.when(model.loaded(self, result, tmp))
                                .then(function () {
                                        load_model(index + 1);
                                    },
                                    function (err) {
                                        loaded.reject(err);
                                    });
                        } catch (err) {
                            console.error(err.message, err.stack);
                            load_model(index + 1);
                        }
                    } else {
                        rpc.query(params).then(function (result) {
                            try {
                                $.when(model.loaded(self, result, tmp))
                                    .then(function () {
                                            load_model(index + 1);
                                        },
                                        function (err) {
                                            loaded.reject(err);
                                        });
                            } catch (err) {
                                console.error(err.message, err.stack);
                                load_model(index + 1);
                            }
                        }, function (err) {
                            loaded.reject(err);
                        });
                    }
                } else if (model.loaded) {
                    try {    // catching exceptions in model.loaded(...)
                        $.when(model.loaded(self, tmp))
                            .then(function () {
                                    load_model(index + 1);
                                },
                                function (err) {
                                    loaded.reject(err);
                                });
                    } catch (err) {
                        loaded.reject(err);
                    }
                } else {
                    load_model(index + 1);
                }
            }
        }

        try {
            load_model(0);
        } catch (err) {
            loaded.reject(err);
        }
        return loaded;
    }
});
