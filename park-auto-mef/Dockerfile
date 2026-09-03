# ==============================================================================
# Dockerfile Multi-Stage — Backend Park Auto MEF (Spring Boot 3 / Java 17)
# Conforme aux normes de sécurité et de déploiement CdC MEF Section 26
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1 : Construction Maven
# ------------------------------------------------------------------------------
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Optimisation du cache des dépendances Maven
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Compilation et packaging de l'artefact exécutable (.jar)
COPY src ./src
RUN mvn clean package -DskipTests -B

# ------------------------------------------------------------------------------
# Stage 2 : Image d'Exécution Minimale et Sécurisée
# ------------------------------------------------------------------------------
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Création d'un utilisateur applicatif non-privilégié (Directive DGSSI)
RUN addgroup -S mefgroup && adduser -S mefuser -G mefgroup

# Copie de l'artefact compilé depuis le stage de build
COPY --from=build /app/target/park-auto-mef-*.jar app.jar

# Répertoire GED (volume) et droits d'accès
RUN mkdir -p /app/uploads && chown -R mefuser:mefgroup /app
USER mefuser

# Variables d'environnement par défaut
ENV SPRING_PROFILES_ACTIVE=prod \
    JAVA_OPTS="-Xms512m -Xmx2048m -XX:+UseG1GC -XX:+ExitOnOutOfMemoryError"

# Exposition du port applicatif Spring Boot
EXPOSE 8080

# Healthcheck applicatif
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Point d'entrée avec gestion de la mémoire JVM
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
