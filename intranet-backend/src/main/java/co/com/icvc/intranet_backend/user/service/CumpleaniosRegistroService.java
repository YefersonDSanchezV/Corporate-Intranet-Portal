package co.com.icvc.intranet_backend.user.service;

import co.com.icvc.intranet_backend.common.exception.NotFoundException;
import co.com.icvc.intranet_backend.common.exception.ValidationException;
import co.com.icvc.intranet_backend.portal.entity.Archivo;
import co.com.icvc.intranet_backend.portal.entity.CumpleanosUsuario;
import co.com.icvc.intranet_backend.portal.entity.PlantillaCumpleanios;
import co.com.icvc.intranet_backend.portal.repository.ArchivoRepository;
import co.com.icvc.intranet_backend.portal.repository.CumpleanosUsuarioRepository;
import co.com.icvc.intranet_backend.portal.repository.PlantillaCumpleaniosRepository;
import co.com.icvc.intranet_backend.portal.dto.PosicionFoto;
import co.com.icvc.intranet_backend.user.dto.CumpleaniosRegistroDtos;
import co.com.icvc.intranet_backend.user.entity.CumpleanosManual;
import co.com.icvc.intranet_backend.user.entity.Usuario;
import co.com.icvc.intranet_backend.user.repository.CumpleanosManualRepository;
import co.com.icvc.intranet_backend.user.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Registros del módulo de cumpleaños.
 *
 * <p>Une las dos fuentes en una sola lista: los cumpleaños automáticos (usuarios
 * activos con fecha de nacimiento válida) y los manuales ({@code gencumpleanos}).
 * Sobre los automáticos solo se configura foto/plantilla ({@code genusucumple});
 * el nombre y la fecha de nacimiento son del perfil del usuario.</p>
 */
@Service
@RequiredArgsConstructor
public class CumpleaniosRegistroService {

    private final UsuarioRepository usuarioRepository;
    private final CumpleanosManualRepository cumpleanosManualRepository;
    private final CumpleanosUsuarioRepository cumpleanosUsuarioRepository;
    private final PlantillaCumpleaniosRepository plantillaRepository;
    private final ArchivoRepository archivoRepository;

    @Transactional(readOnly = true)
    public List<CumpleaniosRegistroDtos.Response> list() {
        List<Usuario> usuarios = usuarioRepository.findAllByOrderByUsernameAsc().stream()
                .filter(u -> u.isEstado() && u.getFechaNacimiento() != null)
                .filter(u -> {
                    try {
                        FechaNacimientoValidator.validar(u.getFechaNacimiento());
                        return true;
                    } catch (Exception ex) {
                        return false;
                    }
                })
                .toList();

        Map<Integer, CumpleanosUsuario> configPorUsuario = configuraciones(usuarios);
        List<CumpleaniosRegistroDtos.Response> registros = new ArrayList<>();
        usuarios.forEach(u -> registros.add(CumpleaniosRegistroDtos.Response.sistema(
                u.getOid(),
                u.getUsername(),
                u.getNombreCompleto(),
                u.getFechaNacimiento(),
                FechaNacimientoValidator.fechaCumpleanosAnioActual(u.getFechaNacimiento()),
                FechaNacimientoValidator.edadQueCumple(u.getFechaNacimiento()),
                u.getCargo() != null ? u.getCargo().getNombre() : null,
                configPorUsuario.get(u.getOid()))));

        cumpleanosManualRepository.findAllByOrderByNombreCompletoAsc()
                .forEach(m -> registros.add(CumpleaniosRegistroDtos.Response.manual(
                        m,
                        FechaNacimientoValidator.fechaCumpleanosAnioActual(m.getFechaNacimiento()),
                        FechaNacimientoValidator.edadQueCumple(m.getFechaNacimiento()))));

        registros.sort((a, b) -> {
            int cmp = Integer.compare(a.fechaCumpleanos().getMonthValue(), b.fechaCumpleanos().getMonthValue());
            if (cmp != 0) return cmp;
            cmp = Integer.compare(a.fechaCumpleanos().getDayOfMonth(), b.fechaCumpleanos().getDayOfMonth());
            if (cmp != 0) return cmp;
            return a.nombreCompleto().compareToIgnoreCase(b.nombreCompleto());
        });
        return registros;
    }

