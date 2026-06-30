# Stage 1: React 빌드
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund
COPY public ./public
COPY src ./src
RUN npm run build

# Stage 2: Spring Boot JAR (프론트 포함)
FROM eclipse-temurin:17-jdk-alpine AS backend
WORKDIR /app
COPY backend/mvnw backend/mvnw.cmd backend/pom.xml ./backend/
COPY backend/.mvn ./backend/.mvn
COPY backend/src ./backend/src
COPY --from=frontend /app/build ./build
WORKDIR /app/backend
RUN chmod +x mvnw && ./mvnw clean package -Pbundle-frontend -DskipTests -q

# Stage 3: 실행
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=backend /app/backend/target/dev6-report-1.0.0.jar app.jar
ENV SPRING_PROFILES_ACTIVE=railway
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
