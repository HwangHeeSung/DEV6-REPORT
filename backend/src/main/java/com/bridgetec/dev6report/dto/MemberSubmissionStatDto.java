package com.bridgetec.dev6report.dto;

public record MemberSubmissionStatDto(
        Long memberId,
        String memberName,
        String team,
        int submittedCount,
        int totalPeriods,
        double submissionRate
) {
}
