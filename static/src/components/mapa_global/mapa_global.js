/** @odoo-module */
import { registry } from "@web/core/registry";
import { Component, onMounted, useRef, useState } from "@odoo/owl"; // Importamos useState
import { useService } from "@web/core/utils/hooks";

export class MapaGlobalEncuestas extends Component {
    static template = "encuesta_root.MapaGlobalTemplate";

    setup() {
        this.mapRef = useRef("mapContainer");
        this.orm = useService("orm");
        this.actionService = useService("action");
        
        // 1. Estado reactivo para la barra lateral
        this.state = useState({ encuestas: [] });
        
        // 2. Variables de control para Leaflet
        this.map = null;
        this.markers = {}; 

        onMounted(async () => {
            await this.initMap();
        });
    }

    async initMap() {
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: '/encuesta_root/static/src/libs/leaflet/images/marker-icon-2x.png',
            iconUrl: '/encuesta_root/static/src/libs/leaflet/images/marker-icon.png',
            shadowUrl: '/encuesta_root/static/src/libs/leaflet/images/marker-shadow.png',
        });

        // Consultar los datos usando el ORM
        const encuestas = await this.orm.searchRead(
            "clientes.encuesta",
            [],
            ["id", "cliente", "latitud", "longitud", "municipio", "sistema_recomendado"]
        );

        // Guardamos en el estado para que se renderice el Tree View izquierdo automáticamente
        this.state.encuestas = encuestas;

        // Inicializar el mapa asignándolo a la propiedad de la clase (this.map)
        this.map = L.map(this.mapRef.el).setView([20.8872, -76.2631], 9);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Recorrer y pintar los pines
        encuestas.forEach(encuesta => {
            if (encuesta.latitud && encuesta.longitud) {
                const marker = L.marker([encuesta.latitud, encuesta.longitud]).addTo(this.map);
                
                // GUARDAR REFERENCIA: Indexamos el marcador por el ID de la encuesta
                this.markers[encuesta.id] = marker;

                // Contenido del popup (usando cliente en vez de name)
                const popupContent = `
                    <div style="font-family: sans-serif; padding: 5px;">
                        <h6 style="margin: 0 0 5px 0; color: #0d2b52;">${encuesta.cliente}</h6>
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

    // 3. NUEVA FUNCIÓN: Se ejecuta al hacer clic en un cliente de la lista izquierda
    seleccionarCliente(encuesta) {
        const marker = this.markers[encuesta.id];
        if (!marker) return;

        // Resetear todos los pines a su color azul original (removiendo filtros CSS)
        Object.values(this.markers).forEach(m => {
            if (m._icon) m._icon.style.filter = "";
        });

        // Pintar ESTE pin específico de rojo usando filtros en el elemento HTML
        if (marker._icon) {
            // hue-rotate(140deg) rota el azul estándar hacia un tono rojo/rojo vivo
            marker._icon.style.filter = "hue-rotate(140deg) saturate(250%) brightness(90%)";
        }

        // Desplazar el mapa suavemente (flyTo) hacia las coordenadas con un zoom más cercano (ej. 14)
        this.map.flyTo([encuesta.latitud, encuesta.longitud], 14, {
            animate: true,
            duration: 1.5 // Duración de la animación en segundos
        });

        // Abrir el popup del marcador automáticamente
        marker.openPopup();
    }
}

registry.category("actions").add("action_mapa_global_encuestas", MapaGlobalEncuestas);