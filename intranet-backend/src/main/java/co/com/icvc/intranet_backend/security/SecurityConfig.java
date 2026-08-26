package co.com.icvc.intranet_backend.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> {})
            .httpBasic(httpBasic -> httpBasic.disable())
            .formLogin(formLogin -> formLogin.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((req, res, authEx) -> {
                    res.setStatus(401);
                    res.setContentType("application/json");
                    res.getWriter().write("{\"status\":401,\"error\":\"Unauthorized\",\"message\":\"Token no proporcionado o inválido\"}");
                })
                .accessDeniedHandler((req, res, accessEx) -> {
                    res.setStatus(403);
                    res.setContentType("application/json");
                    res.getWriter().write("{\"status\":403,\"error\":\"Forbidden\",\"message\":\"No tiene permisos para esta operación\"}");
                })
            )
            .authorizeHttpRequests(auth -> auth
                // Públicos sin autenticación
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/logout").permitAll()
                // Solicitudes públicas (todo el personal puede crear solicitudes)
                .requestMatchers(HttpMethod.POST, "/api/access-requests", "/api/password-reset-requests").permitAll()
                // /api/me requiere JWT para identificar al usuario
                .requestMatchers("/api/me").authenticated()
                // Lectura pública — portal público accesible a todo el personal
                .requestMatchers(HttpMethod.GET, "/api/**").permitAll()
                // Archivos públicos dentro del instituto (documentos sin riesgo)
                .requestMatchers(HttpMethod.GET, "/api/files/**").permitAll()
                // Escritura permitida para usuarios autenticados en estos módulos del panel
                .requestMatchers(HttpMethod.POST, "/api/sites/**", "/api/directory/**").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/sites/**", "/api/directory/**").authenticated()
                .requestMatchers(HttpMethod.PATCH, "/api/sites/**", "/api/directory/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/sites/**", "/api/directory/**").authenticated()
                // Escritura protegida — solo ADMIN (panel de control)
                .requestMatchers(HttpMethod.POST, "/api/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/**").hasRole("ADMIN")
                .anyRequest().permitAll()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
