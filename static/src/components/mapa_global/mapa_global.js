/** @odoo-module */

import { registry } from "@web/core/registry";
import { Component, onMounted, useRef } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

export class MapaGlobalEncuestas extends Component {
    static template = "encuesta_root.MapaGlobalTemplate";

    setup() {
        this.mapRef = useRef("mapContainer");
        this.orm = useService("orm"); 
        this.actionService = useService("action");

        onMounted(async () => {
            await this.initMap();
        });
    }

    async initMap() {
        // Blindaje de rutas para los marcadores de Leaflet en Odoo
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: '/encuesta_root/static/src/libs/leaflet/images/marker-icon-2x.png',
            iconUrl: '/encuesta_root/static/src/libs/leaflet/images/marker-icon.png',
            shadowUrl: '/encuesta_root/static/src/libs/leaflet/images/marker-shadow.png',
        });

        // 1. Consultar los datos usando el ORM nativo de Odoo 18
        const encuestas = await this.orm.searchRead(
            "clientes.encuesta", // Modelo técnico
            [],                  // Dominio (vacío para traer todos los registros)
            ["id", "cliente", "latitud", "longitud", "municipio", "sistema_recomendado"] // Campos a leer
        );

        // 2. Inicializar el mapa de Leaflet centrado en la provincia
        const map = L.map(this.mapRef.el).setView([20.8872, -76.2631], 9);

        // 3. Cargar las capas de OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // 4. Recorrer las encuestas traídas por el ORM y pintar los pines
        encuestas.forEach(encuesta => {
            if (encuesta.latitud && encuesta.longitud) {
                const marker = L.marker([encuesta.latitud, encuesta.longitud]).addTo(map);

                // Diseño del globo flotante (Popup)
                const popupContent = `
                    <div style="font-family: sans-serif; padding: 5px;">
                        <h6 style="margin: 0 0 5px 0; color: #0d2b52;">${encuesta.name}</h6>
                        <p style="margin: 0 0 3px 0; font-size: 12px;"><strong>Municipio:</strong> ${encuesta.municipio || 'No definido'}</p>
                        <p style="margin: 0 0 8px 0; font-size: 12px;"><strong>Sistema:</strong> ${encuesta.sistema_recomendado || 'No definido'}</p>
                        <button class="btn btn-primary btn-sm w-100 open-encuesta-btn" data-id="${encuesta.id}" style="font-size: 11px; padding: 3px 8px;">
                            Ver Formulario
                        </button>
                    </div>
                `;
                marker.bindPopup(popupContent);

                // Evento para capturar el clic en el botón del Popup
                marker.on('popupopen', () => {
                    const btn = document.querySelector(`.open-encuesta-btn[data-id="${encuesta.id}"]`);
                    if (btn) {
                        btn.addEventListener('click', () => {
                            // Acción nativa para ir al Form View del registro
                            this.actionService.doAction({
                                type: 'ir.actions.act_window',
                                res_model: 'clientes.encuesta',
                                res_id: encuesta.id,
                                views: [[false, 'form']],
                                target: 'current',
                            });
                        });
                    }
                });
            }
        });
    }
}

// Registrar la acción de cliente
registry.category("actions").add("action_mapa_global_encuestas", MapaGlobalEncuestas);