package co.com.icvc.intranet_backend.user.service;

import co.com.icvc.intranet_backend.user.dto.CargoDtos;
import co.com.icvc.intranet_backend.user.repository.CargoIntraRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CargoService {

    private final CargoIntraRepository cargoRepository;

    @Transactional(readOnly = true)
    public List<CargoDtos.Response> list() {
        return cargoRepository.findAllByOrderByNombreAsc().stream()
                .map(CargoDtos.Response::from)
                .toList();
    }
}