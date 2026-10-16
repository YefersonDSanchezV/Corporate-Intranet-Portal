package co.com.icvc.intranet_backend.portal.service;

import co.com.icvc.intranet_backend.common.exception.NotFoundException;
import co.com.icvc.intranet_backend.common.exception.ValidationException;
import co.com.icvc.intranet_backend.portal.entity.Parametro;
import co.com.icvc.intranet_backend.portal.repository.ParametroRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ParametroService {

    private final ParametroRepository parametroRepository;

    @Transactional(readOnly = true)
    public List<Parametro> getAll() {
        return parametroRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Parametro require(String clave) {
        return parametroRepository.findById(clave)
                .orElseThrow(() -> NotFoundException.of("Parámetro", clave));
    }

    @Transactional(readOnly = true)
    public String get(String clave) {
        return parametroRepository.findById(clave).map(Parametro::getValor).orElse(null);
    }

    @Transactional(readOnly = true)
    public String getOrDefault(String clave, String defecto) {
        String valor = get(clave);
        return valor != null ? valor : defecto;
    }

    @Transactional
    public Parametro set(String clave, String valor) {
        return upsert(clave, valor, null);
    }

    @Transactional
    public Parametro upsert(String clave, String valor, String descripcion) {
        validar(clave, valor);
        Parametro parametro = parametroRepository.findById(clave).orElseGet(() -> Parametro.builder()
                .clave(clave)
                .build());
        parametro.setValor(valor);
        if (descripcion != null) {
            parametro.setDescripcion(descripcion);
        }
        parametro.setFechaActualizacion(LocalDateTime.now());
        return parametroRepository.save(parametro);
    }

    private void validar(String clave, String valor) {
        if (clave == null || clave.isBlank()) {
            throw new ValidationException("La clave es obligatoria");
        }
        if (valor != null && valor.length() > 2000) {
            throw new ValidationException("El valor no puede exceder 2000 caracteres");
        }
    }
}
