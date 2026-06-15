package com.bridgetec.dev6report.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record WeeklyReportRequest(
        @NotNull Long memberId,
        Integer reportYear,
        Integer reportWeek,
        String accomplishments,
        String nextPlan,
        String issues,
        List<WeeklyReportEntryRequest> entries,
        List<WeeklyReportJiraEntryRequest> jiraEntries,
        Boolean jiraCompleted
) {
}
