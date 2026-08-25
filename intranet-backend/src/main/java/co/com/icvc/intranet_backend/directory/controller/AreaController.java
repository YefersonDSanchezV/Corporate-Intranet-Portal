package co.com.icvc.intranet_backend.directory.controller;

import co.com.icvc.intranet_backend.directory.dto.DirectoryDtos;
import co.com.icvc.intranet_backend.directory.service.DirectoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/areas")
@RequiredArgsConstructor
public class AreaController {

    private final DirectoryService directoryService;

    @GetMapping
    public List<DirectoryDtos.AreaResponse> list() {
        return directoryService.listAreas();
    }
}