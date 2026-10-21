package co.com.icvc.intranet_backend.portal.controller;

import co.com.icvc.intranet_backend.permisos.RequiresPermission;
import co.com.icvc.intranet_backend.portal.dto.LayoutCumpleDtos;
import co.com.icvc.intranet_backend.portal.service.AgenteLayoutCumpleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Composición asistida de la tarjeta de cumpleaños.
 *
 * <p>El motor determinista vive en el navegador (es el que conoce las fuentes reales de
 * renderizado). Este controlador solo expone el agente de IA <b>opcional</b>: si no hay
 * proveedor configurado responde 204 y la aplicación reorganiza por sí sola.</p>
 */
@RestController
@RequestMapping("/api/layout-cumple")
@RequiredArgsConstructor
public class LayoutCumpleController {

    private final AgenteLayoutCumpleService agente;

    /** Indica a la interfaz si debe ofrecer el botón de sugerencias con IA. */
    @GetMapping("/agente")
    @RequiresPermission(module = "plantillas-cumpleanios", action = "consultar")
    public LayoutCumpleDtos.Disponibilidad disponibilidad() {
        boolean disponible = agente.disponible();
        return new LayoutCumpleDtos.Disponibilidad(disponible, disponible ? "configurado" : "");
    }

    /**
     * Sugerencia de composición. Sin proveedor (o si falla) responde 204 para que el
     * cliente aplique su reorganización determinista.
     */
    @PostMapping("/sugerencia")
    @RequiresPermission(module = "plantillas-cumpleanios", action = "grabar")
    public ResponseEntity<LayoutCumpleDtos.Respuesta> sugerir(@RequestBody LayoutCumpleDtos.Entrada entrada) {
        return agente.sugerir(entrada)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }
}
