package com.bridgetec.dev6report.config;

import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

@Configuration
@Profile("railway")
public class RailwayDatabaseConfig {

    private static final Logger log = LoggerFactory.getLogger(RailwayDatabaseConfig.class);

    @Bean
    @Primary
    public DataSource dataSource(Environment env) {
        String jdbcUrl = resolveJdbcUrl(env);
        String username = resolveUsername(env);
        log.info("Railway DB 연결: {} (user={})", maskJdbcUrl(jdbcUrl), username);

        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl(jdbcUrl);
        ds.setUsername(username);
        ds.setPassword(resolvePassword(env));
        ds.setConnectionTimeout(20_000);
        ds.setInitializationFailTimeout(30_000);
        ds.setMaximumPoolSize(5);
        return ds;
    }

    private String resolveJdbcUrl(Environment env) {
        String explicit = env.getProperty("SPRING_DATASOURCE_URL");
        if (explicit != null && !explicit.isBlank()) {
            return explicit;
        }

        String databaseUrl = firstNonBlank(
                env.getProperty("DATABASE_PRIVATE_URL"),
                env.getProperty("DATABASE_URL")
        );
        if (databaseUrl != null) {
            URI uri = parseDatabaseUri(databaseUrl);
            return toJdbcUrl(uri, resolveSslMode(env, uri.getHost()));
        }

        String host = required(env, "PGHOST");
        String port = env.getProperty("PGPORT", "5432");
        String database = required(env, "PGDATABASE");
        return "jdbc:postgresql://" + host + ":" + port + "/" + database
                + "?sslmode=" + resolveSslMode(env, host);
    }

    private String resolveUsername(Environment env) {
        if (env.getProperty("PGUSER") != null && !env.getProperty("PGUSER").isBlank()) {
            return env.getProperty("PGUSER");
        }
        String databaseUrl = firstNonBlank(
                env.getProperty("DATABASE_PRIVATE_URL"),
                env.getProperty("DATABASE_URL")
        );
        return parseUserInfo(databaseUrl).username();
    }

    private String resolvePassword(Environment env) {
        if (env.getProperty("PGPASSWORD") != null) {
            return env.getProperty("PGPASSWORD");
        }
        String databaseUrl = firstNonBlank(
                env.getProperty("DATABASE_PRIVATE_URL"),
                env.getProperty("DATABASE_URL")
        );
        return parseUserInfo(databaseUrl).password();
    }

    private static String required(Environment env, String key) {
        String value = env.getProperty(key);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(
                    "Railway DB 설정 누락: " + key + " — PostgreSQL 서비스를 앱에 Variable Reference로 연결하세요.");
        }
        return value;
    }

    private static String resolveSslMode(Environment env, String host) {
        String configured = env.getProperty("PGSSLMODE");
        if (configured != null && !configured.isBlank()) {
            return configured;
        }
        if (host != null && host.contains("railway.internal")) {
            return "disable";
        }
        return "prefer";
    }

    private static String toJdbcUrl(URI uri, String sslMode) {
        StringBuilder jdbc = new StringBuilder("jdbc:postgresql://").append(uri.getHost());
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

    private static URI parseDatabaseUri(String databaseUrl) {
        String normalized = databaseUrl.replace("postgres://", "postgresql://");
        if (!normalized.startsWith("postgresql://")) {
            throw new IllegalStateException("DATABASE_URL 형식이 올바르지 않습니다.");
        }
        return URI.create(normalized);
    }

    private static UserInfo parseUserInfo(String databaseUrl) {
        if (databaseUrl == null || databaseUrl.isBlank()) {
            return new UserInfo("postgres", "");
        }
        URI uri = parseDatabaseUri(databaseUrl);
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

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private static String maskJdbcUrl(String jdbcUrl) {
        return jdbcUrl.replaceAll("://([^:@/]+):([^@/]+)@", "://***:***@");
    }

    private record UserInfo(String username, String password) {}
}
