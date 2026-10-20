package co.com.icvc.intranet_backend.portal;

import co.com.icvc.intranet_backend.common.exception.ConflictException;
import co.com.icvc.intranet_backend.common.exception.ValidationException;
import co.com.icvc.intranet_backend.portal.dto.CarpetaAlmacenDtos;
import co.com.icvc.intranet_backend.portal.entity.CarpetaAlmacen;
import co.com.icvc.intranet_backend.portal.repository.ArchivoRepository;
import co.com.icvc.intranet_backend.portal.repository.CarpetaAlmacenRepository;
import co.com.icvc.intranet_backend.portal.service.CarpetaAlmacenService;
import co.com.icvc.intranet_backend.portal.service.MinioStorageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Catálogo dinámico de carpetas: creación, normalización de prefijos, resolución
 * por tipo/nombre, desactivación y eliminación protegida frente a archivos.
 */
@ExtendWith(MockitoExtension.class)
class CarpetaAlmacenServiceTest {

    @Mock
    private CarpetaAlmacenRepository carpetaRepository;
    @Mock
    private ArchivoRepository archivoRepository;
    @Mock
    private MinioStorageService minioStorageService;

    @InjectMocks
    private CarpetaAlmacenService service;

    private CarpetaAlmacen carpeta(Integer oid, String nombre, String tipo, String bucket, String prefijo, boolean activo) {
        return CarpetaAlmacen.builder()
                .oid(oid).nombre(nombre).tipo(tipo).bucket(bucket).prefijo(prefijo)
                .activo(activo).fechaCreacion(LocalDateTime.now()).build();
    }

    @Test
    void crearNormalizaPrefijoYCreaBucketIdempotente() {
        when(carpetaRepository.existsByBucketAndPrefijo("documentos", "avances-proyectos/")).thenReturn(false);
        when(carpetaRepository.save(any())).thenAnswer(inv -> {
            CarpetaAlmacen c = inv.getArgument(0);
            c.setOid(10);
            return c;
        });
        when(minioStorageService.listar("documentos", "avances-proyectos/")).thenReturn(List.of());

        var respuesta = service.crear(new CarpetaAlmacenDtos.Request(
                "avances-proyectos", "Avances", "documentos", "documentos", "/avances-proyectos", true));

        assertThat(respuesta.prefijo()).isEqualTo("avances-proyectos/");
        assertThat(respuesta.tipo()).isEqualTo("DOCUMENTOS");
        assertThat(respuesta.activo()).isTrue();
        // El bucket físico se asegura de forma idempotente en cada alta.
        verify(minioStorageService).ensureBucket("documentos");
    }

    @Test
    void crearRechazaDuplicadoEnElMismoBucketYPrefijo() {
        when(carpetaRepository.existsByBucketAndPrefijo("documentos", "contingencia/")).thenReturn(true);

        assertThatThrownBy(() -> service.crear(new CarpetaAlmacenDtos.Request(
                "contingencia", null, "DOCUMENTOS", "documentos", "contingencia/", true)))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Ya existe");
        verify(carpetaRepository, never()).save(any());
    }

    @Test
    void crearRechazaPrefijoConRecorridoDeDirectorio() {
        assertThatThrownBy(() -> service.crear(new CarpetaAlmacenDtos.Request(
                "malo", null, "DOCUMENTOS", "documentos", "../etc", true)))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("no es válida");
    }

    @Test
    void crearRechazaTipoInvalido() {
        assertThatThrownBy(() -> service.crear(new CarpetaAlmacenDtos.Request(
                "x", null, "NO_EXISTE", "documentos", "x", true)))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Tipo de contenido inválido");
    }

