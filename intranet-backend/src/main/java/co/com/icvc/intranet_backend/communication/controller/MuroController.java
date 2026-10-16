package co.com.icvc.intranet_backend.communication.controller;

import co.com.icvc.intranet_backend.common.web.HttpUtils;
import co.com.icvc.intranet_backend.communication.dto.MuroDtos;
import co.com.icvc.intranet_backend.communication.service.MuroService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

/**
 * Muro de Cumpleaños: bandeja de conversación del panel público.
 * Lectura pública; escribir y borrar exigen sesión (borrar: autor o
 * permiso {@code calendario-cumpleanios:eliminar}).
 */
@RestController
@RequestMapping("/api/muro")
@RequiredArgsConstructor
public class MuroController {

    private final MuroService muroService;

    @GetMapping("/mensajes")
    public List<MuroDtos.Response> mensajes(@RequestParam(required = false) Integer antesDeOid) {
        if (antesDeOid != null) {
            return muroService.anteriores(antesDeOid);
        }
        return muroService.ultimos();
    }

    @GetMapping("/mensajes/nuevos")
    public List<MuroDtos.Response> nuevos(@RequestParam Integer desdeOid) {
        return muroService.nuevosDesde(desdeOid);
    }

    @PostMapping("/mensajes")
    public ResponseEntity<MuroDtos.Response> publicar(
            @Valid @RequestBody MuroDtos.CreateRequest request, HttpServletRequest http) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                muroService.publicar(request.texto(), request.nombre(), usernameOpcional(), HttpUtils.clientIp(http)));
    }

    @DeleteMapping("/mensajes/{oid}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer oid) {
        muroService.eliminar(oid);
        return ResponseEntity.noContent().build();
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream() {
        return muroService.suscribir();
    }

    @GetMapping("/reportes")
    public List<MuroDtos.ReporteResponse> reportes() {
        return muroService.reportes();
    }

    /**
     * Usuario de la sesión si la hay; {@code null} para invitados sin login.
     */
    private String usernameOpcional() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null || auth.getName().isBlank()
                || "anonymousUser".equals(auth.getName())) {
            return null;
        }
        return auth.getName();
    }
}
