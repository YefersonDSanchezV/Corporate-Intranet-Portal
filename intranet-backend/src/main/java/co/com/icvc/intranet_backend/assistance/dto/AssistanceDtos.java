package co.com.icvc.intranet_backend.assistance.dto;

import co.com.icvc.intranet_backend.assistance.entity.FormatoContingencia;
import co.com.icvc.intranet_backend.assistance.entity.SitioExterno;
import jakarta.validation.constraints.NotBlank;

public final class AssistanceDtos {

    private AssistanceDtos() {
    }

    public record SitioExternoRequest(@NotBlank String nombre, @NotBlank String url) {
    }

    public record SitioExternoResponse(Integer oid, String nombre, String url) {

        public static SitioExternoResponse from(SitioExterno sitio) {
            return new SitioExternoResponse(sitio.getOid(), sitio.getNombre(), sitio.getUrl());
        }
    }

    public record FormatoRequest(String nombre, String observaciones, String codigo) {
    }

    public record FormatoResponse(Integer oid, String nombre, String observaciones, String codigo) {

        public static FormatoResponse from(FormatoContingencia formato) {
            return new FormatoResponse(
                    formato.getOid(),
                    formato.getNombre(),
                    formato.getObservaciones(),
                    formato.getCodigo());
        }
    }
}