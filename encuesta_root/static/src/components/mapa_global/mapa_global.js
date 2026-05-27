/** @odoo-module */
import { registry } from "@web/core/registry";
import { Component, onMounted, useRef, useState } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

export class MapaGlobalEncuestas extends Component {
    static template = "encuesta_root.MapaGlobalTemplate";

    setup() {
        this.mapRef = useRef("mapContainer");
        this.orm = useService("orm");
        this.actionService = useService("action");
        
        this.state = useState({ 
            encuestas: [],
            searchTerm: "" 
        });
        
        this.map = null;
        this.markers = {}; 

        onMounted(async () => {
            await this.initMap();
        });
    }

    // 1. GETTER BLINDADO: Evita caídas por campos vacíos (undefined / false)
    get filteredEncuestas() {
        // Limpiamos el término de búsqueda de forma segura
        const term = (this.state.searchTerm || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
        
        if (!term) {
            return this.state.encuestas || [];
        }

        // Función interna ultra-segura para procesar textos sin romper el flujo
        const cleanText = (val) => {
            if (!val) return ""; // Si es false, null o undefined, devolvemos texto vacío
            return String(val)
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");
        };

        return (this.state.encuestas || []).filter(encuesta => {
            // Evaluamos cada campo convirtiéndolo primero a texto seguro
            const matchCliente = cleanText(encuesta.cliente).includes(term);
            const matchMunicipio = cleanText(encuesta.municipio).includes(term);
            const matchSistema = cleanText(encuesta.sistema_recommended_label).includes(term);

            return matchCliente || matchMunicipio || matchSistema;
        });
    }

    async initMap() {
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: '/encuesta_root/static/src/libs/leaflet/images/marker-icon-2x.png',
            iconUrl: '/encuesta_root/static/src/libs/leaflet/images/marker-icon.png',
            shadowUrl: '/encuesta_root/static/src/libs/leaflet/images/marker-shadow.png',
        });

        // Consensuamos los campos pedidos al ORM
        const encuestas = await this.orm.searchRead(
            "clientes.encuesta",
            [],
            ["id", "cliente", "latitud", "longitud", "municipio", "sistema_recomendado"]
        );

        // =========================================================================
        // DICCIONARIO CON LAS CLAVES EXACTAS DE TU PYTHON
        // =========================================================================
        const sistemasDiccionario = {
            '1kw': 'Sistema 1 kW',
            '2kw': 'Sistema 2 kW',
            'rechazado': 'Rechazado'
        };

        // Procesamos los datos mapeando los resultados antes de guardarlos en el estado
        this.state.encuestas = encuestas.map(encuesta => {
            
            // Tratamiento seguro de Municipio (por si viene como Many2one o Texto)
            let nombreMunicipio = "";
            if (Array.isArray(encuesta.municipio)) {
                nombreMunicipio = encuesta.municipio[1]; 
            } else if (encuesta.municipio) {
                nombreMunicipio = encuesta.municipio;
            }

            // Tratamiento del Selection técnico
            const claveTecnica = encuesta.sistema_recomendado;
            
            // Si la clave existe en el diccionario, extrae su etiqueta; si no, muestra la clave
            const etiquetaLegible = sistemasDiccionario[claveTecnica] || claveTecnica || "No definido";

            return {
                ...encuesta,
                cliente: encuesta.cliente || "Sin Nombre",
                municipio: nombreMunicipio || "No definido",
                sistema_recommended_label: etiquetaLegible // Guardamos el texto final listo para pintar y filtrar
            };
        });

        // Inicialización del Mapa
        this.map = L.map(this.mapRef.el).setView([20.8872, -76.2631], 9);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Dibujar Marcadores
        this.state.encuestas.forEach(encuesta => {
            if (encuesta.latitud && encuesta.longitud) {
                const marker = L.marker([encuesta.latitud, encuesta.longitud]).addTo(this.map);
                this.markers[encuesta.id] = marker;

                // Modificamos el contenido del popup para que consuma la etiqueta ya traducida
                const popupContent = `
                    <div style="font-family: sans-serif; padding: 5px;">
                        <h6 style="margin: 0 0 5px 0; color: #0d2b52;">${encuesta.cliente}</h6>
                        <p style="margin: 0 0 3px 0; font-size: 12px;"><strong>Municipio:</strong> ${encuesta.municipio}</p>
                        <p style="margin: 0 0 8px 0; font-size: 12px;"><strong>Sistema:</strong> ${encuesta.sistema_recommended_label}</p>
                        <button class="btn btn-primary btn-sm w-100 open-encuesta-btn" data-id="${encuesta.id}" style="font-size: 11px; padding: 3px 8px;">
                            Ver Formulario
                        </button>
                    </div>
                `;
                marker.bindPopup(popupContent);

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

    seleccionarCliente(encuesta) {
        const marker = this.markers[encuesta.id];
        if (!marker) return;

        Object.values(this.markers).forEach(m => {
            if (m._icon) m._icon.style.filter = "";
        });

        if (marker._icon) {
            marker._icon.style.filter = "hue-rotate(140deg) saturate(250%) brightness(90%)";
        }

        this.map.flyTo([encuesta.latitud, encuesta.longitud], 14, {
            animate: true,
            duration: 1.5
        });

        marker.openPopup();
    }
}

registry.category("actions").add("action_mapa_global_encuestas", MapaGlobalEncuestas);