package co.com.icvc.intranet_backend.communication.controller;

import co.com.icvc.intranet_backend.communication.dto.RolPermisoDtos;
import co.com.icvc.intranet_backend.communication.service.CommunicationRoleService;
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
@RequestMapping("/api/communication")
@RequiredArgsConstructor
public class CommunicationRoleController {

    private final CommunicationRoleService roleService;

    @GetMapping("/roles")
    public List<RolPermisoDtos.RolResponse> listRoles() {
        return roleService.listRoles();
    }

    @PostMapping("/roles")
    public ResponseEntity<RolPermisoDtos.RolResponse> createRol(@Valid @RequestBody RolPermisoDtos.RolRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(roleService.createRol(request));
    }

    @PutMapping("/roles/{id}")
    public RolPermisoDtos.RolResponse updateRol(@PathVariable Integer id,
            @Valid @RequestBody RolPermisoDtos.RolRequest request) {
        return roleService.updateRol(id, request);
    }

    @DeleteMapping("/roles/{id}")
    public ResponseEntity<Void> deleteRol(@PathVariable Integer id) {
        roleService.deleteRol(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/permissions")
    public List<RolPermisoDtos.PermisoResponse> listPermissions() {
        return roleService.listPermissions();
    }

    @PostMapping("/permissions")
    public ResponseEntity<RolPermisoDtos.PermisoResponse> createPermission(
            @Valid @RequestBody RolPermisoDtos.PermisoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(roleService.createPermission(request));
    }

    @PutMapping("/permissions/{id}")
    public RolPermisoDtos.PermisoResponse updatePermission(@PathVariable Integer id,
            @Valid @RequestBody RolPermisoDtos.PermisoRequest request) {
        return roleService.updatePermission(id, request);
    }

    @DeleteMapping("/permissions/{id}")
    public ResponseEntity<Void> deletePermission(@PathVariable Integer id) {
        roleService.deletePermission(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users")
    public List<RolPermisoDtos.UsuarioComunicacionResponse> listUsers() {
        return roleService.listUsers();
    }

    @PostMapping("/users/{id}/roles")
    public ResponseEntity<RolPermisoDtos.UsuarioComunicacionResponse> assignRole(@PathVariable Integer id,
            @Valid @RequestBody RolPermisoDtos.UsuarioComunicacionRequest request) {
        RolPermisoDtos.UsuarioComunicacionRequest ajustado = new RolPermisoDtos.UsuarioComunicacionRequest(
                id, request.rolOid(), request.estado());
        return ResponseEntity.ok(roleService.assignRole(ajustado));
    }

    @PutMapping("/users/{id}/roles")
    public RolPermisoDtos.UsuarioComunicacionResponse updateRole(@PathVariable Integer id,
            @Valid @RequestBody RolPermisoDtos.UsuarioComunicacionRequest request) {
        RolPermisoDtos.UsuarioComunicacionRequest ajustado = new RolPermisoDtos.UsuarioComunicacionRequest(
                id, request.rolOid(), request.estado());
        return roleService.assignRole(ajustado);
    }
}