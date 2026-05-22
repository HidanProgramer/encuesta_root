{
    'name': 'Gestión de Encuestas',
    'version': "18.0.1.1.0",
    'category': 'Industries',
    'author': 'HiddanProgrammer',
    'website': 'https://github.com/HidanProgramer/encuesta',
    'summary': 'Sistema Básico para gestionar encuestas',
    'depends': ['base', 'web'],
    'data': ['security/ir.model.access.csv',
             'views/graph_views.xml',
             'views/view_clientes_encuesta.xml',
             'views/view_encuesta_vivienda_inherit.xml',
             'views/view_encuesta_servicio_inherit.xml',
             'views/view_encuesta_nucleo_inherit.xml',
             'views/view_encuesta_actividad_inherit.xml',
             'views/view_encuesta_aspectos_inherit.xml',
             'views/view_encuesta_criterios_inherit.xml',
             'views/view_dashboard.xml',
             'views/view_mapa_global.xml'],
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
            # Componente Mapa Global
            'encuesta_root/static/src/components/mapa_global/mapa_global.js',
            'encuesta_root/static/src/components/mapa_global/mapa_global.xml',
        ],
    },
    'images': ['static/description/banner.jpg'],
    'license': 'LGPL-3',
    'installable': True,
    'application': True,
}