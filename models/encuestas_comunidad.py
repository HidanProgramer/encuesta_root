from odoo import fields, models

class EncuestasComunidad(models.Model):
    _name = 'encuestas.comunidad'
    _description = 'Comunidad'
    _order = 'name'
    
    name = fields.Char(string="Comunidad", required=True)
    consejo_popular_id = fields.Many2one('encuestas.consejo_popular', string="Consejo Popular", required=True, ondelete='cascade')
    municipio_id = fields.Many2one('encuestas.municipio', string="Municipio", related='consejo_popular_id.municipio_id', store=True)
    