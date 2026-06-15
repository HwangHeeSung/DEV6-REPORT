package com.bridgetec.dev6report.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

public record MonthlyWorkItemDto(
        Long id,
        String productLine,
        String clientName,
        String workType,
        String maintenanceType,
        LocalDate receivedDate,
        LocalDate completedDate,
        String progressStatus,
        String description,
        Long projectId,
        Integer sortOrder,
        BigDecimal totalEffort,
        Map<String, BigDecimal> dailyEfforts
) {
}
