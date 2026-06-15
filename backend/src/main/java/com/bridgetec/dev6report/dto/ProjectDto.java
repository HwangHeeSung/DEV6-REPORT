package com.bridgetec.dev6report.dto;

import java.time.Instant;
import java.util.List;

public record ProjectDto(
        Long id,
        String name,
        String projectCode,
        String productLine,
        String workType,
        String customer,
        String solution,
        boolean active,
        int sortOrder,
        List<Long> memberIds,
        Instant createdAt,
        Instant updatedAt
) {
}
