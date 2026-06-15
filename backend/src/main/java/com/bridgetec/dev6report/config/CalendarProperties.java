package com.bridgetec.dev6report.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "calendar")
public class CalendarProperties {

    /** ARGO TB_CM_HOLIDAY TENANT_ID 기본값 */
    private String defaultTenantId = "BRIDGETEC";
}