    /**
     * Configura la tarjeta de un cumpleaños: foto y plantilla. En los usuarios del
     * sistema actualiza solo eso; en los manuales, además, la misma información que
     * ya administra {@code PUT /api/cumpleanos-manuales/{id}}.
     */
    @Transactional
    public CumpleaniosRegistroDtos.Response update(Integer oid, CumpleaniosRegistroDtos.UpdateRequest request) {
        if (oid == null) {
            throw new ValidationException("El cumpleaños es obligatorio");
        }
        boolean sistema = usuarioRepository.existsById(oid);
        CumpleanosManual manual = sistema ? null : cumpleanosManualRepository.findById(oid).orElse(null);
        if (!sistema && manual == null) {
            throw NotFoundException.of("Cumpleaños", oid);
        }

        PlantillaCumpleanios plantilla = request.plantillaOid() == null ? null
                : plantillaRepository.findById(request.plantillaOid())
                        .orElseThrow(() -> NotFoundException.of("Plantilla de cumpleaños", request.plantillaOid()));
        PosicionFoto posicion = request.posicion();
        if (posicion == null) {
            posicion = PosicionFoto.de(plantilla);
        }

        if (sistema) {
            Usuario usuario = usuarioRepository.findById(oid).orElseThrow(() -> NotFoundException.of("Usuario", oid));
            CumpleanosUsuario config = cumpleanosUsuarioRepository.findByUsuarioOid(oid)
                    .orElseGet(() -> CumpleanosUsuario.builder().usuario(usuario).build());
            config.setFoto(resolverArchivo(oid, request.fotoArchivoOid()));
            config.setPlantilla(plantilla);
            aplicar(config, posicion);
            config.setFechaActualizacion(LocalDateTime.now());
            CumpleanosUsuario guardado = cumpleanosUsuarioRepository.save(config);
            return CumpleaniosRegistroDtos.Response.sistema(
                    usuario.getOid(),
                    usuario.getUsername(),
                    usuario.getNombreCompleto(),
                    usuario.getFechaNacimiento(),
                    FechaNacimientoValidator.fechaCumpleanosAnioActual(usuario.getFechaNacimiento()),
                    FechaNacimientoValidator.edadQueCumple(usuario.getFechaNacimiento()),
                    usuario.getCargo() != null ? usuario.getCargo().getNombre() : null,
                    guardado);
        }

        if (request.plantillaOid() != null) {
            manual.setPlantilla(plantilla);
        }
        aplicar(manual, posicion);
        manual.setFechaActualizacion(LocalDateTime.now());
        CumpleanosManual guardado = cumpleanosManualRepository.save(manual);
        return CumpleaniosRegistroDtos.Response.manual(
                guardado,
                FechaNacimientoValidator.fechaCumpleanosAnioActual(guardado.getFechaNacimiento()),
                FechaNacimientoValidator.edadQueCumple(guardado.getFechaNacimiento()));
    }

    private Map<Integer, CumpleanosUsuario> configuraciones(List<Usuario> usuarios) {
        if (usuarios.isEmpty()) {
            return Map.of();
        }
        List<Integer> oids = usuarios.stream().map(Usuario::getOid).toList();
        return cumpleanosUsuarioRepository.findAllByUsuarioOidIn(oids).stream()
                .collect(Collectors.toMap(c -> c.getUsuario().getOid(), Function.identity(), (a, b) -> a, HashMap::new));
    }

    /** La foto debe ser un archivo cargado por el propio usuario (evita cruzar archivos ajenos). */
    private Archivo resolverArchivo(Integer usuarioOid, Integer archivoOid) {
        if (archivoOid == null) {
            return null;
        }
        Archivo archivo = archivoRepository.findById(archivoOid)
                .orElseThrow(() -> NotFoundException.of("Archivo", archivoOid));
        if (archivo.getUsuario() == null || !usuarioOid.equals(archivo.getUsuario().getOid())) {
            throw new ValidationException("La foto debe ser un archivo cargado por el mismo usuario");
        }
        return archivo;
    }

    private void aplicar(CumpleanosUsuario config, PosicionFoto posicion) {
        config.setFotoPx(posicion.px());
        config.setFotoPy(posicion.py());
        config.setFotoAncho(posicion.ancho());
        config.setFotoAlto(posicion.alto());
        config.setFotoRedondo(posicion.redondo());
        config.setFotoZoom(posicion.zoom());
        config.setFotoOffsetX(posicion.offsetX());
        config.setFotoOffsetY(posicion.offsetY());
    }

    private void aplicar(CumpleanosManual manual, PosicionFoto posicion) {
        manual.setFotoPx(posicion.px());
        manual.setFotoPy(posicion.py());
        manual.setFotoAncho(posicion.ancho());
        manual.setFotoAlto(posicion.alto());
        manual.setFotoRedondo(posicion.redondo());
        manual.setFotoZoom(posicion.zoom());
        manual.setFotoOffsetX(posicion.offsetX());
        manual.setFotoOffsetY(posicion.offsetY());
    }
}
