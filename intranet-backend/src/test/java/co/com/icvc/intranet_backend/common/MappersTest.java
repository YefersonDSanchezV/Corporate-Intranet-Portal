package co.com.icvc.intranet_backend.common;

import co.com.icvc.intranet_backend.common.exception.ValidationException;
import co.com.icvc.intranet_backend.common.mapper.Mappers;
import co.com.icvc.intranet_backend.communication.enums.PrioridadTarea;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class MappersTest {

    @Test
    void enumValueAceptaMinusculasYNormaliza() {
        assertThat(Mappers.enumValue(PrioridadTarea.class, "alta", "invalida")).isEqualTo(PrioridadTarea.ALTA);
        assertThat(Mappers.enumValue(PrioridadTarea.class, "MEDIA", "invalida")).isEqualTo(PrioridadTarea.MEDIA);
    }

    @Test
    void enumValueConValorDesconocidoLanzaValidation() {
        assertThatThrownBy(() -> Mappers.enumValue(PrioridadTarea.class, "urgente", "Prioridad inválida"))
                .isInstanceOf(ValidationException.class)
                .hasMessage("Prioridad inválida");
    }

    @Test
    void enumValueConNuloLanzaValidation() {
        assertThatThrownBy(() -> Mappers.enumValue(PrioridadTarea.class, null, "Prioridad inválida"))
                .isInstanceOf(ValidationException.class);
    }

    @Test
    void trimToNullLimpiaEspacios() {
        assertThat(Mappers.trimToNull("  hola  ")).isEqualTo("hola");
        assertThat(Mappers.trimToNull("   ")).isNull();
        assertThat(Mappers.trimToNull(null)).isNull();
    }
}