package co.com.icvc.intranet_backend.user.dto;

import co.com.icvc.intranet_backend.portal.dto.PosicionFoto;
import co.com.icvc.intranet_backend.portal.entity.CumpleanosUsuario;

import java.time.LocalDate;

/**
 * Fila del módulo de cumpleaños (registros de consulta): automáticos del sistema
 * + manuales. Incluye la foto y la plantilla asignadas, con la posición de la
 * foto sobre la plantilla (porcentajes) para armar la tarjeta.
 */
public final class CumpleaniosRegistroDtos {

    private CumpleaniosRegistroDtos() {
    }

    public record Response(
            String id,
            /** "sistema" (usuario) o "manual". */
            String origen,
            Integer oid,
            String codigo,
            Integer usuarioOid,
            String nombreCompleto,
            LocalDate fechaNacimiento,
            LocalDate fechaCumpleanos,
            Integer edad,
            String cargo,
            Integer fotoArchivoOid,
            Integer plantillaOid,
            String plantillaNombre,
            Integer plantillaArchivoOid,
            PosicionFoto posicion) {

        public static Response sistema(
                Integer usuarioOid,
                String username,
                String nombreCompleto,
                LocalDate fechaNacimiento,
                LocalDate fechaCumpleanos,
                Integer edad,
                String cargo,
                CumpleanosUsuario config) {
            var plantilla = config != null ? config.getPlantilla() : null;
            return new Response(
                    "sistema-" + usuarioOid,
                    "sistema",
                    null,
                    username,
                    usuarioOid,
                    nombreCompleto,
                    fechaNacimiento,
                    fechaCumpleanos,
                    edad,
                    cargo,
                    config != null && config.getFoto() != null ? config.getFoto().getOid() : null,
                    plantilla != null ? plantilla.getOid() : null,
                    plantilla != null ? plantilla.getNombre() : null,
                    plantilla != null && plantilla.getArchivo() != null ? plantilla.getArchivo().getOid() : null,
                    posicion(config));
        }

        public static Response manual(co.com.icvc.intranet_backend.user.entity.CumpleanosManual cumpleanos,
                LocalDate fechaCumpleanos, Integer edad) {
            var plantilla = cumpleanos.getPlantilla();
            return new Response(
                    "manual-" + cumpleanos.getOid(),
                    "manual",
                    cumpleanos.getOid(),
                    null,
                    null,
                    cumpleanos.getNombreCompleto(),
                    cumpleanos.getFechaNacimiento(),
                    fechaCumpleanos,
                    edad,
                    cumpleanos.getCargo(),
                    cumpleanos.getFotoArchivoOid(),
                    plantilla != null ? plantilla.getOid() : null,
                    plantilla != null ? plantilla.getNombre() : null,
                    plantilla != null && plantilla.getArchivo() != null ? plantilla.getArchivo().getOid() : null,
                    cumpleanos.getFotoPx() == null ? null : PosicionFoto.of(
                            cumpleanos.getFotoPx(),
                            cumpleanos.getFotoPy(),
                            cumpleanos.getFotoAncho(),
                            cumpleanos.getFotoAlto(),
                            cumpleanos.isFotoRedondo()));
        }

        private static PosicionFoto posicion(CumpleanosUsuario config) {
            if (config == null) {
                return null;
            }
            return PosicionFoto.of(
                    config.getFotoPx(),
                    config.getFotoPy(),
                    config.getFotoAncho(),
                    config.getFotoAlto(),
                    config.isFotoRedondo());
        }
    }

    /**
     * Datos configurables de un cumpleaños: foto de la tarjeta y plantilla con la
     * posición de la foto. Los nombres y la fecha de nacimiento de los usuarios no
     * se editan aquí (viven en el perfil del usuario).
     */
    public record UpdateRequest(
            Integer fotoArchivoOid,
            Integer plantillaOid,
            java.math.BigDecimal fotoPx,
            java.math.BigDecimal fotoPy,
            java.math.BigDecimal fotoAncho,
            java.math.BigDecimal fotoAlto,
            Boolean fotoRedondo) {

        public PosicionFoto posicion() {
            if (fotoPx == null && fotoPy == null && fotoAncho == null && fotoAlto == null && fotoRedondo == null) {
                return null;
            }
            return PosicionFoto.validar(fotoPx, fotoPy, fotoAncho, fotoAlto, fotoRedondo);
        }
    }
}
