# -*- coding: utf-8 -*-
from odoo import api, fields, models, _
import logging
from odoo.exceptions import UserError

_logger = logging.getLogger(__name__)

class pos_sale_extra(models.Model):

    _name = "pos.sale.extra"
    _description = "Sale extra items base on core product"

    product_tmpl_id = fields.Many2one('product.template', 'Base Product', required=1, domain=[('available_in_pos', '=', True)])
    product_id = fields.Many2one('product.product', 'Product extra', required=1, domain=[('available_in_pos', '=', True)])
    quantity = fields.Float('Default Qty', default=1, required=1)
    list_price = fields.Float('List Price', required=1)

class product_template(models.Model):
    _inherit = 'product.template'

    pos_combo_item_ids = fields.One2many('pos.combo.item', 'product_combo_id', string='Combo items')
    is_combo = fields.Boolean('Is combo')
    combo_limit = fields.Integer('Combo item limit', help='Limit combo items can allow cashier add / combo')
    is_credit = fields.Boolean('Is credit', default=False)
    multi_category = fields.Boolean('Multi category')
    pos_categ_ids = fields.Many2many('pos.category', string='POS multi category')
    multi_uom = fields.Boolean('Multi unit of measure')
    price_uom_ids = fields.One2many('product.uom.price', 'product_tmpl_id', string='Units of measure')
    multi_variant = fields.Boolean('Product Multi variant')
    pos_variant_ids = fields.One2many('product.variant', 'product_tmpl_id', string='Product variants')
    cross_selling = fields.Boolean('Cross selling')
    cross_ids = fields.One2many('product.cross', 'product_tmpl_id', 'Cross selling items')
    supplier_barcode = fields.Char(
        'Supplier Barcode', copy=False,
        help="Barcode of product from supplier.")
    barcode_ids = fields.One2many('product.barcode', 'product_tmpl_id', string='Barcodes')
    manufacturing_out_of_stock = fields.Boolean('Auto manufacturing',
                                                help='Auto create Manufacturing Order when qty on hand of product smaller than minimum quantity config')
    manufacturing_state = fields.Selection([
        ('manual', 'Manual'),
        ('auto', 'Auto Process')], string='Manufacturing State', default='auto')
    pos_min_qty = fields.Float('Minimum quantity POS', help='This is Minimum quantity made to manufacturing order')
    pos_manufacturing_quantity = fields.Float('Manufacturing quantity', help='This is quantity will manufacturing', default=10)
    bom_id = fields.Many2one('mrp.bom', string='Bill of material')
    suggestion_sale = fields.Boolean('Suggestion sale')
    suggestion_ids = fields.One2many('product.suggestion', 'product_tmpl_id', 'Suggests sale')
    pack_ids = fields.One2many('product.quantity.pack', 'product_tmpl_id', 'Quantities Pack')
    pos_sequence = fields.Integer('POS sequence')
    bus_ids = fields.Many2many('pos.bus', string='Location branch')
    is_voucher = fields.Boolean('Is voucher', default=0)
    sale_extra = fields.Boolean(compute='_get_sale_extra', string='Sale extra')
    sale_extra_item_ids = fields.One2many('pos.sale.extra', 'product_tmpl_id', 'Sale extra')
    minimum_list_price = fields.Float('Min sale price', default=0)

    @api.multi
    def _get_sale_extra(self):
        for product in self:
            if product.sale_extra_item_ids and len(product.sale_extra_item_ids) >= 1:
                product.sale_extra = True
            else:
                product.sale_extra = False

    @api.multi
    def write(self, vals):
        res = super(product_template, self).write(vals)
        if vals.get('manufacturing_out_of_stock', False) and not vals.get('bom_id', False):
            raise UserError(_('Please add Bill Of material'))
        if vals.get('manufacturing_out_of_stock', False) and vals.get('pos_manufacturing_quantity', 0) <= 0:
            raise UserError(_('Manufacturing quantity could not smaller than 0'))
        if vals.get('bom_id', False):
            for template in self:
                bom = self.env['mrp.bom'].browse(vals.get('bom_id'))
                if bom.product_tmpl_id.id != template.id:
                    raise UserError(_('Bom wrong, please select bom of this product'))
        for product_temp in self:
            products = self.env['product.product'].search([('product_tmpl_id', '=', product_temp.id)])
            for product in products:
                if product.sale_ok and product.available_in_pos:
                    product.sync()
        return res


    @api.model
    def create(self, vals):
        template = super(product_template, self).create(vals)
        if vals.get('bom_id', False):
            bom = self.env['mrp.bom'].browse(vals.get('bom_id'))
            if bom.product_tmpl_id.id != template.id:
                raise UserError(_('Bom wrong, please select bom of this product'))
        return template

    @api.multi
    def unlink(self):
        for product_temp in self:
            products = self.env['product.product'].search([('product_tmpl_id', '=', product_temp.id)])
            for product in products:
                data = product.get_data()
                self.env['pos.cache.database'].remove_record(data)
        return super(product_template, self).unlink()


class product_product(models.Model):
    _inherit = 'product.product'

    @api.multi
    def write(self, vals):
        res = super(product_product, self).write(vals)
        for product in self:
            if product and product.id != None and product.sale_ok and product.available_in_pos and product.active:
                product.sync()
            if product.available_in_pos == False or product.active == False:
                data = product.get_data()
                self.env['pos.cache.database'].remove_record(data)
        return res

    def get_data(self):
        cache_obj = self.env['pos.cache.database']
        fields_sale_load = cache_obj.get_fields_by_model(self._inherit)
        data = self.read(fields_sale_load)[0]
        data['model'] = self._inherit
        return data

    @api.model
    def sync(self):
        data = self.get_data()
        self.env['pos.cache.database'].sync_to_pos(data)
        return True

    @api.model
    def create(self, vals):
        product = super(product_product, self).create(vals)
        if product.sale_ok and product.available_in_pos:
            product.sync()
        return product

    @api.multi
    def unlink(self):
        for product in self:
            data = product.get_data()
            self.env['pos.cache.database'].remove_record(data)
        return super(product_product, self).unlink()
