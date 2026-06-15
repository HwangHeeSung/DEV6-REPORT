package com.bridgetec.dev6report.dto;

public record WeeklyTrendDto(
        int week,
        int submittedCount,
        int totalMembers
) {
}
