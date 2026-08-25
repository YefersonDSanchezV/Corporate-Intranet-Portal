package co.com.icvc.intranet_backend.user.repository;

import co.com.icvc.intranet_backend.user.entity.SolicitudUsuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SolicitudUsuarioRepository extends JpaRepository<SolicitudUsuario, Integer> {

    List<SolicitudUsuario> findAllByOrderByFechaSolicitudDesc();
}