from odoo import fields, models

class EncuestaConsejoPopular(models.Model):
    _name = 'encuestas.consejo_popular'
    _descritption = 'Consejo Popular'
    _order = 'name'
    
    name = fields.Char(string="Consejo Popular", required=True)
    municipio_id = fields.Many2one('encuestas.municipios', string="Municipio", required=True, ondelete='cascade')