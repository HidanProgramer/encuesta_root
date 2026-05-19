from odoo import models, fields
#from odoo.exceptions import ValidationError

class NucleoFamiliar(models.Model):
    _name = "ssfv.nucleo.familiar"
    _description = "Miembro del Grupo Familiar"
    
    miembro_fam_id = fields.Many2one('clientes.encuesta', ondelete='cascade')
    
    sexo_nucleo = fields.Selection([
        ('f', 'Femenino'),
        ('m', 'Masculino')
    ], string="Sexo")
    
    edad_nucleo = fields.Integer(string="Edad")
    
    grupo_nucleo = fields.Selection([
        ('menor','Menor'),
        ('adulto','Adulto'),
        ('mayor','Adulto Mayor')
    ], string="Grupo") 
    
    escolaridad = fields.Selection([
        ('sexto','Sexto Grado'),
        ('noveno','Noveno Grado'),
        ('duodecimo','Duodécimo Grado'),
        ('universitario','Universitario')
    ], string="Escolaridad")
    
    """@api.constrains('edad_nucleo', 'grupo_nucleo')
    def _check_grupo_edad(self):
        for rec in self:
            if rec.grupo_nucleo == 'menor' and rec.edad_nucleo >= 18:
                raise ValidationError("Un menor no puede tener 18 años de edad.")"""