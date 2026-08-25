package co.com.icvc.intranet_backend.user.controller;

import co.com.icvc.intranet_backend.common.web.HttpUtils;
import co.com.icvc.intranet_backend.user.dto.LogAuditoriaDtos;
import co.com.icvc.intranet_backend.user.service.LogService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/logs")
@RequiredArgsConstructor
public class LogController {

    private final LogService logService;

    @GetMapping
    public List<LogAuditoriaDtos.Response> list(@RequestParam(required = false) String tabla) {
        return logService.list(tabla);
    }

    @PostMapping
    public ResponseEntity<LogAuditoriaDtos.Response> create(
            @Valid @RequestBody LogAuditoriaDtos.CreateRequest request, HttpServletRequest http) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(logService.create(request, HttpUtils.clientIp(http)));
    }
}