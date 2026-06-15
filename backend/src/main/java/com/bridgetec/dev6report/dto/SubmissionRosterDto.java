package com.bridgetec.dev6report.dto;

import java.time.Instant;

/** 작성명부 — 멤버별 주간 제출 현황 */
public record SubmissionRosterDto(
        Long memberId,
        String memberName,
        String team,
        boolean requiresDev6Report,
        boolean requiresJiraReport,
        boolean dev6Submitted,
        boolean jiraCompleted,
        String weeklyStatus,
        Instant submittedAt
) {
}
