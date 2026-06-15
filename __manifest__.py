# -*- coding: utf-8 -*-
#############################################################################
#
#    HiddanProgrammer
#
#    You can modify it under the terms of the GNU LESSER
#    GENERAL PUBLIC LICENSE (LGPL v3), Version 3.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU LESSER GENERAL PUBLIC LICENSE (LGPL v3) for more details.
#
#    You should have received a copy of the GNU LESSER GENERAL PUBLIC LICENSE
#    (LGPL v3) along with this program.
#    If not, see <http://www.gnu.org/licenses/>.
#
#############################################################################
{
    'name': 'Gestión de Encuestas',
    'version': "18.0.1.6.1",
    'category': 'Industries',
    'author': 'HiddanProgrammer',
    'website': 'https://github.com/HidanProgramer/encuesta',
    'summary': 'Sistema Básico para gestionar encuestas',
    'depends': ['base', 'web'],
    'data': ['security/ir.model.access.csv',
             'views/view_clientes_encuesta.xml',
             'views/view_encuesta_vivienda_inherit.xml',
             'views/view_encuesta_servicio_inherit.xml',
             'views/view_encuesta_nucleo_inherit.xml',
             'views/view_encuesta_actividad_inherit.xml',
             'views/view_encuesta_aspectos_inherit.xml',
             'views/view_encuesta_criterios_inherit.xml',
             'views/view_dashboard.xml',
             'views/view_mapa_global.xml',
             'report/report_encuesta_actions.xml',
             'report/report_encuesta_templates.xml'],
    'assets': {
        'web.assets_backend': [
            # Librería del Dashboard
            'encuesta_root/static/src/libs/chart.umd.js',
            # Componente y vista Dashboard
            'encuesta_root/static/src/components/dashboard/dashboard.js',
            'encuesta_root/static/src/components/dashboard/dashboard.xml',
            # Librería del Mapa Global
            'encuesta_root/static/src/libs/leaflet/leaflet.css',
            'encuesta_root/static/src/libs/leaflet/leaflet.js',
            # Librería de los Plugins
            'encuesta_root/static/src/libs/leaflet/plugins/MarkerCluster.css',
            'encuesta_root/static/src/libs/leaflet/plugins/MarkerCluster.Default.css',
            'encuesta_root/static/src/libs/leaflet/plugins/leaflet.markercluster.js',
            'encuesta_root/static/src/libs/leaflet/plugins/leaflet-heat.js',
            # Componente Mapa Global
            'encuesta_root/static/src/components/mapa_global/mapa_global.js',
            'encuesta_root/static/src/components/mapa_global/mapa_global.xml',
            'encuesta_root/static/src/components/mapa_global/form_map_capture.js'
        ],
    },
    'images': ['static/description/banner.png'],
    'license': 'LGPL-3',
    'installable': True,
    'application': True,
}