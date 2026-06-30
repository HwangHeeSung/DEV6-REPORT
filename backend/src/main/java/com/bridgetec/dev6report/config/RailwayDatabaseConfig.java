package com.bridgetec.dev6report.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

@Configuration
@Profile("railway")
public class RailwayDatabaseConfig {

    @Bean
    public DataSource dataSource(Environment env) {
        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl(resolveJdbcUrl(env));
        ds.setUsername(resolveUsername(env));
        ds.setPassword(resolvePassword(env));
        ds.setConnectionTimeout(30_000);
        ds.setInitializationFailTimeout(60_000);
        ds.setMaximumPoolSize(5);
        return ds;
    }

    private String resolveJdbcUrl(Environment env) {
        String explicit = env.getProperty("SPRING_DATASOURCE_URL");
        if (explicit != null && !explicit.isBlank()) {
            return explicit;
        }

        String databaseUrl = env.getProperty("DATABASE_URL");
        if (databaseUrl != null && !databaseUrl.isBlank()) {
            return toJdbcUrl(databaseUrl, env.getProperty("PGSSLMODE", "prefer"));
        }

        String host = required(env, "PGHOST");
        String port = env.getProperty("PGPORT", "5432");
        String database = required(env, "PGDATABASE");
        String sslMode = env.getProperty("PGSSLMODE", "prefer");
        return "jdbc:postgresql://" + host + ":" + port + "/" + database + "?sslmode=" + sslMode;
    }

    private String resolveUsername(Environment env) {
        if (env.getProperty("PGUSER") != null) {
            return env.getProperty("PGUSER");
        }
        return parseUserInfo(env.getProperty("DATABASE_URL")).username();
    }

    private String resolvePassword(Environment env) {
        if (env.getProperty("PGPASSWORD") != null) {
            return env.getProperty("PGPASSWORD");
        }
        return parseUserInfo(env.getProperty("DATABASE_URL")).password();
    }

    private static String required(Environment env, String key) {
        String value = env.getProperty(key);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Railway DB 설정 누락: " + key + " (PostgreSQL 서비스를 앱에 연결하세요)");
        }
        return value;
    }

    private static String toJdbcUrl(String databaseUrl, String sslMode) {
        String normalized = databaseUrl.replace("postgres://", "postgresql://");
        if (!normalized.startsWith("postgresql://")) {
            throw new IllegalStateException("DATABASE_URL 형식이 올바르지 않습니다.");
        }
        URI uri = URI.create(normalized);
        StringBuilder jdbc = new StringBuilder("jdbc:postgresql://")
                .append(uri.getHost());
        if (uri.getPort() > 0) {
            jdbc.append(':').append(uri.getPort());
        }
        String path = uri.getPath();
        if (path != null && !path.isBlank()) {
            jdbc.append(path);
        }
        jdbc.append("?sslmode=").append(sslMode);
        return jdbc.toString();
    }

    private static UserInfo parseUserInfo(String databaseUrl) {
        if (databaseUrl == null || databaseUrl.isBlank()) {
            return new UserInfo("postgres", "");
        }
        String normalized = databaseUrl.replace("postgres://", "postgresql://");
        URI uri = URI.create(normalized);
        String userInfo = uri.getUserInfo();
        if (userInfo == null || userInfo.isBlank()) {
            return new UserInfo("postgres", "");
        }
        int colon = userInfo.indexOf(':');
        if (colon < 0) {
            return new UserInfo(decode(userInfo), "");
        }
        return new UserInfo(decode(userInfo.substring(0, colon)), decode(userInfo.substring(colon + 1)));
    }

    private static String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }

    private record UserInfo(String username, String password) {}
}
