# -*- coding: utf-8 -*-
from odoo import fields, api, models

import logging
_logger = logging.getLogger(__name__)


class stock_move(models.Model):
    _inherit = "stock.move"

    @api.model
    def create(self, vals):
        """
        if move create from pos order line
        and pol have uom ID and pol uom ID difference with current move
        we'll re-update product_uom of move
        FOR linked stock on hand of product
        """
        move = super(stock_move, self).create(vals)
        order_lines = self.env['pos.order.line'].search([
            ('name', '=', move.name),
            ('product_id', '=', move.product_id.id),
            ('qty', '=', move.product_uom_qty)
        ])
        for line in order_lines:
            if line.uom_id and line.uom_id != move.product_uom:
                move.write({
                    'product_uom': line.uom_id.id
                })
        self.sync_stock_to_pos_sessions(move.product_id.id)
        return move

    @api.multi
    def write(self, vals):
        parent = super(stock_move, self).write(vals)
        for move in self:
            self.sync_stock_to_pos_sessions(move.product_id.id)
        return parent

    @api.multi
    def unlink(self):
        product_ids = []
        for move in self:
            product_ids.append(move.product_id.id)
        parent = super(stock_move, self).unlink()
        for product_id in product_ids:
            self.sync_stock_to_pos_sessions(product_id)
        return parent

    @api.model
    def sync_stock_to_pos_sessions(self, product_id):
        sessions = self.env['pos.session'].sudo().search([
            ('state', '=', 'opened')
        ])
        for session in sessions:
            self.env['bus.bus'].sendmany(
                [[(self.env.cr.dbname, 'pos.sync.stock', session.user_id.id), [product_id]]])
        return True

