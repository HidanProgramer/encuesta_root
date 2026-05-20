from odoo import models, fields, api

class Clientes(models.Model):
    _name = 'clientes.encuesta'
    _description = 'Clientes que se les realizó una encuesta'

    cliente = fields.Char(string='Cliente', required=True)
    ci = fields.Char(string='CI', required=True)
    municipio = fields.Char(string='Municipio', required=True)
    c_popular = fields.Char(string='Consejo Popular', required=True)
    comunidad = fields.Char(string='Comunidad', required=True)
    fecha_enc = fields.Date(string='Fecha de Encuesta', required=True)
    latitud = fields.Float(string='Latitud', default=0.0, digits=(10,7))
    longitud = fields.Float(string='Longitud', default=0.0, digits=(10,7))
    
    # Campos para coordenadas en DMS
    lat_deg = fields.Integer("⁰")
    lat_min = fields.Integer("'")
    lat_seg = fields.Float('"', digits=(10,2))
    
    lon_deg = fields.Integer("⁰")
    lon_min = fields.Integer("'")
    lon_seg = fields.Float('"', digits=(10,2))
    
    # ======================================
    # Pestaña Caracteristicas de la vivienda
    # ======================================
    
    tipo_vivienda = fields.Selection([
        ('hogar', 'Hogar'),
        ('finca', 'Finca')
    ], default='hogar', string='Tipo de Vivienda')
    tipo_finca = fields.Char(string='Actividad que realiza')
    material_madera = fields.Boolean(string="Madera")
    material_mamposteria= fields.Boolean(string="Mampostería")
    material_otro = fields.Boolean(string="Otro")
    otro_material = fields.Char()
    
    divisiones = fields.Boolean(default=False, string="Tiene Divisiones?")
    sala = fields.Boolean(string="Sala")
    comedor = fields.Boolean(string="Comedor")
    cocina = fields.Boolean(string="Cocina")
    cuartos = fields.Boolean(string="Cuartos")
    banos = fields.Boolean(string="Baños")
    condicion_vivienda = fields.Selection([
        ('buena', 'Buena'),
        ('aceptable', 'Aceptable'),
        ('deficiente', 'Deficiente')
    ], string="Condición de la Vivienda")
    
    # ======================================
    # Pestaña Aspectos Limitantes
    # ======================================
    prioridad = [(str(i), str(i)) for i in range(1,6)]
    limit_energia = fields.Selection(prioridad, string="Energía Eléctrica")
    limit_meteorologia = fields.Selection(prioridad, string="Condiciones Meteorológicas")
    limit_seguridad = fields.Selection(prioridad, string="Seguridad")
    limit_mano_obra = fields.Selection(prioridad, string="Falta de Mano de Obra")
    limit_otro_aspecto = fields.Char(string="Otro Aspecto")
    limit_otro_prioridad = fields.Selection(prioridad, string="Prioridad")
    aprovechamiento_energia = fields.Text(string="Cómo Aprovecharía la energía")
    emprende_negocio = fields.Selection([
        ('no', 'No'),('si', 'Si')
    ], string="Emprendería algún negocio")
    negocio_descripcion = fields.Char(string="Descripción del negocio")
    
    # ======================================
    # Pestaña Servicio Eléctrico
    # ======================================
    servicio_electrico = fields.Boolean(string="CUENTA CON SERVICIO ELÉCTRICO")
    luminarias = fields.Boolean(string="Luminarias")
    interruptores = fields.Boolean(string="Interruptores")
    funcionamiento = fields.Boolean(string="En Funcionamiento")
    sfva_300 = fields.Boolean(string="SFVA de 300 W")
    sfva_operativo = fields.Boolean(string="SFVA Operativo")
    servicio_ge = fields.Boolean(string="Servicio con Grupo Electrógeno")
    
    # ======================================
    # Pestaña Actividad Productiva
    # ======================================
    ingresos_ids = fields.One2many('ssfv.ingresos.hogar', "persona_id")
    genera_empleo = fields.Boolean(string="Genera Empleo")
    trabajadores_h = fields.Integer(string="Trabajadores H")
    trabajadores_m = fields.Integer(string="Trabajadores M")
    venta_local = fields.Boolean(string="Venta Local")
    entrega_cooperativa = fields.Boolean(string="Entrega Cooperativa")
    entrega_empresa = fields.Boolean(string="Entrega Empresa")
    autoconsumo = fields.Boolean(string="Autoconsumo")
    producto_ids = fields.One2many('ssfv.producto', 'actividad_id', string='Productos')
    
    # ======================================
    # Pestaña Criterios de Seleccion
    # ======================================
    criterio = [
        ('cumple', 'Cumple'),
        ('no_cumple', "No Cumple")
    ]
    criterio_mujer = fields.Selection(criterio, string="Condición SocioEconómica de la Mujer", required=True)
    criterio_beneficiario = fields.Selection(criterio, string="Número de Beneficiarios", required=True)
    criterio_seguridad = fields.Selection(criterio, string="Condiciones de Seguridad", required=True)
    criterio_disponibilidad = fields.Selection(criterio, string="Disponibilidad de Equipos", required=True)
    criterio_uso_productivo = fields.Selection(criterio, string="Uso productivo de la energía", required=True)
    observaciones_criterios = fields.Text(string="Observaciones Adicionales")  
    
    # ======================================
    # Pestaña Nucleo Familiar
    # ======================================  
    nucleo_familiar_ids = fields.One2many('ssfv.nucleo.familiar', 'miembro_fam_id')
    total_personas = fields.Integer(string="Total de Personas", compute="_compute_total_personas", strore=True)
    
    # ======================================
    # Campos para Compute Aprobado/Rechazado
    # ======================================
    estado_evaluacion =fields.Selection([
        ('aprobado','Aprobado'),
        ('rechazado','Rechazado')
    ], string="Estado", compute="_compute_evaluacion", store=True)
    
    sistema_recomendado = fields.Selection([
        ('1kw','Sistema 1 kW'),
        ('2kw','Sistema 2 kW'),
        ('rechazado','Rechazado')
    ], string="Sistema Recomendado", compute="_compute_evaluacion", store=True)
        
    observacion_automatica = fields.Text(string="Observación Automática", compute="_compute_evaluacion", store=True)
    
    tipo_servicio_energetico = fields.Selection([
        ('sfv','Sistema Fotovoltaico'),
        ('ge','Grupo Electrogeno'),
        ('no_service','Sin Servicio Eléctrico'),
        ('red','Red Eléctrica')
    ], string="Tipo de Servicio Eléctrico", compute="_compute_tipo_servicio", store=True)
    
    # ======================
    # APIS
    # ======================
    @api.onchange('lat_deg', 'lat_min', 'lat_seg')
    def _onchange_dms_to_decimal_lat(self):
        for reg in self:
            reg.latitud = reg.lat_deg + (reg.lat_min / 60) + (reg.lat_seg / 3600.0)
    
    @api.onchange('lon_deg', 'lon_min', 'lon_seg')
    def _onchange_dms_to_decimal_lon(self):
        for reg in self:
            reg.longitud = reg.lon_deg + (reg.lon_min / 60) + (reg.lon_seg / 3600.0)
    
    @api.onchange('tipo_vivienda')
    def _onchange_tipo_vivienda(self):
        if self.tipo_vivienda != 'finca':
            self.tipo_finca = False
    
    @api.onchange('divisiones')
    def _onchange_divisiones(self):
        if not self.divisiones:
            self.sala = False
            self.comedor = False
            self.cocina = False
            self.cuartos = False
            self.banos = False
    
    @api.onchange('servicio_electrico')
    def _onchange_servicio_electrico(self):
        if not self.servicio_electrico:
            self.luminarias = False
            self.interruptores = False
            self.funcionamiento = False
            self.sfva_300 = False
            self.sfva_operativo = False
            self.servicio_ge = False
    
    @api.onchange('emprende_negocio')
    def _onchange_emprende_negocio(self):
        if self.emprende_negocio != 'si':
            self.negocio_descripcion = False
    
    @api.onchange('genera_empleo')
    def _onchange_genera_empleo(self):
        if not self.genera_empleo:
            self.trabajadores_h = 0
            self.trabajadores_m = 0
    
    @api.depends('nucleo_familiar_ids')
    def _compute_total_personas(self):
        for rec in self:
            rec.total_personas = len(rec.nucleo_familiar_ids)
    
    @api.depends('criterio_mujer', 'criterio_seguridad', 'criterio_uso_productivo')
    def _compute_evaluacion(self):
        for rec in self:
            # Inicializar el estado, el sistema recomendado y la observacion automatica
            rec.estado_evaluacion = 'rechazado'
            rec.sistema_recomendado = 'rechazado'
            rec.observacion_automatica = ''
            
            motivos = []
            
            # Criterios Obligatorios
            if rec.criterio_mujer != 'cumple':
                motivos.append('No cumple: criterio Condicion Socioeconómica de la Mujer')
            if rec.criterio_seguridad != 'cumple':
                motivos.append('No cumple: criterio de Seguridad')
            if motivos:
                rec.estado_evaluacion = 'rechazado'
                rec.observacion_automatica = " | ".join(motivos)
                continue
            
            rec.estado_evaluacion = 'aprobado'
            
            if rec.criterio_uso_productivo == 'cumple':
                rec.sistema_recomendado = '2kw'
                motivos.append("Recomendación: Sistema de 2 kW para Productor")
            else:
                rec.sistema_recomendado = '1kw'
                motivos.append("Recomendación: Sistema de 1 kW por posibilidades de adquisición")
            rec.observacion_automatica = " | ".join(motivos)
            
    
    def action_recalcular(self):
        self._compute_evaluacion()
    
    @api.depends('servicio_ge', 'sfva_300', 'servicio_electrico')
    def _compute_tipo_servicio(self):
        for rec in self:
            if not rec.servicio_electrico:
                rec.tipo_servicio_energetico = 'no_service'
            elif rec.sfva_300:
                rec.tipo_servicio_energetico = 'sfv'
            elif rec.servicio_ge:
                rec.tipo_servicio_energetico = 'ge'
            else:
                rec.tipo_servicio_energetico = 'red'
    
    @api.model
    def get_dashboard_stats(self):
        """
        Retorna las métricas agregadas para las KPI cards y la data formateada para los 4 gráficos de forma eficiente.
        """
        # KPI CARDS
        # 1. Total de encuestas
        total_encuestas = self.search_count([])
        
        # 2. Total de aprobados
        total_aprobados = self.search_count([('estado_evaluacion', '=', 'aprobado')])
        
        # 3. Total Sistema 1 kW
        total_1kw = self.search_count([('sistema_recomendado', '=', '1kw')])
        
        # 4. Total Sistema 2 kW
        total_2kw = self.search_count([('sistema_recomendado', '=', '2kw')])

                # --- 2. Data para Gráficos utilizando agrupaciones eficientes ---
        
        # Gráfico 1: Tipo de Sistema (1kw vs 2kw)
        # Filtramos para excluir los rechazados en este gráfico si se desea ver solo lo asignado
        sistemas_data = self.read_group(
            [('sistema_recomendado', 'in', ['1kw', '2kw'])], 
            ['sistema_recomendado'], 
            ['sistema_recommended' if 'sistema_recommended' in self._fields else 'sistema_recomendado']
        )
        sistemas_labels = []
        sistemas_values = []
        for line in sistemas_data:
            label = 'Sistema 1 kW' if line.get('sistema_recomendado') == '1kw' else 'Sistema 2 kW'
            sistemas_labels.append(label)
            sistemas_values.append(line.get('sistema_recomendado_count', 0))

        # Gráfico 2: Tipo de Electrificación (Grupo Electrógeno, SFV, Sin servicio, Red)
        electrificacion_data = self.read_group([], ['tipo_servicio_energetico'], ['tipo_servicio_energetico'])
        elec_mapping = {
            'no_service': 'Sin Servicio Eléctrico',
            'sfv': 'Sistema Fotovoltaico',
            'ge': 'Grupo Electrógeno',
            'red': 'Red Eléctrica'
        }
        elec_labels = []
        elec_values = []
        for line in electrificacion_data:
            key = line.get('tipo_servicio_energetico')
            if key:
                elec_labels.append(elec_mapping.get(key, key))
                elec_values.append(line.get('tipo_servicio_energetico_count', 0))

        # Gráfico 3: Cantidad de Sistemas por Municipios (Barras Apiladas/Agrupadas)
        municipios_data = self.read_group(
            [('sistema_recomendado', 'in', ['1kw', '2kw'])],
            ['municipio', 'sistema_recomendado'],
            ['municipio', 'sistema_recomendado'],
            lazy=False
        )
        
        # Procesar estructura para gráfico de barras agrupadas por municipio
        municipios_set = sorted(list(set(line.get('municipio') for line in municipios_data if line.get('municipio'))))
        m_1kw = {m: 0 for m in municipios_set}
        m_2kw = {m: 0 for m in municipios_set}
        for line in municipios_data:
            m = line.get('municipio')
            if m:
                if line.get('sistema_recomendado') == '1kw':
                    m_1kw[m] = line.get('__count', 0)
                elif line.get('sistema_recomendado') == '2kw':
                    m_2kw[m] = line.get('__count', 0)

        # Gráfico 4: Estado de Evaluación (Aprobados 1kw, Aprobados 2kw, Rechazados)
        evaluacion_data = self.read_group([], ['sistema_recomendado'], ['sistema_recommended' if 'sistema_recommended' in self._fields else 'sistema_recommended'])
        eval_labels = ['Aprobados 1 kW', 'Aprobados 2 kW', 'Rechazados']
        eval_values = [0, 0, 0]
        for line in evaluacion_data:
            sys_type = line.get('sistema_recomendado')
            count = line.get('sistema_recomendado_count', 0)
            if sys_type == '1kw':
                eval_values[0] = count
            elif sys_type == '2kw':
                eval_values[1] = count
            elif sys_type == 'rechazado':
                eval_values[2] = count

        return {
            'cards': {
                'total_encuestas': total_encuestas,
                'total_aprobados': total_aprobados,
                'total_1kw': total_1kw,
                'total_2kw': total_2kw,
            },
            'charts': {
                'sistemas': {'labels': list(sistemas_labels), 'values': list(sistemas_values)},
                'electrificacion': {'labels': list(elec_labels), 'values': list(elec_values)},
                'municipios': {
                    'labels': municipios_set,
                    'dataset_1kw': [m_1kw[m] for m in municipios_set],
                    'dataset_2kw': [m_2kw[m] for m in municipios_set]
                },
                'evaluacion': {'labels': eval_labels, 'values': eval_values}
            }
        }


            