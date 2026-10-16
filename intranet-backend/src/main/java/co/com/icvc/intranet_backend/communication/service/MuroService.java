package co.com.icvc.intranet_backend.communication.service;

import co.com.icvc.intranet_backend.common.exception.NotFoundException;
import co.com.icvc.intranet_backend.common.exception.ValidationException;
import co.com.icvc.intranet_backend.communication.dto.MuroDtos;
import co.com.icvc.intranet_backend.communication.entity.MuroCsvRegistro;
import co.com.icvc.intranet_backend.communication.entity.MuroMensaje;
import co.com.icvc.intranet_backend.communication.entity.MuroMensajeHist;
import co.com.icvc.intranet_backend.communication.repository.MuroCsvRegistroRepository;
import co.com.icvc.intranet_backend.communication.repository.MuroMensajeHistRepository;
import co.com.icvc.intranet_backend.communication.repository.MuroMensajeRepository;
import co.com.icvc.intranet_backend.permisos.PermisoService;
import co.com.icvc.intranet_backend.portal.entity.Archivo;
import co.com.icvc.intranet_backend.portal.service.FileService;
import co.com.icvc.intranet_backend.user.entity.Usuario;
import co.com.icvc.intranet_backend.user.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Muro de Cumpleaños: bandeja de conversación del panel público.
 * <ul>
 * <li>Lecturas paginadas e inserts de una sola fila: soporta decenas de
 * escritores simultáneos sin bloqueos (sin locks, transacciones cortas).</li>
 * <li>Difusión instantánea por SSE ({@code SseEmitter}, 1 conexión ligera
 * por cliente) con latido cada 20 s.</li>
 * <li>Anti-spam: 500 caracteres y 3 s mínimos entre mensajes por usuario.</li>
 * <li>Cierre diario 23:59 (America/Bogota): genera el CSV del día, lo
 * registra como archivo descargable, archiva en histórico y limpia el muro.</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MuroService {

    private static final ZoneId ZONA = ZoneId.of("America/Bogota");
    private static final long ANTISPAM_MS = 3000;
    private static final long SSE_TIMEOUT_MS = 300_000L;
    private static final int TEXTO_MAX = 500;
    private static final DateTimeFormatter CSV_FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final MuroMensajeRepository mensajeRepository;
    private final MuroMensajeHistRepository histRepository;
    private final MuroCsvRegistroRepository csvRepository;
    private final UsuarioRepository usuarioRepository;
    private final PermisoService permisoService;
    private final FileService fileService;

    @Value("${ADMIN_USERNAME:admin}")
    private String adminUsername;

    private final ConcurrentHashMap<String, Long> ultimoEnvio = new ConcurrentHashMap<>();
    private final Set<SseEmitter> emisores = ConcurrentHashMap.newKeySet();

    // ---------------------------------------------------------------- lecturas

    @Transactional(readOnly = true)
    public List<MuroDtos.Response> ultimos() {
        List<MuroDtos.Response> lista = mensajeRepository.findTop50ByOrderByOidDesc().stream()
                .map(MuroDtos.Response::from)
                .toList();
        List<MuroDtos.Response> asc = new ArrayList<>(lista);
        Collections.reverse(asc);
        return asc;
    }

    @Transactional(readOnly = true)
    public List<MuroDtos.Response> anteriores(Integer antesDeOid) {
        List<MuroDtos.Response> lista = mensajeRepository.findTop30ByOidLessThanOrderByOidDesc(antesDeOid).stream()
                .map(MuroDtos.Response::from)
                .toList();
        List<MuroDtos.Response> asc = new ArrayList<>(lista);
        Collections.reverse(asc);
        return asc;
    }

    @Transactional(readOnly = true)
    public List<MuroDtos.Response> nuevosDesde(Integer desdeOid) {
        return mensajeRepository.findByOidGreaterThanOrderByOidAsc(desdeOid).stream()
                .map(MuroDtos.Response::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MuroDtos.ReporteResponse> reportes() {
        return csvRepository.findAllByOrderByFechaDiaDesc().stream()
                .map(MuroDtos.ReporteResponse::from)
                .toList();
    }

    // --------------------------------------------------------------- escritura

    @Transactional
    public MuroDtos.Response publicar(String texto, String nombre, String username, String ip) {
        String limpio = validarTexto(texto);
        Usuario autor = null;
        String nombreMostrado;
        String claveAntispam;
        if (username != null) {
            autor = usuarioRepository.findByUsername(username)
                    .orElseThrow(() -> new ValidationException("Su sesión ya no es válida, ingrese de nuevo"));
            nombreMostrado = autor.getNombreCompleto();
            claveAntispam = "u:" + username.toLowerCase();
        } else {
            nombreMostrado = validarNombreInvitado(nombre);
            claveAntispam = "ip:" + (ip != null ? ip : "desconocida");
        }
        controlarAntispam(claveAntispam);
        MuroMensaje guardado = mensajeRepository.save(MuroMensaje.builder()
                .autor(autor)
                .autorNombre(nombreMostrado)
                .texto(limpio)
                .fecha(LocalDateTime.now(ZONA))
                .build());
        MuroDtos.Response respuesta = MuroDtos.Response.from(guardado);
        emitir("mensaje", respuesta);
        return respuesta;
    }

    @Transactional
    public void eliminar(Integer oid) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth != null ? auth.getName() : null;
        MuroMensaje mensaje = mensajeRepository.findById(oid)
                .orElseThrow(() -> NotFoundException.of("Mensaje", oid));
        boolean propio = username != null && mensaje.getAutor() != null
                && username.equalsIgnoreCase(mensaje.getAutor().getUsername());
        boolean moderador = permisoService.isAdministrator(auth)
                || (username != null && permisoService.can(username, "calendario-cumpleanios", "eliminar"));
        if (!propio && !moderador) {
            throw new ValidationException("No autorizado para eliminar este mensaje");
        }
        mensajeRepository.delete(mensaje);
        emitir("eliminado", oid);
    }

    // --------------------------------------------------------------------- SSE

    public SseEmitter suscribir() {
        SseEmitter emisor = new SseEmitter(SSE_TIMEOUT_MS);
        emisores.add(emisor);
        emisor.onCompletion(() -> emisores.remove(emisor));
        emisor.onTimeout(() -> emisores.remove(emisor));
        emisor.onError(e -> emisores.remove(emisor));
        try {
            emisor.send(SseEmitter.event().comment("conectado"));
        } catch (IOException e) {
            emisores.remove(emisor);
        }
        return emisor;
    }

    @Scheduled(fixedRate = 20000)
    public void latido() {
        if (emisores.isEmpty()) {
            return;
        }
        for (SseEmitter emisor : emisores) {
            try {
                emisor.send(SseEmitter.event().comment("latido"));
            } catch (Exception e) {
                emisores.remove(emisor);
            }
        }
    }

    private void emitir(String nombre, Object dato) {
        if (emisores.isEmpty()) {
            return;
        }
        for (SseEmitter emisor : emisores) {
            try {
                emisor.send(SseEmitter.event().name(nombre).data(dato));
            } catch (Exception e) {
                emisores.remove(emisor);
            }
        }
    }

    // ------------------------------------------------------- cierre diario CSV

    @Scheduled(cron = "0 59 23 * * *", zone = "America/Bogota")
    @Transactional
    public void cierreDiarioProgramado() {
        try {
            boolean huboCierre = ejecutarCierre();
            if (huboCierre) {
                emitir("cierre", "muro reiniciado para el nuevo día");
            }
        } catch (Exception ex) {
            log.error("Cierre diario del muro falló, el muro NO se limpió: {}", ex.getMessage());
        }
    }

    /**
     * Genera el CSV del día, lo registra, archiva en histórico y limpia el
     * muro. Si algo falla, no se borra nada (se reintenta al día siguiente).
     *
     * @return true si se archivó y limpió el muro.
     */
    @Transactional
    public boolean ejecutarCierre() {
        LocalDate hoy = LocalDate.now(ZONA);
        List<MuroMensaje> mensajes = mensajeRepository.findAllByOrderByOidAsc();
        if (mensajes.isEmpty()) {
            log.info("Cierre diario del muro ({}): sin actividad, nada que archivar", hoy);
            return false;
        }
        if (csvRepository.existsByFechaDia(hoy)) {
            log.warn("Cierre diario del muro ({}): ya existe CSV, solo se archiva y limpia", hoy);
        } else {
            byte[] csv = construirCsv(hoy, mensajes);
            Archivo archivo = guardarCsv(hoy, csv, mensajes.size());
            csvRepository.save(MuroCsvRegistro.builder()
                    .fechaDia(hoy)
                    .archivo(archivo)
                    .totalMensajes(mensajes.size())
                    .fechaCreacion(LocalDateTime.now(ZONA))
                    .build());
            log.info("Cierre diario del muro ({}): CSV generado con {} mensajes", hoy, mensajes.size());
        }
        LocalDateTime ahora = LocalDateTime.now(ZONA);
        List<MuroMensajeHist> hist = mensajes.stream()
                .map(m -> MuroMensajeHist.builder()
                        .autorNombre(nombreArchivo(m))
                        .texto(m.getTexto())
                        .fecha(m.getFecha())
                        .fechaArchivo(ahora)
                        .build())
                .toList();
        histRepository.saveAll(hist);
        mensajeRepository.deleteAllInBatch(mensajes);
        return true;
    }

    // ---------------------------------------------------------------- privados

    private String validarTexto(String texto) {
        if (texto == null || texto.isBlank()) {
            throw new ValidationException("El mensaje no puede estar vacío");
        }
        String limpio = texto.trim();
        if (limpio.length() > TEXTO_MAX) {
            throw new ValidationException("El mensaje no puede exceder 500 caracteres");
        }
        return limpio;
    }

    private String validarNombreInvitado(String nombre) {
        if (nombre == null || nombre.isBlank()) {
            throw new ValidationException("Escribe tu nombre para participar en el muro");
        }
        String limpio = nombre.trim().replaceAll("\\s+", " ");
        if (limpio.length() < 2) {
            throw new ValidationException("Escribe tu nombre para participar en el muro");
        }
        if (limpio.length() > 60) {
            throw new ValidationException("El nombre no puede exceder 60 caracteres");
        }
        return limpio;
    }

    private void controlarAntispam(String clave) {
        long ahora = System.currentTimeMillis();
        Long previo = ultimoEnvio.put(clave, ahora);
        if (previo != null && ahora - previo < ANTISPAM_MS) {
            ultimoEnvio.put(clave, previo);
            throw new ValidationException("Espera unos segundos antes de enviar otro mensaje");
        }
    }

    private byte[] construirCsv(LocalDate dia, List<MuroMensaje> mensajes) {
        StringBuilder sb = new StringBuilder();
        sb.append("fecha_hora;autor;texto\n");
        for (MuroMensaje m : mensajes) {
            String fecha = m.getFecha() != null ? m.getFecha().format(CSV_FECHA) : "";
            String autor = nombreArchivo(m);
            sb.append(celda(fecha)).append(';').append(celda(autor)).append(';').append(celda(m.getTexto())).append('\n');
        }
        byte[] cuerpo = sb.toString().getBytes(StandardCharsets.UTF_8);
        // BOM UTF-8 para que Excel abra las tildes correctamente
        byte[] csv = new byte[3 + cuerpo.length];
        csv[0] = (byte) 0xEF;
        csv[1] = (byte) 0xBB;
        csv[2] = (byte) 0xBF;
        System.arraycopy(cuerpo, 0, csv, 3, cuerpo.length);
        return csv;
    }

    private String nombreArchivo(MuroMensaje mensaje) {
        if (mensaje.getAutorNombre() != null && !mensaje.getAutorNombre().isBlank()) {
            return mensaje.getAutorNombre();
        }
        if (mensaje.getAutor() != null) {
            return mensaje.getAutor().getNombreCompleto();
        }
        return "Desconocido";
    }

    private String celda(String valor) {
        if (valor == null) {
            return "";
        }
        if (valor.contains(";") || valor.contains("\"") || valor.contains("\n") || valor.contains("\r")) {
            return "\"" + valor.replace("\"", "\"\"") + "\"";
        }
        return valor;
    }

    private Archivo guardarCsv(LocalDate dia, byte[] contenido, int total) {
        Usuario sistema = usuarioRepository.findByUsername(adminUsername)
                .orElseThrow(() -> new ValidationException("No se encontró el usuario del sistema para archivar el muro"));
        String nombre = "chat-cumpleanos-" + dia + ".csv";
        return fileService.storeBytes(contenido, nombre, "text/csv", sistema.getOid());
    }
}
