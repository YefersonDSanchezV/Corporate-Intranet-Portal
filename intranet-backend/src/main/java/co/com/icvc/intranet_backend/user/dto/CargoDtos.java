package co.com.icvc.intranet_backend.user.dto;

import co.com.icvc.intranet_backend.user.entity.CargoIntra;

public final class CargoDtos {

    private CargoDtos() {
    }

    public record Response(Integer oid, String nombre, boolean estado) {

        public static Response from(CargoIntra cargo) {
            return new Response(cargo.getOid(), cargo.getNombre(), cargo.isEstado());
        }
    }
}