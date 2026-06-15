package com.bridgetec.dev6report.dto;

import java.time.LocalDate;

public record CurrentPeriodDto(
        int year,
        int week,
        int month,
        LocalDate weekStartDate,
        LocalDate weekEndDate
) {
}
