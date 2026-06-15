package com.bridgetec.dev6report.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record WeeklyReportDto(
        Long id,
        Long memberId,
        String memberName,
        String memberTeam,
        Integer reportYear,
        Integer reportWeek,
        LocalDate weekStartDate,
        LocalDate weekEndDate,
        String accomplishments,
        String nextPlan,
        String issues,
        List<WeeklyReportEntryDto> entries,
        List<WeeklyReportJiraEntryDto> jiraEntries,
        boolean jiraCompleted,
        String status,
        Instant submittedAt,
        Instant createdAt,
        Instant updatedAt
) {
}
