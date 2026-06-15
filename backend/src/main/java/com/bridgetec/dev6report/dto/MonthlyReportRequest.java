package com.bridgetec.dev6report.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record MonthlyReportRequest(
        @NotNull Long memberId,
        Integer reportYear,
        @Min(1) @Max(12) Integer reportMonth,
        String summary,
        String achievements,
        String nextPlan,
        String issues,
        List<MonthlyWorkItemRequest> workItems
) {
}
