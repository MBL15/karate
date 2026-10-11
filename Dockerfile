# syntax=docker/dockerfile:1

FROM node:22-alpine AS frontend
WORKDIR /frontend
COPY seishin-app/package.json seishin-app/package-lock.json ./
RUN npm ci
COPY seishin-app/ ./
RUN npx tsc -b && npx vite build --outDir /frontend/dist --emptyOutDir

FROM eclipse-temurin:21-jdk AS backend
WORKDIR /src
COPY seishin-backend/gradlew seishin-backend/settings.gradle seishin-backend/build.gradle ./
COPY seishin-backend/gradle ./gradle
RUN sed -i 's/\r$//' gradlew && chmod +x gradlew
COPY seishin-backend/src ./src
COPY --from=frontend /frontend/dist/ ./src/main/resources/static/
RUN ./gradlew bootJar -x test -x buildFrontend --no-daemon \
    && find build/libs -name '*.jar' ! -name '*-plain.jar' -exec cp {} /tmp/app.jar \;

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=backend /tmp/app.jar /app/app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
