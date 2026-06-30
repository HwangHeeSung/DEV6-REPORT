package com.bridgetec.dev6report.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;

/**
 * Railway 배포 시 {@code SPRING_PROFILES_ACTIVE} 를 빠뜨려도
 * 사내 MySQL(100.100.107.115)에 연결 시도하지 않도록 railway 프로필을 자동 활성화합니다.
 */
public class RailwayProfileEnvironmentPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String railwayEnv = environment.getProperty("RAILWAY_ENVIRONMENT");
        if (railwayEnv == null || railwayEnv.isBlank()) {
            return;
        }
        for (String profile : environment.getActiveProfiles()) {
            if ("railway".equals(profile)) {
                return;
            }
        }
        environment.addActiveProfile("railway");
    }
}
