/** @odoo-module */

import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { Component, onWillStart, onMounted, onWillUnmount, useRef, useState, useEffect } from "@odoo/owl";

// --- SUB-COMPONENTE GENÉRICO PARA UN GRÁFICO (REUTILIZABLE) ---
class DashboardChart extends Component {
    setup() {
        this.canvasRef = useRef("chartCanvas");

        onMounted(() => {
            this.renderChart();
        });

        onWillUnmount(() => {
            if (this.chart){
                this.chart.destroy();
            }
        });

        // Re-renderizar si las propiedades cambian dinámicamente
        useEffect(() => {
            if (this.chart) {
                this.chart.data = this.props.data;
                this.chart.update();
            }
        }, () => [JSON.stringify(this.props.data)]);
    }

    renderChart() {
        const ctx = this.canvasRef.el.getContext("2d");
        // 'Chart' es expuesto globalmente por chart.umd.js cargado en los assets
        this.chart = new Chart(ctx, {
    type: this.props.type,
    data: this.props.data,

    options: {
        responsive: true,
        maintainAspectRatio: false,

        plugins: {
            legend: {
                position: 'bottom'
            }
        },

        onClick: (event, elements) => {

            if (!elements.length) {
                return;
            }

            const element = elements[0];

            const clickData = {
                datasetIndex: element.datasetIndex,
                index: element.index,
                label: this.props.data.labels[element.index],
                datasetLabel:
                    this.props.data.datasets[element.datasetIndex]?.label || null,
                value:
                    this.props.data.datasets[element.datasetIndex]?.data[element.index]
            };

            // Ejecutar callback enviado por el padre
            if (this.props.onChartClick) {
                this.props.onChartClick(clickData);
            }
        },

        ...this.props.options
    }
});

    }
}
DashboardChart.template = "encuesta_root.DashboardChartTemplate";


// --- COMPONENTE PRINCIPAL DEL DASHBOARD ---
export class ClientesDashboard extends Component {
    setup() {
        this.orm = useService("orm");
        this.actionService = useService("action");
        
        this.state = useState({
            cards: { total_encuestas: 0, total_aprobados: 0, total_1kw: 0, total_2kw: 0 },
            charts: {
                sistemas: { labels: [], values: [] },
                electrificacion: { labels: [], values: [] },
                municipios: { labels: [], dataset_1kw: [], dataset_2kw: [] },
                evaluacion: { labels: [], values: [] }
            }
        });

        onWillStart(async () => {
            await this.loadDashboardData();
        });
    }

    async loadDashboardData() {
        const data = await this.orm.call("clientes.encuesta", "get_dashboard_stats", []);
        Object.assign(this.state.cards, data.cards);
        Object.assign(this.state.charts, data.charts);
    }

    // Configuración de Datos para Chart.js (Getters)
    get sistemaChartData() {
        return {
            labels: this.state.charts.sistemas.labels,
            datasets: [{
                data: this.state.charts.sistemas.values,
                backgroundColor: ['#ffc107', '#0dcaf0']
            }]
        };
    }

    get electrificacionChartData() {
        return {
            labels: this.state.charts.electrificacion.labels,
            datasets: [{
                data: this.state.charts.electrificacion.values,
                backgroundColor: ['#6c757d', '#ffc107', '#dc3545', '#0d6efd']
            }]
        };
    }

    get municipiosChartData() {
        return {
            labels: this.state.charts.municipios.labels,
            datasets: [
                { label: 'Sistema 1 kW', data: this.state.charts.municipios.dataset_1kw, backgroundColor: '#ffc107' },
                { label: 'Sistema 2 kW', data: this.state.charts.municipios.dataset_2kw, backgroundColor: '#0dcaf0' }
            ]
        };
    }

    get evaluacionChartData() {
        const values = this.state.charts.evaluacion?.values || [0, 0, 0];
        return {
            labels: ["Aprobados 1 kW", "Aprobados 2 kW", "Rechazados"],
            datasets: [{
                data: [
                    values[0] || 0,
                    values[1] || 0,
                    values[2] || 0,
                ],
                backgroundColor: ['#28a745', '#17a2b8', '#dc3545']
            }]
        };
    }

    openListView(domain, title) {
        this.actionService.doAction({
            type: "ir.actions.act_window",
            name: title,
            res_model: "clientes.encuesta",
            view_mode: "list,form",
            views: [[false, "list"], [false, "form"]],
            domain: domain,
            target: "current"
        });
    }

    onMunicipiosChartClick(data) {

        const sistema =
            data.datasetIndex === 0
                ? '1kw'
                : '2kw';

        this.openListView(
            [
                ['municipio', '=', data.label],
                ['sistema_recomendado', '=', sistema]
            ],
            `${data.label} - ${data.datasetLabel}`
        );
    }

    onSistemaChartClick(data) {

        const sistema =
            data.label.includes('1')
                ? '1kw'
                : '2kw';

        this.openListView(
            [['sistema_recomendado', '=', sistema]],
            data.label
        );
    }

    onElectrificacionChartClick(data) {
        const mapping = {
            'Sistema Fotovoltaico': 'sfv',
            'Grupo Electrógeno': 'ge',
            'Sin Servicio Eléctrico': 'no_service',
            'Red Eléctrica': 'red'
        };
        const value = mapping[data.label];
        if (!value) return;

        this.openListView(
            [['tipo_servicio_energetico', '=', value]],
            data.label
            );
        }

    onEvaluacionChartClick(data) {
        let domain = [];
        if (data.index === 0) {
            domain = [['estado_evaluacion', '=', 'aprobado'], ['sistema_recomendado', '=', '1kw']];
        } else if (data.index === 1) {
            domain = [['estado_evaluacion', '=', 'aprobado'], ['sistema_recomendado', '=', '2kw']];
        } else if (data.index === 2) {
            domain = [['estado_evaluacion', '=', 'rechazado']];
        }
        this.openListView(domain, `Evaluación: ${data.label}`);
    }
}

// Vinculación y registro final
ClientesDashboard.components = { DashboardChart };
ClientesDashboard.template = "encuesta_root.ClientesDashboardTemplate";
registry.category("actions").add("encuesta_root.ClientesDashboard", ClientesDashboard);