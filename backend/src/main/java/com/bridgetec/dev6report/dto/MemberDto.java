package com.bridgetec.dev6report.dto;

import java.time.Instant;
import java.util.List;

public record MemberDto(
        Long id,
        String name,
        String team,
        String role,
        Integer sortOrder,
        String email,
        String jiraUsername,
        List<String> assignedProductLines,
        boolean requiresDev6Report,
        boolean requiresJiraReport,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {
}
