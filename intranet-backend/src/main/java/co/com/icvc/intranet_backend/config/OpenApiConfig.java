package co.com.icvc.intranet_backend.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI intranetOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Intranet Institucional — API")
                        .description("API REST de la Intranet Institucional ICVC. "
                                + "Documentación interactiva: autentíquese con POST /api/auth/login "
                                + "y use el token JWT en el botón Authorize (Bearer). "
                                + "Lectura (GET) es pública; escritura requiere rol ADMIN.")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("ICVC - Sistemas")
                                .email("sistemas@icvc.com.co")))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
                .components(new Components()
                        .addSecuritySchemes("bearerAuth", new SecurityScheme()
                                .name("bearerAuth")
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Ingrese el token JWT obtenido en /api/auth/login")));
    }
}
