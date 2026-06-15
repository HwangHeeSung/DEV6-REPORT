package com.bridgetec.dev6report.dto;

public record WeeklyReportJiraEntryRequest(
        String issueKey,
        String issueSummary,
        String customer,
        String component,
        String assigneeName,
        String progressNote,
        String status
) {
}