    @Test
    void resolverPorTipoDevuelveLaCarpetaActivaDelTipo() {
        when(carpetaRepository.findAllByOrderByNombreAsc()).thenReturn(List.of(
                carpeta(1, "documentos", "DOCUMENTOS", "documentos", "documentos/", true),
                carpeta(2, "videos", "VIDEOS", "videos", "videos/", true)));

        CarpetaAlmacen resuelta = service.resolverPorTipo("DOCUMENTOS");

        assertThat(resuelta.getBucket()).isEqualTo("documentos");
        assertThat(resuelta.getPrefijo()).isEqualTo("documentos/");
    }

    @Test
    void resolverPorTipoIgnoraCarpetasInactivas() {
        when(carpetaRepository.findAllByOrderByNombreAsc()).thenReturn(List.of(
                carpeta(1, "documentos", "DOCUMENTOS", "documentos", "documentos/", false),
                carpeta(2, "fotos-cumpleanos", "IMAGENES", "fotos-cumpleanos", "cumpleanos/", true)));

        // DOCUMENTOS está inactiva: cae a la carpeta por defecto activa.
        CarpetaAlmacen resuelta = service.resolverPorTipo("DOCUMENTOS");

        assertThat(resuelta.getNombre()).isEqualTo("fotos-cumpleanos");
    }

    @Test
    void resolverPorNombreEncuentraLaCarpetaDePlantillas() {
        when(carpetaRepository.findAllByOrderByNombreAsc()).thenReturn(List.of(
                carpeta(1, "plantillas-cumpleanos", "IMAGENES", "fotos-cumpleanos", "plantillas/", true)));

        CarpetaAlmacen resuelta = service.resolverPorNombre("plantillas-cumpleanos");

        assertThat(resuelta.getPrefijo()).isEqualTo("plantillas/");
    }

    @Test
    void requireActivaRechazaCarpetaDesactivada() {
        when(carpetaRepository.findById(3)).thenReturn(Optional.of(
                carpeta(3, "documentos", "DOCUMENTOS", "documentos", "documentos/", false)));

        assertThatThrownBy(() -> service.requireActiva(3))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("desactivada");
    }

    @Test
    void eliminarBloqueaCuandoHayArchivos() {
        when(carpetaRepository.findByIdForUpdate(4)).thenReturn(Optional.of(
                carpeta(4, "contingencia", "DOCUMENTOS", "documentos", "contingencia/", true)));
        when(archivoRepository.countEnCarpeta("documentos", "contingencia/")).thenReturn(3L);

        assertThatThrownBy(() -> service.eliminar(4))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("3 archivos");
        verify(carpetaRepository, never()).delete(any());
    }

    @Test
    void eliminarPermiteCarpetaVaciaQueNoEsLaPorDefecto() {
        when(carpetaRepository.findByIdForUpdate(5)).thenReturn(Optional.of(
                carpeta(5, "contingencia", "DOCUMENTOS", "documentos", "contingencia/", true)));
        when(archivoRepository.countEnCarpeta("documentos", "contingencia/")).thenReturn(0L);

        service.eliminar(5);

        verify(carpetaRepository).delete(any());
    }

    @Test
    void eliminarNuncaBorraLaCarpetaPorDefecto() {
        when(carpetaRepository.findByIdForUpdate(6)).thenReturn(Optional.of(
                carpeta(6, "fotos-cumpleanos", "IMAGENES", "fotos-cumpleanos", "cumpleanos/", true)));
        lenient().when(archivoRepository.countEnCarpeta(anyString(), anyString())).thenReturn(0L);

        assertThatThrownBy(() -> service.eliminar(6))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("por defecto");
        verify(carpetaRepository, never()).delete(any());
    }

