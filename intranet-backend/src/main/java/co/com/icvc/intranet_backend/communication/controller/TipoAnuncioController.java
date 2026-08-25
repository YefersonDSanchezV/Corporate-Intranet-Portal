package co.com.icvc.intranet_backend.communication.controller;

import co.com.icvc.intranet_backend.communication.dto.AnuncioDtos;
import co.com.icvc.intranet_backend.communication.service.AnnouncementService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/announcement-types")
@RequiredArgsConstructor
public class TipoAnuncioController {

    private final AnnouncementService announcementService;

    @GetMapping
    public List<AnuncioDtos.TipoResponse> list() {
        return announcementService.tipos();
    }
}