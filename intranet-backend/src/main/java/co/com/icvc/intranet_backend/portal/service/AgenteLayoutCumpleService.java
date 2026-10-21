package co.com.icvc.intranet_backend.portal.service;

import co.com.icvc.intranet_backend.portal.dto.LayoutCumpleDtos;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Puente opcional con un proveedor de IA para la composición de la tarjeta.
 *
 * <p>La intranet funciona igual sin este servicio: si no hay proveedor configurado el
 * endpoint responde 204 y el navegador usa su reorganización determinista. Cuando sí
 * hay proveedor, se le envían los datos <b>ya medidos</b> y se limpian los valores que
 * devuelve (topes, campos desconocidos, textos larguísimos). La validación definitiva
 * la hace el motor del frontend, que es el único que conoce las fuentes reales.</p>
 *
 * <p>Contrato del proveedor (HTTP POST, JSON):</p>
 * <pre>
 * { "modelo": "...", "sistema": "...", "entrada": { ... } }
 * </pre>
 * <p>y debe responder:</p>
 * <pre>
 * { "explicacion": "...", "ajustes": [ { "campo": "nombre", "x": 50, "y": 70,
 *   "ancho": 80, "fuente": 3.5, "motivo": "..." } ], "observaciones": ["..."] }
 * </pre>
 *
 * <p>La URL y la clave viven solo en el servidor
 * ({@code intranet.cumple.ia.url} / {@code intranet.cumple.ia.api-key}).</p>
 */
@Service
public class AgenteLayoutCumpleService {

    private static final Logger log = LoggerFactory.getLogger(AgenteLayoutCumpleService.class);

    private static final Set<String> CAMPOS = Set.of("nombre", "cargo", "fecha");
    private static final int MAX_AJUSTES = 3;
    private static final int MAX_TEXTO = 500;

    private static final String INSTRUCCIONES = """
            Eres un asistente de composición gráfica. Recibes los datos ya medidos de una
            tarjeta de cumpleaños (campos de texto con su caja en porcentaje del lienzo,
            número de líneas reales y obstáculos que no se pueden tapar).
            Devuelve SOLO un objeto JSON con esta forma:
            {"explicacion":"...","ajustes":[{"campo":"nombre|cargo|fecha","x":0-100,
            "y":0-100,"ancho":0-100,"fuente":0.8-20,"motivo":"..."}],"observaciones":["..."]}
            Reglas: no propongas ajustes que dejen un texto encima de un obstáculo ni fuera
            del lienzo; no aumentes la letra más allá del tamaño preferido; explica cada
            cambio en una frase corta. Si no puedes resolverlo, devuelve "ajustes" vacío y
            explica el motivo en "observaciones".
            """;

    private final ObjectMapper objectMapper;
    private final String url;
    private final String apiKey;
    private final String modelo;
    private final Duration tiempoMaximo;
    private final HttpClient cliente;

    public AgenteLayoutCumpleService(
            ObjectMapper objectMapper,
            @Value("${intranet.cumple.ia.url:}") String url,
            @Value("${intranet.cumple.ia.api-key:}") String apiKey,
            @Value("${intranet.cumple.ia.modelo:}") String modelo,
            @Value("${intranet.cumple.ia.tiempo-max-segundos:20}") int tiempoMaxSegundos) {
        this.objectMapper = objectMapper;
        this.url = url == null ? "" : url.trim();
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.modelo = modelo == null ? "" : modelo.trim();
        this.tiempoMaximo = Duration.ofSeconds(Math.max(3, tiempoMaxSegundos));
        this.cliente = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    /** `true` si hay un proveedor configurado en el servidor. */
    public boolean disponible() {
        return !url.isEmpty();
    }

    /**
     * Pide una sugerencia al proveedor. Devuelve vacío si no está configurado, si falla
     * o si responde algo que no se puede interpretar: en todos esos casos la aplicación
     * usa su propio algoritmo.
     */
    public Optional<LayoutCumpleDtos.Respuesta> sugerir(LayoutCumpleDtos.Entrada entrada) {
        if (!disponible() || entrada == null) {
            return Optional.empty();
        }
        try {
            String cuerpo = objectMapper.writeValueAsString(Map.of(
                    "modelo", modelo,
                    "sistema", INSTRUCCIONES,
                    "entrada", entrada));

            HttpRequest.Builder constructor = HttpRequest.newBuilder(URI.create(url))
                    .timeout(tiempoMaximo)
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(cuerpo, StandardCharsets.UTF_8));
            if (!apiKey.isEmpty()) {
                constructor.header("Authorization", "Bearer " + apiKey);
            }

            HttpResponse<String> respuesta = cliente.send(constructor.build(),
                    HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (respuesta.statusCode() / 100 != 2) {
                log.warn("El agente de composición respondió HTTP {}", respuesta.statusCode());
                return Optional.empty();
            }
            LayoutCumpleDtos.Respuesta bruta = objectMapper.readValue(
                    respuesta.body(), LayoutCumpleDtos.Respuesta.class);
            return Optional.of(sanearRespuesta(bruta));
        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            log.warn("No se pudo consultar el agente de composición: {}", e.getMessage());
            return Optional.empty();
        } catch (RuntimeException e) {
            log.warn("Respuesta no válida del agente de composición: {}", e.getMessage());
            return Optional.empty();
        }
    }

    /** Acota los valores que devuelve el proveedor: nunca se confía en ellos tal cual. */
    public static LayoutCumpleDtos.Respuesta sanearRespuesta(LayoutCumpleDtos.Respuesta respuesta) {
        if (respuesta == null) {
            return new LayoutCumpleDtos.Respuesta("ia", "", List.of(), List.of());
        }
        List<LayoutCumpleDtos.Ajuste> ajustes = new ArrayList<>();
        for (LayoutCumpleDtos.Ajuste ajuste : respuesta.ajustes() == null ? List.<LayoutCumpleDtos.Ajuste>of() : respuesta.ajustes()) {
            if (ajuste == null || ajustes.size() >= MAX_AJUSTES) {
                continue;
            }
            String campo = ajuste.campo() == null ? "" : ajuste.campo().trim().toLowerCase(Locale.ROOT);
            if (!CAMPOS.contains(campo)) {
                continue;
            }
            ajustes.add(new LayoutCumpleDtos.Ajuste(
                    campo,
                    acotar(ajuste.x(), 0.0, 100.0),
                    acotar(ajuste.y(), 0.0, 100.0),
                    acotar(ajuste.ancho(), 1.0, 100.0),
                    acotar(ajuste.fuente(), 0.8, 20.0),
                    recortar(ajuste.motivo())));
        }

        List<String> observaciones = new ArrayList<>();
        if (respuesta.observaciones() != null) {
            for (String observacion : respuesta.observaciones()) {
                if (observacion == null || observaciones.size() >= 5) {
                    continue;
                }
                observaciones.add(recortar(observacion));
            }
        }

        return new LayoutCumpleDtos.Respuesta(
                "ia",
                recortar(respuesta.explicacion()),
                ajustes,
                observaciones);
    }

    private static Double acotar(Double valor, double min, double max) {
        if (valor == null || !Double.isFinite(valor)) {
            return null;
        }
        return Math.min(max, Math.max(min, valor));
    }

    private static String recortar(String texto) {
        if (texto == null) {
            return "";
        }
        String limpio = texto.trim();
        return limpio.length() <= MAX_TEXTO ? limpio : limpio.substring(0, MAX_TEXTO);
    }
}
