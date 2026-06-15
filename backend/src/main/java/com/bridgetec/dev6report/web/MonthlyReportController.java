package com.bridgetec.dev6report.web;

import com.bridgetec.dev6report.dto.MonthlyReportDto;
import com.bridgetec.dev6report.dto.MonthlyReportRequest;
import com.bridgetec.dev6report.dto.MonthlyWorkItemDto;
import com.bridgetec.dev6report.service.MonthlyReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MonthlyReportController {

    private final MonthlyReportService monthlyReportService;

    @GetMapping("/monthly-reports")
    public List<MonthlyReportDto> search(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Long memberId) {
        return monthlyReportService.search(year, month, memberId);
    }

    @GetMapping("/monthly-reports/work-item-suggestions")
    public List<MonthlyWorkItemDto> suggestWorkItems(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam Long memberId) {
        return monthlyReportService.suggestWorkItems(year, month, memberId);
    }

    @GetMapping("/monthly-reports/{id}")
    public MonthlyReportDto get(@PathVariable Long id) {
        return monthlyReportService.get(id);
    }

    @PostMapping("/monthly-reports")
    public MonthlyReportDto create(@Valid @RequestBody MonthlyReportRequest request) {
        return monthlyReportService.create(request);
    }

    @PutMapping("/monthly-reports/{id}")
    public MonthlyReportDto update(@PathVariable Long id, @Valid @RequestBody MonthlyReportRequest request) {
        return monthlyReportService.update(id, request);
    }

    @PostMapping("/monthly-reports/{id}/submit")
    public MonthlyReportDto submit(@PathVariable Long id) {
        return monthlyReportService.submit(id);
    }

    @PostMapping("/monthly-reports/{id}/withdraw")
    public MonthlyReportDto withdraw(@PathVariable Long id) {
        return monthlyReportService.withdraw(id);
    }

    @DeleteMapping("/monthly-reports/{id}")
    public void delete(@PathVariable Long id) {
        monthlyReportService.delete(id);
    }
}
