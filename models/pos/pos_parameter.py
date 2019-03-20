# -*- coding: utf-8 -*-
from odoo import api, models, fields, registry
import logging
import json

_logger = logging.getLogger(__name__)


class pos_parameter(models.Model):
    _name = "pos.parameter"
    _description = "Parameter POS"
    _order = "model_name"
    _rec_name = "model_name"

    model_name = fields.Char('Model', readonly=1, required=1)
    datas = fields.Text('Results', readonly=1, required=1)
    domain = fields.Char('Domain', required=1, index=True, readonly=1)
    field_list = fields.Char('Fields', index=True, readonly=1)
    config_id = fields.Many2one('pos.config', string='Pos config', required=1, readonly=1, index=True, )

    @api.model
    def save_parameter(self, config_id, model_name=None, datas=None, domain=None, field_list=None):
        if model_name in [
            'pos.session',
            'res.company',
            'pos.config',
            'res.users',
            'product.product',
            'product.pricelist',
            'product.pricelist.item',
            'account.invoice',
            'account.invoice.line',
            'pos.order',
            'pos.order.line',
            'sale.order',
            'sale.orde.line',
            'res.partner',
        ]:
            return False
        old_parameter = self.search([
            ('config_id', '=', config_id),
            ('model_name', '=', model_name),
            ('domain', '=', json.dumps(domain)),
            ('field_list', '=', json.dumps(field_list)),
        ])
        if old_parameter:
            return old_parameter.write({
                'datas': json.dumps(datas),
                'domain': json.dumps(domain),
                'field_list': json.dumps(field_list),
            })
        else:
            return self.create({
                'model_name': model_name,
                'config_id': config_id,
                'datas': json.dumps(datas),
                'domain': json.dumps(domain),
                'field_list': json.dumps(field_list),
            })
