package co.com.icvc.intranet_backend.user.service;

import co.com.icvc.intranet_backend.permisos.CargoPermisosCache;
import co.com.icvc.intranet_backend.user.dto.CargoDtos;
import co.com.icvc.intranet_backend.user.entity.CargoIntra;
import co.com.icvc.intranet_backend.user.entity.CargoPermiso;
import co.com.icvc.intranet_backend.user.repository.CargoIntraRepository;
import co.com.icvc.intranet_backend.user.repository.CargoPermisoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CargoService {

    private final CargoIntraRepository cargoRepository;
    private final CargoPermisoRepository cargoPermisoRepository;
    private final JdbcTemplate jdbcTemplate;

    @Transactional(readOnly = true)
    public List<CargoDtos.Response> list() {
        return cargoRepository.findAllByOrderByNombreAsc().stream()
                .map(CargoDtos.Response::from)
                .toList();
    }

    @Transactional
    public CargoDtos.Response create(CargoDtos.CreateRequest request) {
        String nombre = request.nombre().trim();
        // Evitar duplicados por nombre (case-insensitive)
        boolean exists = cargoRepository.findAllByOrderByNombreAsc().stream()
                .anyMatch(c -> c.getNombre().equalsIgnoreCase(nombre));
        if (exists) {
            throw new co.com.icvc.intranet_backend.common.exception.ConflictException("El cargo ya existe");
        }
        try {
            Integer nextOid = jdbcTemplate.queryForObject("SELECT COALESCE(MAX(oid),0)+1 FROM gencargointra", Integer.class);
            jdbcTemplate.update("INSERT INTO gencargointra (oid, gencarnom, gencaresta) VALUES (?,?,?)",
                    nextOid, nombre, true);
            CargoIntra saved = cargoRepository.findAllByOrderByNombreAsc().stream()
                    .filter(c -> c.getNombre().equalsIgnoreCase(nombre)).findFirst().orElseThrow();
            return CargoDtos.Response.from(saved);
        } catch (Exception ex) {
            log.warn("Fallback nativo gencargointra falló, intentando JPA: {}", ex.getMessage());
            CargoIntra cargo = CargoIntra.builder().nombre(nombre).estado(true).build();
            return CargoDtos.Response.from(cargoRepository.save(cargo));
        }
    }

    @Transactional
    public CargoDtos.Response toggleEstado(Integer oid) {
        CargoIntra cargo = cargoRepository.findById(oid)
                .orElseThrow(() -> new co.com.icvc.intranet_backend.common.exception.NotFoundException("Cargo no encontrado"));
        boolean nuevoEstado = !cargo.isEstado();
        try {
            jdbcTemplate.update("UPDATE gencargointra SET gencaresta = ? WHERE oid = ?", nuevoEstado, oid);
            cargo.setEstado(nuevoEstado);
            return CargoDtos.Response.from(cargo);
        } catch (Exception ex) {
            cargo.setEstado(nuevoEstado);
            return CargoDtos.Response.from(cargoRepository.save(cargo));
        }
    }

    @Transactional
    public CargoDtos.Response updateEstado(Integer oid, Boolean estado) {
        CargoIntra cargo = cargoRepository.findById(oid)
                .orElseThrow(() -> new co.com.icvc.intranet_backend.common.exception.NotFoundException("Cargo no encontrado"));
        try {
            jdbcTemplate.update("UPDATE gencargointra SET gencaresta = ? WHERE oid = ?", estado, oid);
            cargo.setEstado(estado);
            return CargoDtos.Response.from(cargo);
        } catch (Exception ex) {
            cargo.setEstado(estado);
            return CargoDtos.Response.from(cargoRepository.save(cargo));
        }
    }

    @Transactional(readOnly = true)
    public CargoDtos.PermisosResponse getPermisos(Integer oid) {
        CargoIntra cargo = cargoRepository.findById(oid)
                .orElseThrow(() -> new co.com.icvc.intranet_backend.common.exception.NotFoundException("Cargo no encontrado"));
        List<CargoPermiso> all = cargoPermisoRepository.findByCargoOid(cargo.getOid());
        List<String> modulos = all.stream().filter(p -> "MODULO".equals(p.getTipo())).map(CargoPermiso::getPermiso).toList();
        List<String> acciones = all.stream().filter(p -> "ACCION".equals(p.getTipo())).map(CargoPermiso::getPermiso).toList();
        return new CargoDtos.PermisosResponse(cargo.getOid(), modulos, acciones);
    }

    @Transactional(readOnly = true)
    public List<CargoDtos.PermisosResponse> listAllPermisos() {
        return cargoRepository.findAllByOrderByNombreAsc().stream()
                .map(cargo -> {
                    List<CargoPermiso> all = cargoPermisoRepository.findByCargoOid(cargo.getOid());
                    List<String> modulos = all.stream().filter(p -> "MODULO".equals(p.getTipo())).map(CargoPermiso::getPermiso).toList();
                    List<String> acciones = all.stream().filter(p -> "ACCION".equals(p.getTipo())).map(CargoPermiso::getPermiso).toList();
                    return new CargoDtos.PermisosResponse(cargo.getOid(), modulos, acciones);
                })
                .toList();
    }

    @Transactional
    @CacheEvict(cacheNames = CargoPermisosCache.CACHE_NAME, key = "#oid")
    public CargoDtos.PermisosResponse replacePermisos(Integer oid, CargoDtos.PermisosRequest request) {
        CargoIntra cargo = cargoRepository.findById(oid)
                .orElseThrow(() -> new co.com.icvc.intranet_backend.common.exception.NotFoundException("Cargo no encontrado"));
        cargoPermisoRepository.deleteByCargoOid(cargo.getOid());
        // flush to avoid unique constraint conflict within transaction
        cargoPermisoRepository.flush();

        List<String> modulos = request.modulos() != null ? request.modulos().stream().distinct().collect(Collectors.toList()) : List.of();
        List<String> acciones = request.acciones() != null ? request.acciones().stream().distinct().collect(Collectors.toList()) : List.of();

        for (String m : modulos) {
            if (m == null || m.isBlank()) continue;
            cargoPermisoRepository.save(CargoPermiso.builder().cargo(cargo).permiso(m.trim()).tipo("MODULO").build());
        }
        for (String a : acciones) {
            if (a == null || a.isBlank()) continue;
            cargoPermisoRepository.save(CargoPermiso.builder().cargo(cargo).permiso(a.trim()).tipo("ACCION").build());
        }
        return new CargoDtos.PermisosResponse(cargo.getOid(), modulos, acciones);
    }
}