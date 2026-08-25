package co.com.icvc.intranet_backend.assistance.controller;

import co.com.icvc.intranet_backend.assistance.dto.AssistanceDtos;
import co.com.icvc.intranet_backend.assistance.service.AssistanceService;
import co.com.icvc.intranet_backend.portal.dto.PortalDtos;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/contingency-formats")
@RequiredArgsConstructor
public class ContingencyFormatController {

    private final AssistanceService assistanceService;

    @GetMapping
    public List<AssistanceDtos.FormatoResponse> list() {
        return assistanceService.listFormats();
    }

    @PostMapping
    public ResponseEntity<AssistanceDtos.FormatoResponse> create(
            @Valid @RequestBody AssistanceDtos.FormatoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(assistanceService.createFormat(request));
    }

    @PutMapping("/{id}")
    public AssistanceDtos.FormatoResponse update(@PathVariable Integer id,
            @Valid @RequestBody AssistanceDtos.FormatoRequest request) {
        return assistanceService.updateFormat(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        assistanceService.deleteFormat(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/{id}/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PortalDtos.ArchivoResponse attachFile(@PathVariable Integer id, @RequestPart MultipartFile file,
            @RequestParam Integer usuarioOid) {
        return assistanceService.attachFile(id, file, usuarioOid);
    }

    @GetMapping("/{id}/files")
    public List<PortalDtos.ArchivoResponse> files(@PathVariable Integer id) {
        return assistanceService.archivos(id);
    }
}