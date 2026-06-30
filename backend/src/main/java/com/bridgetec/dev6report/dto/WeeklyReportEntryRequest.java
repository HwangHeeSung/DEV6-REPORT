package com.bridgetec.dev6report.dto;

import java.util.List;

public record WeeklyReportEntryRequest(
        Long projectId,
        String projectName,
        String projectCode,
        String workType,
        String productLine,
        String prevAccomplishments,
        String accomplishments,
        String nextPlan,
        Integer sortOrder,
        List<Long> participantMemberIds
) {
}
