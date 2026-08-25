package co.com.icvc.intranet_backend.communication.controller;

import co.com.icvc.intranet_backend.communication.dto.TareaDtos;
import co.com.icvc.intranet_backend.communication.service.TaskService;
import co.com.icvc.intranet_backend.portal.dto.PortalDtos;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    public List<TareaDtos.Response> list() {
        return taskService.list();
    }

    @PostMapping
    public ResponseEntity<TareaDtos.Response> create(@Valid @RequestBody TareaDtos.CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.create(request));
    }

    @PutMapping("/{id}")
    public TareaDtos.Response update(@PathVariable Integer id, @Valid @RequestBody TareaDtos.CreateRequest request) {
        return taskService.update(id, request);
    }

    @PostMapping("/{id}/complete")
    public TareaDtos.Response complete(@PathVariable Integer id) {
        return taskService.complete(id);
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<TareaDtos.ComentarioResponse> addComment(@PathVariable Integer id,
            @Valid @RequestBody TareaDtos.ComentarioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.addComment(id, request));
    }

    @GetMapping("/{id}/comments")
    public List<TareaDtos.ComentarioResponse> comments(@PathVariable Integer id) {
        return taskService.comments(id);
    }

    @PostMapping(value = "/{id}/files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PortalDtos.ArchivoResponse attachFile(@PathVariable Integer id, @RequestPart MultipartFile file,
            @RequestParam Integer usuarioOid) {
        return taskService.attachFile(id, file, usuarioOid);
    }
}