/** @odoo-module **/

import { FormController } from "@web/views/form/form_controller";
import { patch } from "@web/core/utils/patch";
import { useService } from "@web/core/utils/hooks";

// Extendemos el controlador del formulario nativo de Odoo
patch(FormController.prototype, {
  setup() {
    super.setup(...arguments);
    this.orm = useService("orm");
  },

  // Interceptamos el método que se ejecuta cuando el usuario guarda el formulario
  async saveButtonClicked() {
    // 1. Dejamos que Odoo guarde primero los datos del formulario (coordenadas, cliente, etc.)
    const saved = await super.saveButtonClicked(...arguments);

    if (saved) {
      try {
        // 2. Buscamos el elemento HTML donde Leaflet dibuja tu mapa en la pantalla
        // Ajusta la clase técnica si tu widget personalizado de mapa usa otra distinta
        const mapaElemento =
          document.querySelector(".o_leaflet_map_container") ||
          document.querySelector(".leaflet-container");

        if (mapaElemento) {
          // Importamos dinámicamente html2canvas (herramienta nativa para tomar capturas de elementos del DOM)
          const html2canvas =
            (await import("@web/core/utils/html2canvas")).default ||
            window.html2canvas;

          if (html2canvas) {
            // 3. Tomamos la "foto" del mapa tal cual la está viendo el usuario en el formulario
            const canvas = await html2canvas(mapaElemento, {
              useCORS: true, // Evita bloqueos de seguridad si las capas del mapa vienen de internet
              logging: false,
            });

            // 4. Convertimos la foto a formato base64 crudo
            const imagenBase64 = canvas.toDataURL("image/png").split(",")[1];

            // 5. Guardamos la imagen directamente en la base de datos usando el ORM de JS
            const resId = this.model.root.resId;
            if (resId) {
              await this.orm.write(this.model.root.resModel, [resId], {
                mapa_captura: imagenBase64,
              });
              // Refrescamos silenciosamente el registro en pantalla para que Odoo sepa que cambió
              await this.model.root.load();
            }
          }
        }
      } catch (error) {
        console.error(
          "No se pudo automatizar la captura del mapa Leaflet:",
          error,
        );
      }
    }
    return saved;
  },
});
