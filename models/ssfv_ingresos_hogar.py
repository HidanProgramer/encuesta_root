from odoo import models, fields

class IngresosHogar(models.Model):
    _name = 'ssfv.ingresos.hogar'
    _description = 'Invoices'
    
    persona_id = fields.Many2one('clientes.encuesta', string='Encuesta')
    
    parentesco = fields.Selection([
        ('esposo', 'Esposo'),
        ('esposa', 'Esposa'),
        ('hijo', 'Hijo'),
        ('hija', 'Hija'),
        ('padre', 'Padre'),
        ('madre', 'Madre'),
        ('abuelo', 'Abuelo'),
        ('abuela', 'Abuela'),
        ('hombre', 'Hombre'),
        ('mujer', 'Mujer'),
        ('nieto', 'Nieto'),
        ('nieta', 'Nieta'),
        ('cliente','Cliente')
        ], string="Parentesco")
    
    edad = fields.Integer(string="Edad")
    
    procedencia = fields.Char(string="Procedencia")
    
    """@api.constrains('edad')
    def _check_edad(self):
        for rec in self:
            if rec.edad and (rec.edad < 0 or rec.edad > 120):
                raise ValidationError("Edad inválida")"""