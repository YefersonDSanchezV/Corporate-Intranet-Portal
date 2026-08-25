# =================================================
# ETAPA 1 - BUILD
# =================================================
FROM maven:3.9.4-eclipse-temurin-21-alpine AS build

WORKDIR /app

# Copiar dependiencias primero para aprovechar cache de docker
COPY pom.xml .

# Copiar código fuente
COPY src ./src

# Compilar
RUN mvn -B -ntp clean package -DskipTests

# =================================================
# ETAPA 2 - RUN
# =================================================
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Zona horaria
ENV TZ=America/Bogota

# Copiar el JAR compilado desde la etapa de build
COPY --from=build /app/target/*.jar app.jar

# Puerto en el que la aplicación escuchará
EXPOSE 8080

# Comando para ejecutar la aplicación
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]