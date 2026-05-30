/** @odoo-module */
import { registry } from "@web/core/registry";
import { Component, onMounted, useRef, useState, useEffect } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

export class MapaGlobalEncuestas extends Component {
    static template = "encuesta_root.MapaGlobalTemplate";

    setup() {
        this.mapRef = useRef("mapContainer");
        this.orm = useService("orm");
        this.actionService = useService("action");
        
        // Estado Reactivo unificado
        this.state = useState({ 
            encuestas: [],
            searchTerm: "",
            currentMode: "markers" // 'markers' (con Clúster) o 'heatmap'
        });
        
        this.map = null;
        this.markers = {};            // Referencia de marcadores individuales para el "flyTo"
        this.clusterGroup = null;     // Capa contenedora del Cluster
        this.heatmapLayer = null;     // Capa contenedora del Heatmap

        onMounted(async () => {
            await this.initMap();
        });

        // 🔄 EFECTO REACTIVO: Redibuja el contenido del mapa automáticamente
        // si cambia el término de búsqueda o si se cambia el modo (Pines / Calor).
        useEffect(() => {
            if (this.map) {
                this.renderLayers();
            }
        }, () => [this.filteredEncuestas, this.state.currentMode]);
    }

    // Filtro inteligente y seguro tolerante a acentos
    get filteredEncuestas() {
        const term = (this.state.searchTerm || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
        
        if (!term) return this.state.encuestas || [];

        const cleanText = (val) => {
            if (!val) return "";
            return String(val).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        };

        return (this.state.encuestas || []).filter(encuesta => {
            return cleanText(encuesta.cliente).includes(term) ||
                   cleanText(encuesta.municipio).includes(term) ||
                   cleanText(encuesta.sistema_recomendado).includes(term);
        });
    }

    async initMap() {
        // Solución nativa de rutas para iconos locales de Leaflet
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: '/encuesta_root/static/src/libs/leaflet/images/marker-icon-2x.png',
            iconUrl: '/encuesta_root/static/src/libs/leaflet/images/marker-icon.png',
            shadowUrl: '/encuesta_root/static/src/libs/leaflet/images/marker-shadow.png',
        });

        // Inicializar el lienzo del mapa centrado en Holguín
        this.map = L.map(this.mapRef.el).setView([20.8872, -76.2631], 9);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(this.map);

        // Traer datos mediante el ORM de Odoo
        const encuestas = await this.orm.searchRead(
            "clientes.encuesta",
            [],
            ["id", "cliente", "latitud", "longitud", "municipio", "sistema_recomendado"]
        );

        const sistemasDiccionario = {
            '1kw': 'Sistema 1 kW',
            '2kw': 'Sistema 2 kW',
            'rechazado': 'Rechazado'
        };

        // Homologar y limpiar datos
        this.state.encuestas = encuestas.map(encuesta => {
            let nombreMunicipio = "";
            if (Array.isArray(encuesta.municipio)) nombreMunicipio = encuesta.municipio[1];
            else if (encuesta.municipio) nombreMunicipio = encuesta.municipio;

            const etiqueta = sistemasDiccionario[encuesta.sistema_recomendado] || encuesta.sistema_recomendado || "No definido";

            return {
                ...encuesta,
                cliente: encuesta.cliente || "Sin Nombre",
                municipio: nombreMunicipio || "No definido",
                sistema_recomendado: etiqueta
            };
        });

