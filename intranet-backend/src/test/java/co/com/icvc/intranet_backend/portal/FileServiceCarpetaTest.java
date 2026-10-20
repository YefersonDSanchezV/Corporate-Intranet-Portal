package co.com.icvc.intranet_backend.portal;

import co.com.icvc.intranet_backend.portal.entity.Archivo;
import co.com.icvc.intranet_backend.portal.entity.CarpetaAlmacen;
import co.com.icvc.intranet_backend.portal.repository.ArchivoRepository;
import co.com.icvc.intranet_backend.portal.service.CarpetaAlmacenService;
import co.com.icvc.intranet_backend.portal.service.FileService;
import co.com.icvc.intranet_backend.portal.service.MinioStorageService;
import co.com.icvc.intranet_backend.portal.service.ParametroService;
import co.com.icvc.intranet_backend.user.entity.Usuario;
import co.com.icvc.intranet_backend.user.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockMultipartFile;

import java.io.InputStream;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * La carpeta lógica determina el bucket físico y el prefijo. El caso sin carpeta
 * debe conservar EXACTAMENTE la ruta histórica {@code s3://<bucket>/cumpleanos/...}
 * para no romper los archivos ya almacenados.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class FileServiceCarpetaTest {

    @Mock
    private ArchivoRepository archivoRepository;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private MinioStorageService minioStorageService;
    @Mock
    private ParametroService parametroService;
    @Mock
    private CarpetaAlmacenService carpetaAlmacenService;

    @InjectMocks
    private FileService fileService;

    private MockMultipartFile archivo() {
        return new MockMultipartFile("file", "foto.png", "image/png", "contenido".getBytes());
    }

    private void usuarioValido() {
        when(usuarioRepository.findById(1)).thenReturn(Optional.of(Usuario.builder().oid(1).username("admin").build()));
        when(archivoRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void sinCarpetaConservaLaRutaHistoricaDeCumpleanos() throws Exception {
        usuarioValido();
        when(carpetaAlmacenService.resolverPorTipo(null)).thenReturn(null);
        when(parametroService.get("FOTOS_CUMPLE_BUCKET")).thenReturn("fotos-cumpleanos");

        Archivo guardado = fileService.store(archivo(), 1);

        assertThat(guardado.getRuta()).startsWith("s3://fotos-cumpleanos/cumpleanos/");
        verify(minioStorageService).put(eq("fotos-cumpleanos"), anyString(), any(InputStream.class), eq("image/png"), anyLong());
    }

    @Test
    void conCarpetaUsaSuBucketYPrefijo() {
        usuarioValido();
        when(carpetaAlmacenService.requireActiva(9)).thenReturn(CarpetaAlmacen.builder()
                .oid(9).nombre("contingencia").tipo("DOCUMENTOS")
                .bucket("documentos").prefijo("contingencia/").activo(true).build());

        Archivo guardado = fileService.store(archivo(), 1, 9);

        assertThat(guardado.getRuta()).startsWith("s3://documentos/contingencia/");
    }

    @Test
    void porTipoUsaLaCarpetaResueltaDelCatalogo() {
        usuarioValido();
        when(carpetaAlmacenService.resolverPorTipo("DOCUMENTOS")).thenReturn(CarpetaAlmacen.builder()
                .oid(2).nombre("documentos").tipo("DOCUMENTOS")
                .bucket("documentos").prefijo("documentos/").activo(true).build());

        Archivo guardado = fileService.storePorTipo(archivo(), 1, "DOCUMENTOS");

        assertThat(guardado.getRuta()).startsWith("s3://documentos/documentos/");
    }

    @Test
    void porNombreUsaLaCarpetaDePlantillas() {
        usuarioValido();
        when(carpetaAlmacenService.resolverPorNombre("plantillas-cumpleanos")).thenReturn(CarpetaAlmacen.builder()
                .oid(3).nombre("plantillas-cumpleanos").tipo("IMAGENES")
                .bucket("fotos-cumpleanos").prefijo("plantillas/").activo(true).build());

        Archivo guardado = fileService.storeEnCarpeta(archivo(), 1, "plantillas-cumpleanos");

        assertThat(guardado.getRuta()).startsWith("s3://fotos-cumpleanos/plantillas/");
    }

    @Test
    void porNombreDesconocidoCaeAlComportamientoPorDefecto() {
        usuarioValido();
        when(carpetaAlmacenService.resolverPorNombre("no-existe")).thenReturn(null);
        when(carpetaAlmacenService.resolverPorTipo(null)).thenReturn(null);
        when(parametroService.get("FOTOS_CUMPLE_BUCKET")).thenReturn("fotos-cumpleanos");

        Archivo guardado = fileService.storeEnCarpeta(archivo(), 1, "no-existe");

        assertThat(guardado.getRuta()).startsWith("s3://fotos-cumpleanos/cumpleanos/");
    }

    @Test
    void storeConCarpetaOidNuloDelegaAlPorDefecto() {
        usuarioValido();
        when(carpetaAlmacenService.resolverPorTipo(null)).thenReturn(CarpetaAlmacen.builder()
                .oid(1).nombre("fotos-cumpleanos").tipo("IMAGENES")
                .bucket("fotos-cumpleanos").prefijo("cumpleanos/").activo(true).build());

        Archivo guardado = fileService.store(archivo(), 1, null);

        ArgumentCaptor<String> bucket = ArgumentCaptor.forClass(String.class);
        verify(minioStorageService).put(bucket.capture(), anyString(), any(InputStream.class), anyString(), anyLong());
        assertThat(guardado.getRuta()).startsWith("s3://fotos-cumpleanos/cumpleanos/");
    }

    @Test
    void storeEnCarpetaDesactivadaEsRechazado() {
        // requireActiva lanza ValidationException; el archivo no debe subirse.
        when(carpetaAlmacenService.requireActiva(8)).thenThrow(
                new co.com.icvc.intranet_backend.common.exception.ValidationException(
                        "La carpeta 'x' está desactivada y no admite cargas."));

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> fileService.store(archivo(), 1, 8))
                .isInstanceOf(co.com.icvc.intranet_backend.common.exception.ValidationException.class)
                .hasMessageContaining("desactivada");
        org.mockito.Mockito.verifyNoInteractions(minioStorageService);
    }
}
