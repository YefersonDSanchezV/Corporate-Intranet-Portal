package co.com.icvc.intranet_backend.user;

import co.com.icvc.intranet_backend.user.dto.UsuarioDtos;
import co.com.icvc.intranet_backend.user.entity.CargoIntra;
import co.com.icvc.intranet_backend.user.entity.Usuario;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class UsuarioDtosTest {

    @Test
    void responseMapeaTodosLosCamposDelUsuario() {
        CargoIntra cargo = CargoIntra.builder().oid(7).nombre("Ingeniero de Sistemas").estado(true).build();
        Usuario usuario = Usuario.builder()
                .oid(1)
                .username("jsmith")
                .passwordHash("hash")
                .estado(true)
                .identificacion(123456789L)
                .nombreCompleto("Jane Smith")
                .fechaNacimiento(LocalDate.of(1990, 5, 10))
                .correoInstitucional("jsmith@icvc.gov.co")
                .cargo(cargo)
                .fechaCreacion(LocalDateTime.of(2026, 1, 1, 8, 0))
                .build();

        UsuarioDtos.Response response = UsuarioDtos.Response.from(usuario);

        assertThat(response.oid()).isEqualTo(1);
        assertThat(response.username()).isEqualTo("jsmith");
        assertThat(response.identificacion()).isEqualTo(123456789L);
        assertThat(response.nombreCompleto()).isEqualTo("Jane Smith");
        assertThat(response.fechaNacimiento()).isEqualTo(LocalDate.of(1990, 5, 10));
        assertThat(response.correoInstitucional()).isEqualTo("jsmith@icvc.gov.co");
        assertThat(response.cargoOid()).isEqualTo(7);
        assertThat(response.cargoNombre()).isEqualTo("Ingeniero de Sistemas");
        assertThat(response.estado()).isTrue();
    }

    @Test
    void responseSoportaLosCamposOpcionalesNulos() {
        Usuario usuario = Usuario.builder().oid(2).username("jdoe").cargo(null).build();

        UsuarioDtos.Response response = UsuarioDtos.Response.from(usuario);

        assertThat(response.cargoOid()).isNull();
        assertThat(response.cargoNombre()).isNull();
    }
}