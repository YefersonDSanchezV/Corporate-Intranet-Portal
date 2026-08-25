package co.com.icvc.intranet_backend.directory.dto;

import co.com.icvc.intranet_backend.directory.entity.Area;
import co.com.icvc.intranet_backend.directory.entity.CorreoDirectorio;
import co.com.icvc.intranet_backend.directory.entity.ExtensionDirectorio;
import co.com.icvc.intranet_backend.directory.entity.Piso;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public final class DirectoryDtos {

    private DirectoryDtos() {
    }

    public record ExtensionRequest(
            @NotBlank String nombre,
            @NotNull @Positive Integer extension,
            @NotNull @Positive Integer areaOid,
            @NotNull @Positive Integer pisoOid,
            @NotNull Boolean soporte) {
    }

    public record ExtensionResponse(
            Integer oid,
            String nombre,
            Integer extension,
            Integer areaOid,
            String areaNombre,
            Integer pisoOid,
            String pisoNombre,
            boolean soporte) {

        public static ExtensionResponse from(ExtensionDirectorio ext) {
            return new ExtensionResponse(
                    ext.getOid(),
                    ext.getNombre(),
                    ext.getExtension(),
                    ext.getArea() != null ? ext.getArea().getOid() : null,
                    ext.getArea() != null ? ext.getArea().getNombre() : null,
                    ext.getPiso() != null ? ext.getPiso().getOid() : null,
                    ext.getPiso() != null ? ext.getPiso().getNombre() : null,
                    ext.isSoporte());
        }
    }

    public record CorreoRequest(
            @NotBlank String nombre,
            @NotBlank @Email String correo,
            @NotNull @Positive Integer areaOid,
            @NotNull @Positive Integer pisoOid,
            @NotNull Boolean soporte) {
    }

    public record CorreoResponse(
            Integer oid,
            String nombre,
            String correo,
            Integer areaOid,
            String areaNombre,
            Integer pisoOid,
            String pisoNombre,
            boolean soporte) {

        public static CorreoResponse from(CorreoDirectorio correo) {
            return new CorreoResponse(
                    correo.getOid(),
                    correo.getNombre(),
                    correo.getCorreo(),
                    correo.getArea() != null ? correo.getArea().getOid() : null,
                    correo.getArea() != null ? correo.getArea().getNombre() : null,
                    correo.getPiso() != null ? correo.getPiso().getOid() : null,
                    correo.getPiso() != null ? correo.getPiso().getNombre() : null,
                    correo.isSoporte());
        }
    }

    public record AreaResponse(Integer oid, String nombre) {

        public static AreaResponse from(Area area) {
            return new AreaResponse(area.getOid(), area.getNombre());
        }
    }

    public record PisoResponse(Integer oid, String nombre) {

        public static PisoResponse from(Piso piso) {
            return new PisoResponse(piso.getOid(), piso.getNombre());
        }
    }
}