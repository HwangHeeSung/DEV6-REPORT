package com.bridgetec.dev6report.dto;

public record MonthlyTrendDto(
        int month,
        int submittedCount,
        int totalMembers
) {
}
