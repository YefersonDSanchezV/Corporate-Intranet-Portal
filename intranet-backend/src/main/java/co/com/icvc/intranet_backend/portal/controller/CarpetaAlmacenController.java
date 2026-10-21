package co.com.icvc.intranet_backend.portal.controller;

import co.com.icvc.intranet_backend.permisos.RequiresPermission;
import co.com.icvc.intranet_backend.portal.dto.CarpetaAlmacenDtos;
import co.com.icvc.intranet_backend.portal.service.CarpetaAlmacenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Catálogo dinámico de carpetas de almacenamiento (bucket físico + prefijo lógico).
 * Las escrituras quedan bajo el permiso {@code parametros-comunicaciones} para que
 * el interceptor fail-closed no bloquee operaciones legítimas ni permita otras.
 */
@RestController
@RequestMapping("/api/carpetas-almacen")
@RequiredArgsConstructor
public class CarpetaAlmacenController {

    private final CarpetaAlmacenService carpetaService;

    @GetMapping
    public List<CarpetaAlmacenDtos.Response> listar(
            @RequestParam(required = false) String busqueda,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) Boolean activo) {
        return carpetaService.listar(busqueda, tipo, activo);
    }

    @GetMapping("/{oid}")
    public CarpetaAlmacenDtos.Response get(@PathVariable Integer oid) {
        return carpetaService.require(oid);
    }

    /** Archivos almacenados en la carpeta (realidad de MinIO + metadatos), para "Ver archivos". */
    @GetMapping("/{oid}/archivos")
    public List<CarpetaAlmacenDtos.ArchivoItem> archivos(@PathVariable Integer oid) {
        return carpetaService.archivos(oid);
    }

    /**
     * Vista previa: sirve el contenido del objeto indicado por su clave dentro de la
     * carpeta. Solo acepta claves que empiecen por el prefijo de la carpeta.
     */
    @GetMapping("/{oid}/contenido")
    public ResponseEntity<byte[]> contenido(@PathVariable Integer oid, @RequestParam String key) {
        var contenido = carpetaService.contenido(oid, key);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contenido.tipo()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                .contentLength(contenido.bytes().length)
                .body(contenido.bytes());
    }

    @PostMapping
    @RequiresPermission(module = "parametros-comunicaciones", action = "grabar")
    public ResponseEntity<CarpetaAlmacenDtos.Response> crear(@RequestBody CarpetaAlmacenDtos.Request request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(carpetaService.crear(request));
    }

    @PutMapping("/{oid}")
    @RequiresPermission(module = "parametros-comunicaciones", action = "actualizar")
    public CarpetaAlmacenDtos.Response editar(@PathVariable Integer oid,
            @RequestBody CarpetaAlmacenDtos.Request request) {
        return carpetaService.editar(oid, request);
    }

    @PatchMapping("/{oid}/estado")
    @RequiresPermission(module = "parametros-comunicaciones", action = "actualizar")
    public CarpetaAlmacenDtos.Response cambiarEstado(@PathVariable Integer oid,
            @RequestBody CarpetaAlmacenDtos.EstadoRequest request) {
        boolean activo = request == null || request.activo() == null || request.activo();
        return carpetaService.cambiarEstado(oid, activo);
    }

    @DeleteMapping("/{oid}")
    @RequiresPermission(module = "parametros-comunicaciones", action = "eliminar")
    public ResponseEntity<Void> eliminar(@PathVariable Integer oid) {
        carpetaService.eliminar(oid);
        return ResponseEntity.noContent().build();
    }
}
