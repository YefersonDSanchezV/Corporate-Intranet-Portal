package co.com.icvc.intranet_backend.portal.service;

import co.com.icvc.intranet_backend.common.exception.NotFoundException;
import co.com.icvc.intranet_backend.common.exception.ValidationException;
import co.com.icvc.intranet_backend.portal.dto.PlantillaCumpleaniosDtos;
import co.com.icvc.intranet_backend.portal.dto.PosicionFoto;
import co.com.icvc.intranet_backend.portal.entity.Archivo;
import co.com.icvc.intranet_backend.portal.entity.PlantillaCumpleanios;
import co.com.icvc.intranet_backend.portal.repository.CumpleanosUsuarioRepository;
import co.com.icvc.intranet_backend.portal.repository.PlantillaCumpleaniosRepository;
import co.com.icvc.intranet_backend.user.repository.CumpleanosManualRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Plantillas (imágenes de tarjeta) de cumpleaños.
 * La imagen se guarda con {@link FileService} (MinIO o disco local como respaldo) y
 * la plantilla solo referencia el archivo resultante.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PlantillaCumpleaniosService {

    private static final long MAX_MB_DEFECTO = 5;
    private static final int MAX_NOMBRE = 120;

    private final PlantillaCumpleaniosRepository plantillaRepository;
    private final CumpleanosUsuarioRepository cumpleanosUsuarioRepository;
    private final CumpleanosManualRepository cumpleanosManualRepository;
    private final FileService fileService;
    private final ParametroService parametroService;

    @Transactional(readOnly = true)
    public List<PlantillaCumpleaniosDtos.Response> list() {
        return plantillaRepository.findAllByOrderByFechaCreacionDesc().stream()
                .map(PlantillaCumpleaniosDtos.Response::from)
                .toList();
    }

    @Transactional
    public PlantillaCumpleaniosDtos.Response create(MultipartFile file, String nombre, Integer usuarioOid,
            java.math.BigDecimal fotoPx, java.math.BigDecimal fotoPy,
            java.math.BigDecimal fotoAncho, java.math.BigDecimal fotoAlto, Boolean fotoRedondo) {
        validarImagen(file);
        String nombrePlantilla = resolverNombre(nombre, file.getOriginalFilename());
        PosicionFoto posicion = PosicionFoto.validar(fotoPx, fotoPy, fotoAncho, fotoAlto, fotoRedondo);
        Archivo archivo = fileService.storeEnCarpeta(file, usuarioOid, "plantillas-cumpleanos");
        PlantillaCumpleanios plantilla = PlantillaCumpleanios.builder()
                .nombre(nombrePlantilla)
                .archivo(archivo)
                .fechaCreacion(LocalDateTime.now())
                .fotoPx(posicion.px())
                .fotoPy(posicion.py())
                .fotoAncho(posicion.ancho())
                .fotoAlto(posicion.alto())
                .fotoRedondo(posicion.redondo())
                .build();
        return PlantillaCumpleaniosDtos.Response.from(plantillaRepository.save(plantilla));
    }

    @Transactional
    public void delete(Integer id) {
        PlantillaCumpleanios plantilla = plantillaRepository.findById(id)
                .orElseThrow(() -> NotFoundException.of("Plantilla de cumpleaños", id));
        if (cumpleanosUsuarioRepository.existsByPlantillaOid(id) || cumpleanosManualRepository.existsByPlantillaOid(id)) {
            throw new ValidationException(
                    "No se puede eliminar la plantilla porque está asignada a uno o más cumpleaños. "
                            + "Cámbiela o quítela de esos cumpleaños primero.");
        }
        Integer archivoOid = plantilla.getArchivo() != null ? plantilla.getArchivo().getOid() : null;
        plantillaRepository.delete(plantilla);
        // El FK se libera antes de borrar el archivo, para no chocar con la restricción.
        plantillaRepository.flush();
        if (archivoOid != null) {
            try {
                fileService.delete(archivoOid);
            } catch (Exception ex) {
                log.warn("No se pudo eliminar el archivo {} de la plantilla {}: {}", archivoOid, id, ex.getMessage());
            }
        }
    }

    private void validarImagen(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ValidationException("La plantilla es obligatoria");
        }
        String contentType = file.getContentType();
        boolean mimeOk = (contentType != null
                && (contentType.equalsIgnoreCase("image/jpeg")
                        || contentType.equalsIgnoreCase("image/jpg")
                        || contentType.equalsIgnoreCase("image/png")))
                || (file.getOriginalFilename() != null
                        && file.getOriginalFilename().matches("(?i).*\\.(jpe?g|png)$"));
        if (!mimeOk) {
            throw new ValidationException("La plantilla debe ser JPG o PNG");
        }
        long maxMb;
        try {
            maxMb = Long.parseLong(parametroService.getOrDefault("PLANTILLAS_CUMPLE_MAX_MB", "5").trim());
        } catch (NumberFormatException ex) {
            maxMb = MAX_MB_DEFECTO;
        }
        if (file.getSize() > maxMb * 1024 * 1024) {
            throw new ValidationException("La plantilla no puede superar " + maxMb + "MB");
        }
    }

    private String resolverNombre(String nombre, String nombreOriginal) {
        String limpio = nombre == null ? "" : nombre.trim();
        if (limpio.isEmpty()) {
            limpio = nombreOriginal == null ? "Plantilla" : nombreOriginal.replaceAll("\\.[^.]+$", "").trim();
        }
        if (limpio.isEmpty()) {
            limpio = "Plantilla";
        }
        if (limpio.length() > MAX_NOMBRE) {
            throw new ValidationException("El nombre no puede exceder " + MAX_NOMBRE + " caracteres");
        }
        return limpio;
    }
}
