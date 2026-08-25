package co.com.icvc.intranet_backend.portal.dto;

import co.com.icvc.intranet_backend.portal.entity.Archivo;
import co.com.icvc.intranet_backend.portal.entity.Modulo;
import co.com.icvc.intranet_backend.portal.entity.SitioRedireccion;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDateTime;

public final class PortalDtos {

    private PortalDtos() {
    }

    public record ModuloResponse(Integer oid, String nombre, boolean estado) {

        public static ModuloResponse from(Modulo modulo) {
            return new ModuloResponse(modulo.getOid(), modulo.getNombre(), modulo.isEstado());
        }
    }

    public record SitioRequest(
            @NotBlank String nombre,
            @NotBlank String url,
            @NotNull @Positive Integer moduloOid,
            @NotBlank String icono) {
    }

    public record SitioResponse(
            Integer oid,
            String nombre,
            String url,
            Integer moduloOid,
            String moduloNombre,
            String icono) {

        public static SitioResponse from(SitioRedireccion sitio) {
            return new SitioResponse(
                    sitio.getOid(),
                    sitio.getNombre(),
                    sitio.getUrl(),
                    sitio.getModulo() != null ? sitio.getModulo().getOid() : null,
                    sitio.getModulo() != null ? sitio.getModulo().getNombre() : null,
                    sitio.getIcono());
        }
    }

    public record ActiveRequest(@NotNull Boolean activo) {
    }

    public record ArchivoResponse(
            Integer oid,
            String nombreInterno,
            String nombreOriginal,
            String tipo,
            Long tamano,
            LocalDateTime fechaCreacion,
            Integer usuarioOid) {

        public static ArchivoResponse from(Archivo archivo) {
            return new ArchivoResponse(
                    archivo.getOid(),
                    archivo.getNombreInterno(),
                    archivo.getNombreOriginal(),
                    archivo.getTipo(),
                    archivo.getTamano(),
                    archivo.getFechaCreacion(),
                    archivo.getUsuario() != null ? archivo.getUsuario().getOid() : null);
        }
    }
}