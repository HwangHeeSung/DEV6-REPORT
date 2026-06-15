package com.bridgetec.dev6report.web;

import com.bridgetec.dev6report.dto.CalendarDayDto;
import com.bridgetec.dev6report.service.CalendarService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
public class CalendarController {

    private final CalendarService calendarService;

    @GetMapping("/days")
    public List<CalendarDayDto> days(
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam(required = false) String tenantId) {
        return calendarService.days(year, month, tenantId);
    }
}
