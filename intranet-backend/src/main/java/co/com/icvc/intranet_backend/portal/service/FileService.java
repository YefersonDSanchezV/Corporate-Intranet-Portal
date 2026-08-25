package co.com.icvc.intranet_backend.portal.service;

import co.com.icvc.intranet_backend.common.exception.NotFoundException;
import co.com.icvc.intranet_backend.common.exception.ValidationException;
import co.com.icvc.intranet_backend.portal.dto.PortalDtos;
import co.com.icvc.intranet_backend.portal.entity.Archivo;
import co.com.icvc.intranet_backend.portal.repository.ArchivoRepository;
import co.com.icvc.intranet_backend.user.entity.Usuario;
import co.com.icvc.intranet_backend.user.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileService {

    private final ArchivoRepository archivoRepository;
    private final UsuarioRepository usuarioRepository;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @Transactional
    public Archivo store(MultipartFile file, Integer usuarioOid) {
        if (file == null || file.isEmpty()) {
            throw new ValidationException("El archivo está vacío");
        }
        Usuario usuario = usuarioRepository.findById(usuarioOid)
                .orElseThrow(() -> NotFoundException.of("Usuario", usuarioOid));
        try {
            Path dir = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(dir);
            String nombreInterno = UUID.randomUUID() + "-" + file.getOriginalFilename();
            Path destino = dir.resolve(nombreInterno).normalize();
            Files.copy(file.getInputStream(), destino);

            Archivo archivo = Archivo.builder()
                    .nombreInterno(nombreInterno)
                    .nombreOriginal(file.getOriginalFilename())
                    .ruta(destino.toString())
                    .tipo(file.getContentType())
                    .tamano(file.getSize())
                    .fechaCreacion(LocalDateTime.now())
                    .usuario(usuario)
                    .build();
            return archivoRepository.save(archivo);
        } catch (IOException ex) {
            throw new ValidationException("No se pudo almacenar el archivo: " + ex.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public Archivo require(Integer id) {
        return archivoRepository.findById(id)
                .orElseThrow(() -> NotFoundException.of("Archivo", id));
    }

    @Transactional(readOnly = true)
    public Resource loadAsResource(Integer id) {
        Archivo archivo = require(id);
        try {
            Path path = Paths.get(archivo.getRuta());
            Resource resource = new UrlResource(path.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new NotFoundException("Archivo físico no disponible: " + id);
            }
            return resource;
        } catch (IOException ex) {
            throw new NotFoundException("Archivo físico no disponible: " + id);
        }
    }

    @Transactional
    public void delete(Integer id) {
        Archivo archivo = archivoRepository.findById(id)
                .orElseThrow(() -> NotFoundException.of("Archivo", id));
        try {
            Files.deleteIfExists(Paths.get(archivo.getRuta()));
        } catch (IOException ignored) {
        }
        archivoRepository.delete(archivo);
    }
}