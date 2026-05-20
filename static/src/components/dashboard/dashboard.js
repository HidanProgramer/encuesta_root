/** @odoo-module */

import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { Component, onWillStart, onMounted, useRef, useState, useEffect } from "@odoo/owl";

// --- SUB-COMPONENTE GENÉRICO PARA UN GRÁFICO (REUTILIZABLE) ---
class DashboardChart extends Component {
    setup() {
        this.canvasRef = useRef("chartCanvas");

        onMounted(() => {
            this.renderChart();
        });

        // Re-renderizar si las propiedades cambian dinámicamente
        useEffect(() => {
            if (this.chart) {
                this.chart.destroy();
                this.renderChart();
            }
        }, () => [this.props.data]);
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
                    legend: { position: 'bottom' }
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
        return {
            labels: this.state.charts.evaluacion.labels,
            datasets: [{
                data: this.state.charts.evaluacion.values,
                backgroundColor: ['#28a745', '#17a2b8', '#dc3545']
            }]
        };
    }

    openListView(domain, title) {
        this.actionService.doAction({
            type: "ir.actions.act_window",
            name: title,
            res_model: "clientes.encuesta",
            views: [[false, "list"], [false, "form"]],
            domain: domain,
            target: "current",
        });
    }
}

// Vinculación y registro final
ClientesDashboard.components = { DashboardChart }; // Inyectamos el subcomponente
ClientesDashboard.template = "encuesta_root.ClientesDashboardTemplate";
registry.category("actions").add("encuesta_root.ClientesDashboard", ClientesDashboard);