        // Forzar el primer renderizado manual una vez cargados los datos de Odoo
        this.renderLayers();
    }

    // 🎛️ CONTROLADOR CENTRAL DE CAPAS (Limpia y redibuja de forma segura)
    renderLayers() {
        // 1. Limpieza total de capas previas si existen en el mapa
        if (this.clusterGroup) this.map.removeLayer(this.clusterGroup);
        if (this.heatmapLayer) this.map.removeLayer(this.heatmapLayer);
        
        this.markers = {}; // Resetear referencias de pines

        // 2. Enrutar según el modo activo actual en la UI
        if (this.state.currentMode === 'markers') {
            this.drawClusterMode();
        } else if (this.state.currentMode === 'heatmap') {
            this.drawHeatmapMode();
        }
    }

    // 📍 MODO 1: AGRUPAMIENTO (MARKER CLUSTERING)
    drawClusterMode() {
        // Inicializamos el grupo nativo del plugin de Clúster
        this.clusterGroup = L.markerClusterGroup({
            showCoverageOnHover: false, // Quita la línea de contorno al pasar el mouse
            maxClusterRadius: 40        // Tamaño en píxeles de la zona de agrupamiento (ajustable)
        });

        this.filteredEncuestas.forEach(encuesta => {
            if (encuesta.latitud && encuesta.longitud) {
                const marker = L.marker([encuesta.latitud, encuesta.longitud]);
                
                // Guardamos referencia individual para interactuar desde la barra lateral
                this.markers[encuesta.id] = marker;

                // Contenido estético del Popup
                const popupContent = `
                    <div style="font-family: sans-serif; padding: 3px; min-width: 150px;">
                        <h6 style="margin: 0 0 6px 0; color: #0d2b52; font-weight: bold;">${encuesta.cliente}</h6>
                        <p style="margin: 0 0 4px 0; font-size: 12px; color: #555;"><strong>Muncipio:</strong> ${encuesta.municipio}</p>
                        <p style="margin: 0 0 8px 0; font-size: 12px; color: #555;"><strong>Recomendación:</strong> ${encuesta.sistema_recomndado || encuesta.sistema_recomendado}</p>
                        <button class="btn btn-primary btn-sm w-100 open-encuesta-btn-popup" data-id="${encuesta.id}" style="font-size: 11px; padding: 2px 5px;">
                            <i class="fa fa-folder-open"></i> Ver Detalles
                        </button>
                    </div>
                `;
                marker.bindPopup(popupContent);

                // Evento para abrir el formulario real de Odoo 18
                marker.on('popupopen', () => {
                    const btn = document.querySelector(`.open-encuesta-btn-popup[data-id="${encuesta.id}"]`);
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

                // Agregamos el pin al contenedor Clúster (no directamente al mapa)
                this.clusterGroup.addLayer(marker);
            }
        });

        // Finalmente, añadimos todo el grupo de clústers de un solo golpe al mapa
        this.map.addLayer(this.clusterGroup);
    }

    // 🔥 MODO 2: MAPA DE CALOR (HEATMAP)
    drawHeatmapMode() {
        // Estructuramos la matriz que requiere el plugin: [[lat, lng, intensidad], ...]
        const heatPoints = [];

        this.filteredEncuestas.forEach(encuesta => {
            if (encuesta.latitud && encuesta.longitud) {
                // Seteamos la intensidad base según el tipo de sistema (para dar peso en el mapa)
                let intensidad = 0.5; 
                if (encuesta.sistema_recomendado.includes("2 kW")) intensidad = 1.0; // Más potencia = Más calor
                if (encuesta.sistema_recommended === "rechazado") intensidad = 0.1; // Menos peso

                heatPoints.push([encuesta.latitud, encuesta.longitud, intensidad]);
            }
        });

        // Configuramos e inicializamos la capa de calor
        this.heatmapLayer = L.heatLayer(heatPoints, {
            radius: 25,       // Radio de dispersión de cada punto (píxeles)
            blur: 15,         // Nivel de desenfoque/suavizado de la mancha térmica
            maxZoom: 15,      // Zoom máximo donde el calor alcanza su intensidad total
            gradient: {       // Paleta elegante de colores térmicos
                0.4: 'blue',
                0.6: 'cyan',
                0.7: 'lime',
                0.8: 'yellow',
                1.0: 'red'
            }
        });

        // Añadimos la capa de calor al mapa
        this.heatmapLayer.addTo(this.map);
    }

    // Acción para cambiar de modo de vista desde los botones del XML
    changeViewMode(mode) {
        this.state.currentMode = mode;
    }

    // Selección desde la barra lateral (Adaptado para manejar Clúster de forma elegante)
    seleccionarCliente(encuesta) {
        const marker = this.markers[encuesta.id];
        if (!marker) return;

        this.map.flyTo([encuesta.latitud, encuesta.longitud], 15, {
            animate: true,
            duration: 1.2
        });

        // 🧠 TRUCO DE INGENIERÍA PARA CLÚSTERS: 
        // Si el marcador está metido/escondido dentro de un grupo cerrado, 
        // el método 'zoomToShowLayer' abre automáticamente el clúster antes de desplegar el popup.
        if (this.state.currentMode === 'markers' && this.clusterGroup) {
            this.clusterGroup.zoomToShowLayer(marker, () => {
                marker.openPopup();
            });
        }
    }
}

registry.category("actions").add("action_mapa_global_encuestas", MapaGlobalEncuestas);
