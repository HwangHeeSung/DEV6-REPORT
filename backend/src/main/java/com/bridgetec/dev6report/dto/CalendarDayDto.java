package com.bridgetec.dev6report.dto;

public record CalendarDayDto(
        String stdYmd,
        String date,
        Integer weekday,
        String weekdayNm,
        boolean holiday,
        String holidayName,
        boolean publicHoliday,
        boolean weekend,
        String weekOfMonth,
        String weekOfYear
) {
}
