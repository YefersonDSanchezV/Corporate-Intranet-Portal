package co.com.icvc.intranet_backend;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Prueba de contexto de Spring Boot.
 *
 * Deshabilitada en CI/entornos sin red: levantar el contexto completo requiere
 * conexión a PostgreSQL (datasource + Flyway + JPA validate), que no está
 * disponible en este entorno.
 *
 * Para ejecutarla se necesita una BD alcanzable configurada en dev.properties
 * o application-test.yml (ver docs/BACKEND_IMPLEMENTACION.md, sección Pruebas):
 *
 *     ./mvnw test -Dtest=IntranetBackendApplicationTests
 *
 * El resto de pruebas del proyecto son unitarias y no requieren base de datos.
 */
@Disabled("Requiere conexión a PostgreSQL; ejecutar con BD disponible")
@SpringBootTest
class IntranetBackendApplicationTests {

	@Test
	void contextLoads() {
	}

}