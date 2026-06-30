package com.bridgetec.dev6report.dto;

import java.util.List;

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
        int sortOrder,
        List<Long> participantMemberIds,
        List<String> participantMemberNames
) {
}
