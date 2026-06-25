# ---- Build stage ----
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B clean package -DskipTests

# ---- Runtime stage ----
FROM eclipse-temurin:21-jre-jammy AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends wget \
    && rm -rf /var/lib/apt/lists/*
RUN groupadd -r spring && useradd -r -g spring spring
WORKDIR /app
COPY --from=build /app/target/smartqueue-backend-0.0.1-SNAPSHOT.jar app.jar
RUN chown -R spring:spring /app
USER spring
EXPOSE 8080

# Sized for a 1GB-RAM box shared with Caddy + the OS.
ENV JAVA_OPTS="-Xms192m -Xmx320m -XX:MaxMetaspaceSize=96m -XX:+UseSerialGC"

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=5 \
    CMD wget -qO- http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
