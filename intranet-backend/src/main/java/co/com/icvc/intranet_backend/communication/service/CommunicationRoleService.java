package co.com.icvc.intranet_backend.communication.service;

import co.com.icvc.intranet_backend.common.exception.NotFoundException;
import co.com.icvc.intranet_backend.communication.dto.RolPermisoDtos;
import co.com.icvc.intranet_backend.communication.entity.ComUsuarioAccion;
import co.com.icvc.intranet_backend.communication.entity.Permiso;
import co.com.icvc.intranet_backend.communication.entity.Rol;
import co.com.icvc.intranet_backend.communication.entity.RolPermiso;
import co.com.icvc.intranet_backend.communication.entity.UsuarioComunicacion;
import co.com.icvc.intranet_backend.communication.repository.ComUsuarioAccionRepository;
import co.com.icvc.intranet_backend.communication.repository.PermisoRepository;
import co.com.icvc.intranet_backend.communication.repository.RolPermisoRepository;
import co.com.icvc.intranet_backend.communication.repository.RolRepository;
import co.com.icvc.intranet_backend.communication.repository.UsuarioComunicacionRepository;
import co.com.icvc.intranet_backend.user.entity.Usuario;
import co.com.icvc.intranet_backend.user.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommunicationRoleService {

    private final RolRepository rolRepository;
    private final PermisoRepository permisoRepository;
    private final RolPermisoRepository rolPermisoRepository;
    private final UsuarioComunicacionRepository usuarioComunicacionRepository;
    private final UsuarioRepository usuarioRepository;
    private final ComUsuarioAccionRepository comUsuarioAccionRepository;

    @Transactional(readOnly = true)
    public List<RolPermisoDtos.RolResponse> listRoles() {
        return rolRepository.findAllByOrderByNombreAsc().stream()
                .map(rol -> RolPermisoDtos.RolResponse.from(rol, permisoOidsOf(rol.getOid())))
                .toList();
    }

    @Transactional
    public RolPermisoDtos.RolResponse createRol(RolPermisoDtos.RolRequest request) {
        Rol rol = Rol.builder()
                .nombre(request.nombre())
                .descripcion(request.descripcion())
                .build();
        rol = rolRepository.save(rol);
        replacePermisos(rol, request.permisoOids());
        return RolPermisoDtos.RolResponse.from(rol, request.permisoOids());
    }

    @Transactional
    public RolPermisoDtos.RolResponse updateRol(Integer id, RolPermisoDtos.RolRequest request) {
        Rol rol = requireRol(id);
        rol.setNombre(request.nombre());
        rol.setDescripcion(request.descripcion());
        rolRepository.save(rol);
        replacePermisos(rol, request.permisoOids());
        return RolPermisoDtos.RolResponse.from(rol, request.permisoOids());
    }

    @Transactional
    public void deleteRol(Integer id) {
        rolPermisoRepository.deleteAllByRolOid(id);
        rolRepository.delete(requireRol(id));
    }

    @Transactional(readOnly = true)
    public List<RolPermisoDtos.PermisoResponse> listPermissions() {
        return permisoRepository.findAllByOrderByNombreAsc().stream()
                .map(RolPermisoDtos.PermisoResponse::from)
                .toList();
    }

    @Transactional
    public RolPermisoDtos.PermisoResponse createPermission(RolPermisoDtos.PermisoRequest request) {
        Permiso permiso = Permiso.builder()
                .nombre(request.nombre())
                .descripcion(request.descripcion())
                .build();
        return RolPermisoDtos.PermisoResponse.from(permisoRepository.save(permiso));
    }

    @Transactional
    public RolPermisoDtos.PermisoResponse updatePermission(Integer id, RolPermisoDtos.PermisoRequest request) {
        Permiso permiso = permisoRepository.findById(id)
                .orElseThrow(() -> NotFoundException.of("Permiso", id));
        permiso.setNombre(request.nombre());
        permiso.setDescripcion(request.descripcion());
        return RolPermisoDtos.PermisoResponse.from(permisoRepository.save(permiso));
    }

    @Transactional
    public void deletePermission(Integer id) {
        permisoRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<RolPermisoDtos.UsuarioComunicacionResponse> listUsers() {
        return usuarioComunicacionRepository.findAllByOrderByOidAsc().stream()
                .map(RolPermisoDtos.UsuarioComunicacionResponse::from)
                .toList();
    }

    @Transactional
    public RolPermisoDtos.UsuarioComunicacionResponse assignRole(RolPermisoDtos.UsuarioComunicacionRequest request) {
        Usuario usuario = usuarioRepository.findById(request.usuarioOid())
                .orElseThrow(() -> NotFoundException.of("Usuario", request.usuarioOid()));
        Rol rol = requireRol(request.rolOid());
        UsuarioComunicacion uc = usuarioComunicacionRepository.findByUsuarioOid(usuario.getOid())
                .orElseGet(() -> UsuarioComunicacion.builder().usuario(usuario).build());
        uc.setRol(rol);
        uc.setEstado(request.estado());
        return RolPermisoDtos.UsuarioComunicacionResponse.from(usuarioComunicacionRepository.save(uc));
    }

    private List<Integer> permisoOidsOf(Integer rolOid) {
        return rolPermisoRepository.findAllByRolOid(rolOid).stream()
                .map(rp -> rp.getPermiso().getOid())
                .toList();
    }

    private void replacePermisos(Rol rol, List<Integer> permisoOids) {
        rolPermisoRepository.deleteAllByRolOid(rol.getOid());
        if (permisoOids == null) {
            return;
        }
        permisoOids.stream()
                .map(oid -> permisoRepository.findById(oid)
                        .orElseThrow(() -> NotFoundException.of("Permiso", oid)))
                .forEach(permiso -> rolPermisoRepository.save(
                        RolPermiso.builder().rol(rol).permiso(permiso).build()));
    }

    private Rol requireRol(Integer id) {
        return rolRepository.findById(id)
                .orElseThrow(() -> NotFoundException.of("Rol", id));
    }

    @Transactional(readOnly = true)
    public Map<String, List<String>> listComUserPermissions() {
        return comUsuarioAccionRepository.findAllByOrderByOidAsc().stream()
                .collect(Collectors.groupingBy(
                        c -> String.valueOf(c.getUsuario().getOid()),
                        Collectors.mapping(ComUsuarioAccion::getAccion, Collectors.toList())));
    }

    @Transactional(readOnly = true)
    public List<String> getComUserPermissions(Integer usuarioOid) {
        usuarioRepository.findById(usuarioOid).orElseThrow(() -> NotFoundException.of("Usuario", usuarioOid));
        return comUsuarioAccionRepository.findByUsuarioOid(usuarioOid).stream()
                .map(ComUsuarioAccion::getAccion).toList();
    }

    @Transactional
    public List<String> replaceComUserPermissions(Integer usuarioOid, List<String> acciones) {
        Usuario usuario = usuarioRepository.findById(usuarioOid)
                .orElseThrow(() -> NotFoundException.of("Usuario", usuarioOid));
        comUsuarioAccionRepository.deleteByUsuarioOid(usuarioOid);
        comUsuarioAccionRepository.flush();
        if (acciones != null) {
            acciones.stream().filter(a -> a != null && !a.isBlank()).distinct().forEach(a -> {
                comUsuarioAccionRepository.save(ComUsuarioAccion.builder().usuario(usuario).accion(a.trim()).build());
            });
        }
        return getComUserPermissions(usuarioOid);
    }
}