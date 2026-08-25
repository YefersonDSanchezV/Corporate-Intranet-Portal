package co.com.icvc.intranet_backend.innovation.controller;

import co.com.icvc.intranet_backend.innovation.dto.InnovationDtos;
import co.com.icvc.intranet_backend.innovation.service.InnovationLinkService;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/innovation-links")
@RequiredArgsConstructor
public class InnovationLinkController {

    private final InnovationLinkService innovationLinkService;

    @GetMapping
    public List<InnovationDtos.Response> list() {
        return innovationLinkService.list();
    }

    @PostMapping
    public ResponseEntity<InnovationDtos.Response> create(@Valid @RequestBody InnovationDtos.CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(innovationLinkService.create(request));
    }

    @PutMapping("/{id}")
    public InnovationDtos.Response update(@PathVariable Integer id,
            @Valid @RequestBody InnovationDtos.CreateRequest request) {
        return innovationLinkService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        innovationLinkService.delete(id);
        return ResponseEntity.noContent().build();
    }
}