package com.bridgetec.dev6report.web;

import com.bridgetec.dev6report.dto.CurrentPeriodDto;
import com.bridgetec.dev6report.dto.ProjectCodeStatDto;
import com.bridgetec.dev6report.dto.StatisticsOverviewDto;
import com.bridgetec.dev6report.dto.SubmissionRosterDto;
import com.bridgetec.dev6report.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;

    @GetMapping("/statistics/current-period")
    public CurrentPeriodDto currentPeriod() {
        return statisticsService.currentPeriod();
    }

    @GetMapping("/statistics/overview")
    public StatisticsOverviewDto overview(@RequestParam(required = false) Integer year) {
        return statisticsService.overview(year);
    }

    /** 작성명부 — 멤버별 개발6팀/JIRA 제출 현황 */
    @GetMapping("/statistics/submission-roster")
    public List<SubmissionRosterDto> submissionRoster(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer week) {
        return statisticsService.submissionRoster(year, week);
    }

    /** 프로젝트 코드별 주간보고 등록 건수 */
    @GetMapping("/statistics/project-codes")
    public List<ProjectCodeStatDto> projectCodeStats(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer week) {
        return statisticsService.projectCodeStats(year, week);
    }
}
