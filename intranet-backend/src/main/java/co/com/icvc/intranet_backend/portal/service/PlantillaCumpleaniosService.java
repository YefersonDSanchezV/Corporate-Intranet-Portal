package co.com.icvc.intranet_backend.portal.service;

import co.com.icvc.intranet_backend.common.exception.NotFoundException;
import co.com.icvc.intranet_backend.common.exception.ValidationException;
import co.com.icvc.intranet_backend.portal.dto.ConfigTarjeta;
import co.com.icvc.intranet_backend.portal.dto.PlantillaCumpleaniosDtos;
import co.com.icvc.intranet_backend.portal.dto.PosicionFoto;
import co.com.icvc.intranet_backend.portal.entity.Archivo;
import co.com.icvc.intranet_backend.portal.entity.PlantillaCumpleanios;
import co.com.icvc.intranet_backend.portal.repository.CumpleanosUsuarioRepository;
import co.com.icvc.intranet_backend.portal.repository.PlantillaCumpleaniosRepository;
import co.com.icvc.intranet_backend.user.repository.CumpleanosManualRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.TreeSet;

/**
 * Plantillas (arte de la tarjeta) de cumpleaños.
 *
 * <p>El arte es fijo y solo cambian los datos de la persona, por lo que la plantilla
 * se guarda como imagen de fondo más la configuración de los campos dinámicos
 * (foto, nombre, cargo y fecha). Se admiten JPG, PNG y PDF: los PDF se rasterizan a
 * PNG en alta resolución para poder superponer el texto y mantener una sola ruta de
 * renderizado.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PlantillaCumpleaniosService {

    private static final long MAX_MB_DEFECTO = 5;
    private static final int MAX_NOMBRE = 120;
    /** Carpeta lógica del catálogo de almacenamiento donde viven las plantillas. */
    private static final String CARPETA_PLANTILLAS = "plantillas-cumpleanos";

    private final PlantillaCumpleaniosRepository plantillaRepository;
    private final CumpleanosUsuarioRepository cumpleanosUsuarioRepository;
    private final CumpleanosManualRepository cumpleanosManualRepository;
    private final FileService fileService;
    private final ParametroService parametroService;
    private final PdfRasterizador pdfRasterizador;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<PlantillaCumpleaniosDtos.Response> list() {
        return list(null);
    }

    /**
     * Lista las plantillas. Si se indica un mes (1..12) las que aplican a ese mes
     * quedan primero, para sugerir la plantilla temática correspondiente (por
     * ejemplo, la navideña en diciembre).
     */
    @Transactional(readOnly = true)
    public List<PlantillaCumpleaniosDtos.Response> list(Integer mes) {
        List<PlantillaCumpleanios> todas = plantillaRepository.findAllByOrderByFechaCreacionDesc();
        List<PlantillaCumpleaniosDtos.Response> respuestas = todas.stream()
                .map(p -> PlantillaCumpleaniosDtos.Response.from(p, configDe(p)))
                .toList();
        if (mes == null || mes < 1 || mes > 12) {
            return respuestas;
        }
        return respuestas.stream()
                .sorted((a, b) -> Boolean.compare(aplicaAlMes(b, mes), aplicaAlMes(a, mes)))
                .toList();
    }

    @Transactional
    public PlantillaCumpleaniosDtos.Response create(MultipartFile file, MultipartFile frente, String nombre,
            Integer usuarioOid,
            java.math.BigDecimal fotoPx, java.math.BigDecimal fotoPy,
            java.math.BigDecimal fotoAncho, java.math.BigDecimal fotoAlto, Boolean fotoRedondo,
            String configJson, String meses) {
        validarArchivo(file);
        // La capa frontal es opcional, pero si viene debe ser una imagen (no un PDF):
        // se dibuja encima de la foto y necesita transparencia.
        boolean hayFrente = frente != null && !frente.isEmpty();
        if (hayFrente) {
            validarImagenFrente(frente);
        }
        String nombrePlantilla = resolverNombre(nombre, file.getOriginalFilename());
        ConfigTarjeta config = normalizarConfig(configJson);
        ConfigTarjeta.FotoMarco marco = config.fotoMarco();
        if (marco == null) {
            // Obligatorio: sin marco no se sabe dónde insertar la foto del funcionario.
            throw new ValidationException(
                    "Debe marcar el marco (círculo o recuadro) donde irá la foto del funcionario");
        }
        PosicionFoto posicion = new PosicionFoto(
                PosicionFoto.pct(marco.x()),
                PosicionFoto.pct(marco.y()),
                PosicionFoto.pct(marco.ancho()),
                PosicionFoto.pct(marco.alto()),
                "circulo".equals(marco.forma()),
                java.math.BigDecimal.ONE,
                java.math.BigDecimal.ZERO,
                java.math.BigDecimal.ZERO);
        String mesesNormalizados = normalizarMeses(meses);

        boolean esPdf = esPdf(file);
        Archivo archivo;
        if (esPdf) {
            // El PDF se "vectoriza" como capa base: se rasteriza a PNG de alta
            // resolución y sobre esa imagen se superponen los datos dinámicos.
            PdfRasterizador.Resultado raster = pdfRasterizador.rasterizar(bytesDe(file));
            archivo = fileService.storeBytesEnCarpeta(raster.png(), nombreArchivoPng(file), usuarioOid, CARPETA_PLANTILLAS);
        } else {
            archivo = fileService.storeEnCarpeta(file, usuarioOid, CARPETA_PLANTILLAS);
        }

        PlantillaCumpleanios plantilla = PlantillaCumpleanios.builder()
                .nombre(nombrePlantilla)
                .archivo(archivo)
                .frente(hayFrente ? fileService.storeEnCarpeta(frente, usuarioOid, CARPETA_PLANTILLAS) : null)
                .fechaCreacion(LocalDateTime.now())
                .fotoPx(posicion.px())
                .fotoPy(posicion.py())
                .fotoAncho(posicion.ancho())
                .fotoAlto(posicion.alto())
                .fotoRedondo(posicion.redondo())
                .config(jsonDe(config))
                .meses(mesesNormalizados)
                .origen(esPdf ? "PDF" : "IMAGEN")
                .build();
        return PlantillaCumpleaniosDtos.Response.from(plantillaRepository.save(plantilla), config);
    }

    /**
     * Actualiza la composición (marco de la foto, textos y zonas protegidas) de una
     * plantilla ya creada. No toca el arte ni los archivos: solo el JSON de
     * configuración, de modo que el adorno de una plantilla existente se puede proteger
     * sin borrarla ni volver a cargarla.
     */
    @Transactional
    public PlantillaCumpleaniosDtos.Response actualizarConfig(Integer id, String configJson) {
        PlantillaCumpleanios plantilla = plantillaRepository.findById(id)
                .orElseThrow(() -> NotFoundException.of("Plantilla de cumpleaños", id));
        ConfigTarjeta config = normalizarConfig(configJson);
        ConfigTarjeta.FotoMarco marco = config.fotoMarco();
        plantilla.setConfig(jsonDe(config));
        // Las columnas de posición de la foto se mantienen sincronizadas con el marco.
        plantilla.setFotoPx(PosicionFoto.pct(marco.x()));
        plantilla.setFotoPy(PosicionFoto.pct(marco.y()));
        plantilla.setFotoAncho(PosicionFoto.pct(marco.ancho()));
        plantilla.setFotoAlto(PosicionFoto.pct(marco.alto()));
        plantilla.setFotoRedondo("circulo".equals(marco.forma()));
        return PlantillaCumpleaniosDtos.Response.from(plantillaRepository.save(plantilla), config);
    }

    /**
     * Rasteriza el PDF para que el operador pueda ubicar los campos dinámicos antes
     * de guardar la plantilla. No persiste nada.
     */
    @Transactional(readOnly = true)
    public byte[] previsualizar(MultipartFile file) {
        validarArchivo(file);
        if (!esPdf(file)) {
            throw new ValidationException("La vista previa solo aplica a archivos PDF");
        }
        return pdfRasterizador.rasterizar(bytesDe(file)).png();
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
        Integer frenteOid = plantilla.getFrente() != null ? plantilla.getFrente().getOid() : null;
        plantillaRepository.delete(plantilla);
        // El FK se libera antes de borrar los archivos, para no chocar con la restricción.
        plantillaRepository.flush();
        borrarArchivo(archivoOid, "plantilla " + id);
        borrarArchivo(frenteOid, "capa frontal de la plantilla " + id);
    }

    /**
     * Asigna o reemplaza la capa frontal de una plantilla ya creada. Sin esto, para
     * añadir el adorno habría que borrar y volver a cargar la plantilla, y el borrado
     * se bloquea cuando la plantilla ya está asignada a algún cumpleaños.
     */
    @Transactional
    public PlantillaCumpleaniosDtos.Response setFrente(Integer id, MultipartFile frente, Integer usuarioOid) {
        PlantillaCumpleanios plantilla = plantillaRepository.findById(id)
                .orElseThrow(() -> NotFoundException.of("Plantilla de cumpleaños", id));
        validarImagenFrente(frente);
        Archivo anterior = plantilla.getFrente();
        Archivo nuevo = fileService.storeEnCarpeta(frente, usuarioOid, CARPETA_PLANTILLAS);
        plantilla.setFrente(nuevo);
        plantillaRepository.saveAndFlush(plantilla);
        if (anterior != null && !anterior.getOid().equals(nuevo.getOid())) {
            borrarArchivo(anterior.getOid(), "capa frontal anterior de la plantilla " + id);
        }
        return PlantillaCumpleaniosDtos.Response.from(plantilla, configDe(plantilla));
    }

    /** Quita la capa frontal; la plantilla sigue funcionando sin ella. */
    @Transactional
    public void quitarFrente(Integer id) {
        PlantillaCumpleanios plantilla = plantillaRepository.findById(id)
                .orElseThrow(() -> NotFoundException.of("Plantilla de cumpleaños", id));
        if (plantilla.getFrente() == null) {
            return;
        }
        Integer frenteOid = plantilla.getFrente().getOid();
        plantilla.setFrente(null);
        plantillaRepository.saveAndFlush(plantilla);
        borrarArchivo(frenteOid, "capa frontal de la plantilla " + id);
    }

    /** Borra un archivo sin tumbar la operación si falla (p. ej. si ya no existe en MinIO). */
    private void borrarArchivo(Integer archivoOid, String contexto) {
        if (archivoOid == null) {
            return;
        }
        try {
            fileService.delete(archivoOid);
        } catch (Exception ex) {
            log.warn("No se pudo eliminar el archivo {} ({}): {}", archivoOid, contexto, ex.getMessage());
        }
    }

    // ------------------------------------------------------------------ configuración

    /** Interpreta el JSON guardado; si falta o está corrupto, usa los valores por defecto. */
    private ConfigTarjeta configDe(PlantillaCumpleanios plantilla) {
        String json = plantilla.getConfig();
        ConfigTarjeta config;
        if (json == null || json.isBlank()) {
            config = ConfigTarjeta.porDefecto();
        } else {
            try {
                config = ConfigTarjeta.normalizar(objectMapper.readValue(json, ConfigTarjeta.class));
            } catch (Exception ex) {
                log.warn("Configuración de plantilla {} ilegible, se usan valores por defecto: {}",
                        plantilla.getOid(), ex.getMessage());
                config = ConfigTarjeta.porDefecto();
            }
        }
        // Plantillas creadas antes de V37/V38: el marco se reconstruye con la posición
        // de foto que ya tenían, para que sigan funcionando sin intervención.
        if (config.fotoMarco() == null) {
            config = config.conMarco(ConfigTarjeta.marcoDesdeFoto(
                    plantilla.getFotoPx(),
                    plantilla.getFotoPy(),
                    plantilla.getFotoAncho(),
                    plantilla.getFotoAlto(),
                    plantilla.isFotoRedondo()));
        }
        return config;
    }

    private ConfigTarjeta normalizarConfig(String configJson) {
        if (configJson == null || configJson.isBlank()) {
            throw new ValidationException(
                    "Debe marcar el marco (círculo o recuadro) donde irá la foto del funcionario");
        }
        // El límite es holgado porque la configuración incluye las zonas protegidas.
        if (configJson.length() > 8000) {
            throw new ValidationException("La configuración de la plantilla es demasiado grande");
        }
        try {
            ConfigTarjeta leida = objectMapper.readValue(configJson, ConfigTarjeta.class);
            if (leida.fotoMarco() == null) {
                throw new ValidationException(
                        "Debe marcar el marco (círculo o recuadro) donde irá la foto del funcionario");
            }
            return ConfigTarjeta.normalizar(leida);
        } catch (ValidationException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ValidationException("La configuración de los datos dinámicos no es válida");
        }
    }

    private String jsonDe(ConfigTarjeta config) {
        try {
            return objectMapper.writeValueAsString(config);
        } catch (Exception ex) {
            throw new ValidationException("No se pudo guardar la configuración de la plantilla");
        }
    }

    /** Normaliza "1, 7,12" a "1,7,12"; vacío/null = todo el año. */
    private String normalizarMeses(String meses) {
        if (meses == null || meses.isBlank()) {
            return null;
        }
        TreeSet<Integer> validos = new TreeSet<>();
        for (String parte : meses.split(",")) {
            String limpio = parte.trim();
            if (limpio.isEmpty()) {
                continue;
            }
            try {
                int mes = Integer.parseInt(limpio);
                if (mes < 1 || mes > 12) {
                    throw new ValidationException("Los meses deben estar entre 1 y 12");
                }
                validos.add(mes);
            } catch (NumberFormatException ex) {
                throw new ValidationException("Los meses deben ser números separados por coma (1 a 12)");
            }
        }
        if (validos.isEmpty()) {
            return null;
        }
        return String.join(",", validos.stream().map(String::valueOf).toList());
    }

    private boolean aplicaAlMes(PlantillaCumpleaniosDtos.Response plantilla, int mes) {
        return plantilla.meses().isEmpty() || plantilla.meses().contains(mes);
    }

    // ------------------------------------------------------------------ validación

    private void validarArchivo(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ValidationException("La plantilla es obligatoria");
        }
        String nombre = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        boolean pdf = contentType.equals("application/pdf") || nombre.endsWith(".pdf");
        boolean imagen = (contentType.equals("image/jpeg") || contentType.equals("image/jpg")
                || contentType.equals("image/png")) || nombre.matches(".*\\.(jpe?g|png)$");
        if (!pdf && !imagen) {
            throw new ValidationException("La plantilla debe ser un PDF o una imagen JPG/PNG");
        }
        long maxMb = maxMb();
        if (file.getSize() > maxMb * 1024 * 1024) {
            throw new ValidationException("La plantilla no puede superar " + maxMb + "MB");
        }
    }

    /**
     * Valida la capa frontal: solo imágenes (nunca PDF). Se recomienda PNG con
     * transparencia para que se vea la foto por debajo del adorno.
     */
    private void validarImagenFrente(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ValidationException("Seleccione la imagen de la capa frontal");
        }
        String nombre = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        boolean imagen = contentType.equals("image/jpeg") || contentType.equals("image/jpg")
                || contentType.equals("image/png") || nombre.matches(".*\\.(jpe?g|png)$");
        if (!imagen) {
            throw new ValidationException("La capa frontal debe ser una imagen PNG (recomendado) o JPG");
        }
        long maxMb = maxMb();
        if (file.getSize() > maxMb * 1024 * 1024) {
            throw new ValidationException("La capa frontal no puede superar " + maxMb + "MB");
        }
    }

    private long maxMb() {
        try {
            return Long.parseLong(parametroService.getOrDefault("PLANTILLAS_CUMPLE_MAX_MB", "5").trim());
        } catch (NumberFormatException ex) {
            return MAX_MB_DEFECTO;
        }
    }

    private boolean esPdf(MultipartFile file) {
        String nombre = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        return contentType.equals("application/pdf") || nombre.endsWith(".pdf");
    }

    private byte[] bytesDe(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (Exception ex) {
            throw new ValidationException("No se pudo leer el archivo de la plantilla: " + ex.getMessage());
        }
    }

    private String nombreArchivoPng(MultipartFile file) {
        String nombre = file.getOriginalFilename() == null ? "plantilla.pdf" : file.getOriginalFilename();
        return nombre.replaceAll("(?i)\\.pdf$", "") + ".png";
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
