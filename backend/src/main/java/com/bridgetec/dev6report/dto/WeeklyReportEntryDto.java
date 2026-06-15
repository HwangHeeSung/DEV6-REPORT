package com.bridgetec.dev6report.dto;

public record WeeklyReportEntryDto(
        Long id,
        Long projectId,
        String projectName,
        String projectCode,
        String workType,
        String productLine,
        String prevAccomplishments,
        String accomplishments,
        String nextPlan,
        int sortOrder
) {
}
