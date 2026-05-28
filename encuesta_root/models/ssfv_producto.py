from odoo import models, fields

class Producto(models.Model):
    _name = 'ssfv.producto'
    _description = "Producto"
    
    actividad_id = fields.Many2one('clientes.encuesta', string='Encuesta Relacionada')
    nombre = fields.Char(string="Producto")
    plan_anual = fields.Float(string="Plan Anual")
    unidad_medida = fields.Char(string="Unidad")