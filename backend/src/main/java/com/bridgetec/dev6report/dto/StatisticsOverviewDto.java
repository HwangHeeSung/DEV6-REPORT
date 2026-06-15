package com.bridgetec.dev6report.dto;

import java.util.List;

public record StatisticsOverviewDto(
        int year,
        int currentWeek,
        int currentMonth,
        int activeMemberCount,
        int weeklySubmittedCount,
        int weeklyDraftCount,
        int weeklyMissingCount,
        double weeklySubmissionRate,
        int monthlySubmittedCount,
        int monthlyDraftCount,
        int monthlyMissingCount,
        double monthlySubmissionRate,
        List<MemberSubmissionStatDto> memberWeeklyStats,
        List<MemberSubmissionStatDto> memberMonthlyStats,
        List<WeeklyTrendDto> weeklyTrend,
        List<MonthlyTrendDto> monthlyTrend,
        List<String> weeklyMissingMembers,
        List<String> monthlyMissingMembers
) {
}
