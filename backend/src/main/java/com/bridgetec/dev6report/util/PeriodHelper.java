package com.bridgetec.dev6report.util;

import com.bridgetec.dev6report.dto.CurrentPeriodDto;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.IsoFields;
import java.time.temporal.TemporalAdjusters;

public final class PeriodHelper {

    private PeriodHelper() {
    }

    public static CurrentPeriodDto currentPeriod() {
        LocalDate today = LocalDate.now();
        int year = today.get(IsoFields.WEEK_BASED_YEAR);
        int week = today.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR);
        LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate weekEnd = weekStart.plusDays(6);
        return new CurrentPeriodDto(year, week, today.getMonthValue(), weekStart, weekEnd);
    }

    public static LocalDate weekStart(int year, int week) {
        return LocalDate.of(year, 1, 4)
                .with(IsoFields.WEEK_OF_WEEK_BASED_YEAR, week)
                .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }

    public static LocalDate weekEnd(int year, int week) {
        return weekStart(year, week).plusDays(6);
    }
}
