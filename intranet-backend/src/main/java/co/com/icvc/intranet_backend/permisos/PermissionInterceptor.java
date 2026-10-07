package co.com.icvc.intranet_backend.permisos;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpMethod;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.util.List;

/**
 * Interceptor fail-closed para las escrituras del panel:
 * - Si el método handler declara {@link RequiresPermission}, se exige el permiso modulo:accion
 *   (el bypass de administrador pasa por {@code PermisoService.isAdministrator}).
 * - Si no lo declara y no es una escritura pública conocida, se deniega (403) para que ninguna
 *   escritura quede sin un permiso declarado.
 * Las lecturas (GET/HEAD/OPTIONS) no se evalúan aquí.
 */
@Component
@RequiredArgsConstructor
public class PermissionInterceptor implements HandlerInterceptor {

    private final PermisoService permisoService;

    /** Escrituras habilitadas por SecurityConfig como públicas (permitAll). */
    private static final List<String> PUBLIC_WRITE_PATHS = List.of(
            "/api/auth/login",
            "/api/auth/logout",
            "/api/access-requests",
            "/api/password-reset-requests");

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws IOException {
        if (!(handler instanceof HandlerMethod handlerMethod) || isRead(request)) {
            return true;
        }

        RequiresPermission required = handlerMethod.getMethodAnnotation(RequiresPermission.class);
        if (required == null) {
            if (isPublicWrite(request)) {
                return true;
            }
            return forbidden(response, "Operación sin permiso declarado");
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (permisoService.isAdministrator(authentication)) {
            return true;
        }
        String username = authentication != null ? authentication.getName() : null;
        if (username == null || username.isBlank()
                || !permisoService.can(username, required.module(), required.action())) {
            return forbidden(response,
                    "No tiene permisos para " + required.action() + " en " + required.module());
        }
        return true;
    }

    private static boolean isRead(HttpServletRequest request) {
        String method = request.getMethod();
        return HttpMethod.GET.matches(method) || HttpMethod.HEAD.matches(method) || HttpMethod.OPTIONS.matches(method);
    }

    private static boolean isPublicWrite(HttpServletRequest request) {
        return HttpMethod.POST.matches(request.getMethod())
                && PUBLIC_WRITE_PATHS.contains(request.getRequestURI());
    }

    private static boolean forbidden(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json");
        response.getWriter().write(
                "{\"status\":403,\"error\":\"Forbidden\",\"message\":\"" + message + "\"}");
        return false;
    }
}