package com.bridgetec.dev6report.web;

import com.bridgetec.dev6report.dto.WeeklyReportDto;
import com.bridgetec.dev6report.dto.WeeklyReportRequest;
import com.bridgetec.dev6report.service.WeeklyReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class WeeklyReportController {

    private final WeeklyReportService weeklyReportService;

    @GetMapping("/weekly-reports")
    public List<WeeklyReportDto> search(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer week,
            @RequestParam(required = false) Long memberId,
            @RequestParam(required = false) String productLine) {
        return weeklyReportService.search(year, week, memberId, productLine);
    }

    @GetMapping("/weekly-reports/{id}")
    public WeeklyReportDto get(@PathVariable Long id) {
        return weeklyReportService.get(id);
    }

    @PostMapping("/weekly-reports")
    public WeeklyReportDto create(@Valid @RequestBody WeeklyReportRequest request) {
        return weeklyReportService.create(request);
    }

    @PutMapping("/weekly-reports/{id}")
    public WeeklyReportDto update(@PathVariable Long id, @Valid @RequestBody WeeklyReportRequest request) {
        return weeklyReportService.update(id, request);
    }

    @PostMapping("/weekly-reports/{id}/submit")
    public WeeklyReportDto submit(@PathVariable Long id) {
        return weeklyReportService.submit(id);
    }

    @PostMapping("/weekly-reports/{id}/withdraw")
    public WeeklyReportDto withdraw(@PathVariable Long id) {
        return weeklyReportService.withdraw(id);
    }

    @DeleteMapping("/weekly-reports/{id}")
    public void delete(@PathVariable Long id) {
        weeklyReportService.delete(id);
    }
}
