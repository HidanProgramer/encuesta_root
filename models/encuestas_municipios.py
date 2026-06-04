from odoo import fields, models, api

class EncuestaMunicipios(models.Model):
    _name = "encuestas.municipios"
    _description = 'Municipio'
    _order = 'name'
    
    name = fields.Char(string="Municipio", required=True)
