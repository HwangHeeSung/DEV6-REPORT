# Stage 1: React 빌드
FROM node:20-bookworm-slim AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund
COPY public ./public
COPY src ./src
# Railway는 CI=true → CRA가 warning을 error로 처리할 수 있음
ENV CI=false
RUN npm run build

# Stage 2: Spring Boot JAR (프론트 포함) — mvnw 대신 Maven 이미지 사용
FROM maven:3.9-eclipse-temurin-17 AS backend
WORKDIR /app
COPY backend/pom.xml backend/pom.xml
COPY backend/src backend/src
COPY --from=frontend /app/build build
WORKDIR /app/backend
RUN mvn -B clean package -Pbundle-frontend -DskipTests

# Stage 3: 실행
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=backend /app/backend/target/dev6-report-1.0.0.jar app.jar
ENV SPRING_PROFILES_ACTIVE=railway
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
