package co.com.icvc.intranet_backend.user.dto;

import co.com.icvc.intranet_backend.user.entity.CargoIntra;

public final class CargoDtos {

    private CargoDtos() {
    }

    public record CreateRequest(
            @jakarta.validation.constraints.NotBlank String nombre) {
    }

    public record UpdateStatusRequest(
            @jakarta.validation.constraints.NotNull Boolean estado) {
    }

    public record Response(Integer oid, String nombre, boolean estado) {

        public static Response from(CargoIntra cargo) {
            return new Response(cargo.getOid(), cargo.getNombre(), cargo.isEstado());
        }
    }
}