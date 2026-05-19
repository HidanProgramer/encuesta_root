/** @odoo-module */

import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { Component, onWillStart, useState } from "@odoo/owl";

export class ClientesDashboard extends Component {
    setup() {
        this.orm = useService("orm");
        this.actionService = useService("action");
        
        // Estado reactivo para almacenar las métricas
        this.stats = useState({
            total_encuestas: 0,
            total_aprobados: 0,
            total_1kw: 0,
            total_2kw: 0,
        });

        // Cargar los datos antes de renderizar el componente
        onWillStart(async () => {
            await this.loadDashboardData();
        });
    }

    async loadDashboardData() {
        const data = await this.orm.call("clientes.encuesta", "get_dashboard_stats", []);
        
        // Asignar los valores del servidor al estado reactivo
        Object.assign(this.stats, data);
    }

    // Método de navegación: Abre la lista filtrada al hacer clic en las tarjetas
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

// Registrar el componente con el tag definido en el XML de la acción de cliente
ClientesDashboard.template = "encuesta_root.ClientesDashboardTemplate";
registry.category("actions").add("encuesta_root.ClientesDashboard", ClientesDashboard);
