package co.com.icvc.intranet_backend.directory.controller;

import co.com.icvc.intranet_backend.directory.dto.DirectoryDtos;
import co.com.icvc.intranet_backend.directory.service.DirectoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/directory")
@RequiredArgsConstructor
public class DirectoryController {

    private final DirectoryService directoryService;

    @GetMapping("/extensions")
    public List<DirectoryDtos.ExtensionResponse> listExtensions(
            @RequestParam(defaultValue = "false") boolean soloSoporte) {
        return directoryService.listExtensions(soloSoporte);
    }

    @PostMapping("/extensions")
    public ResponseEntity<DirectoryDtos.ExtensionResponse> createExtension(
            @Valid @RequestBody DirectoryDtos.ExtensionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(directoryService.createExtension(request));
    }

    @PutMapping("/extensions/{id}")
    public DirectoryDtos.ExtensionResponse updateExtension(@PathVariable Integer id,
            @Valid @RequestBody DirectoryDtos.ExtensionRequest request) {
        return directoryService.updateExtension(id, request);
    }

    @DeleteMapping("/extensions/{id}")
    public ResponseEntity<Void> deleteExtension(@PathVariable Integer id) {
        directoryService.deleteExtension(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/emails")
    public List<DirectoryDtos.CorreoResponse> listEmails(
            @RequestParam(defaultValue = "false") boolean soloSoporte) {
        return directoryService.listEmails(soloSoporte);
    }

    @PostMapping("/emails")
    public ResponseEntity<DirectoryDtos.CorreoResponse> createEmail(
            @Valid @RequestBody DirectoryDtos.CorreoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(directoryService.createEmail(request));
    }

    @PutMapping("/emails/{id}")
    public DirectoryDtos.CorreoResponse updateEmail(@PathVariable Integer id,
            @Valid @RequestBody DirectoryDtos.CorreoRequest request) {
        return directoryService.updateEmail(id, request);
    }

    @DeleteMapping("/emails/{id}")
    public ResponseEntity<Void> deleteEmail(@PathVariable Integer id) {
        directoryService.deleteEmail(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/floors")
    public List<DirectoryDtos.PisoResponse> listFloors() {
        return directoryService.listFloors();
    }

    @GetMapping("/areas")
    public List<DirectoryDtos.AreaResponse> listAreas() {
        return directoryService.listAreas();
    }
}