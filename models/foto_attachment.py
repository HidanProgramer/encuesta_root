from odoo import models, fields

class IrAttachmentFoto(models.Model):
    _inherit = 'ir.attachment'

    tipo_foto = fields.Selection([
        ('vivienda', 'Fotografía de Vivienda'),
        ('equipo',   'Fotografía de Equipos'),
        ('croquis',  'Croquis'),
    ], string="Tipo de Fotografía")