    @Test
    void cambiarEstadoDesactivarNoBorraArchivos() {
        CarpetaAlmacen existente = carpeta(7, "videos", "VIDEOS", "videos", "videos/", true);
        when(carpetaRepository.findById(7)).thenReturn(Optional.of(existente));
        when(carpetaRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(minioStorageService.listar("videos", "videos/")).thenReturn(List.of(
                new MinioStorageService.ObjetoMinio("videos/a.mp4", 100, LocalDateTime.now())));

        var respuesta = service.cambiarEstado(7, false);

        assertThat(respuesta.activo()).isFalse();
        // El conteo refleja la realidad del bucket (1 objeto), no la BD (9 registros).
        assertThat(respuesta.archivos()).isEqualTo(1L);
        verify(archivoRepository, never()).delete(any());
    }

    @Test
    void contarArchivosUsaLaBdSiMinIOSNoResponde() {
        CarpetaAlmacen existente = carpeta(8, "documentos", "DOCUMENTOS", "documentos", "documentos/", true);
        when(carpetaRepository.findById(8)).thenReturn(Optional.of(existente));
        when(minioStorageService.listar("documentos", "documentos/"))
                .thenThrow(new IllegalStateException("MinIO no disponible"));
        when(archivoRepository.countEnCarpeta("documentos", "documentos/")).thenReturn(5L);

        var respuesta = service.require(8);

        assertThat(respuesta.archivos()).isEqualTo(5L);
    }

    @Test
    void archivosMezclaObjetosRealesConMetadatosDeLaBd() {
        CarpetaAlmacen existente = carpeta(9, "documentos", "DOCUMENTOS", "documentos", "documentos/", true);
        when(carpetaRepository.findById(9)).thenReturn(Optional.of(existente));
        when(minioStorageService.listar("documentos", "documentos/")).thenReturn(List.of(
                new MinioStorageService.ObjetoMinio("documentos/informe.pdf", 2048, LocalDateTime.now()),
                new MinioStorageService.ObjetoMinio("documentos/foto.png", 512, LocalDateTime.now())));
        when(archivoRepository.findEnCarpeta("documentos", "documentos/")).thenReturn(List.of(
                co.com.icvc.intranet_backend.portal.entity.Archivo.builder()
                        .oid(100).nombreInterno("uuid-informe.pdf").nombreOriginal("informe.pdf")
                        .ruta("s3://documentos/documentos/informe.pdf").tipo("application/pdf").tamano(2048L)
                        .fechaCreacion(LocalDateTime.now()).build()));

        var items = service.archivos(9);

        assertThat(items).hasSize(2);
        var informe = items.stream().filter(i -> i.key().endsWith("informe.pdf")).findFirst().orElseThrow();
        assertThat(informe.vista()).isEqualTo("PDF");
        assertThat(informe.oid()).isEqualTo(100);
        assertThat(informe.nombre()).isEqualTo("informe.pdf");
        // El objeto sin registro en BD igualmente se ofrece para vista previa.
        var foto = items.stream().filter(i -> i.key().endsWith("foto.png")).findFirst().orElseThrow();
        assertThat(foto.vista()).isEqualTo("IMAGEN");
        assertThat(foto.oid()).isNull();
        assertThat(foto.enMinio()).isTrue();
    }

    @Test
    void contenidoRechazaClaveFueraDeLaCarpeta() {
        when(carpetaRepository.findById(10)).thenReturn(Optional.of(
                carpeta(10, "documentos", "DOCUMENTOS", "documentos", "documentos/", true)));

        assertThatThrownBy(() -> service.contenido(10, "otra-carpeta/secreto.txt"))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("no pertenece");
    }

    @Test
    void contenidoDevuelveLosBytesYElTipo() {
        when(carpetaRepository.findById(11)).thenReturn(Optional.of(
                carpeta(11, "documentos", "DOCUMENTOS", "documentos", "documentos/", true)));
        when(minioStorageService.stat("documentos", "documentos/nota.txt")).thenReturn(null);
        when(minioStorageService.getBytes("documentos", "documentos/nota.txt")).thenReturn("hola".getBytes());

        var contenido = service.contenido(11, "documentos/nota.txt");

        assertThat(new String(contenido.bytes())).isEqualTo("hola");
        assertThat(contenido.tipo()).isEqualTo("text/plain; charset=UTF-8");
    }
}
