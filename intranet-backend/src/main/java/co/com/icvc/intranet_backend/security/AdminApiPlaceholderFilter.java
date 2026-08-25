package co.com.icvc.intranet_backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Marcador del área administrativa del portal.
 *
 * Reserva el espacio para la futura protección del Panel de Control con JWT + roles.
 * Hoy el portal es público (SecurityConfig con permitAll) y este filtro no restringe nada;
 * cuando se integre la autenticación real, aquí se validará el token y el rol
 * administrativo (comrol/comusuario) antes de dejar pasar /api/admin/**.
 */
@Component
public class AdminApiPlaceholderFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        filterChain.doFilter(request, response);
    }
}