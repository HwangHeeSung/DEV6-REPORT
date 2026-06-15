package com.bridgetec.dev6report.dto;

import java.time.Instant;
import java.util.List;

public record MonthlyReportDto(
        Long id,
        Long memberId,
        String memberName,
        String memberTeam,
        Integer reportYear,
        Integer reportMonth,
        String summary,
        String achievements,
        String nextPlan,
        String issues,
        String status,
        Instant submittedAt,
        Instant createdAt,
        Instant updatedAt,
        List<MonthlyWorkItemDto> workItems
) {
}
