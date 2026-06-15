package com.bridgetec.dev6report.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record MemberRequest(
        @NotBlank String name,
        String team,
        String role,
        Integer sortOrder,
        String email,
        String jiraUsername,
        List<String> assignedProductLines,
        Boolean requiresDev6Report,
        Boolean requiresJiraReport,
        Boolean active,
        List<Long> projectIds
) {
}
