package com.bridgetec.dev6report.service;

import com.bridgetec.dev6report.dto.MonthlyWorkItemDto;
import com.bridgetec.dev6report.entity.ProjectEntity;
import com.bridgetec.dev6report.entity.WeeklyReportEntity;
import com.bridgetec.dev6report.entity.WeeklyReportEntryEntity;
import com.bridgetec.dev6report.repo.ProjectRepository;
import com.bridgetec.dev6report.repo.WeeklyReportEntryRepository;
import com.bridgetec.dev6report.repo.WeeklyReportRepository;
import com.bridgetec.dev6report.util.CustomerNameHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MonthlyWorkItemSuggestionService {

    private final WeeklyReportRepository weeklyReportRepository;
    private final WeeklyReportEntryRepository weeklyReportEntryRepository;
    private final ProjectRepository projectRepository;

    @Transactional(readOnly = true)
    public List<MonthlyWorkItemDto> suggestFromWeeklyReports(Long memberId, int year, int month) {
        if (memberId == null) {
            return List.of();
        }
        LocalDate monthStart = LocalDate.of(year, month, 1);
        LocalDate monthEnd = monthStart.withDayOfMonth(monthStart.lengthOfMonth());

        List<WeeklyReportEntity> reports = weeklyReportRepository.findByMemberOverlappingMonth(
                memberId, monthStart, monthEnd);
        if (reports.isEmpty()) {
            return List.of();
        }

        Map<String, SuggestionAccumulator> byKey = new LinkedHashMap<>();
        int order = 0;

        for (WeeklyReportEntity report : reports) {
            List<WeeklyReportEntryEntity> entries = weeklyReportEntryRepository
                    .findByWeeklyReportIdOrderBySortOrderAscIdAsc(report.getId());
            for (WeeklyReportEntryEntity entry : entries) {
                ProjectEntity project = entry.getProjectId() != null
                        ? projectRepository.findById(entry.getProjectId()).orElse(null)
                        : null;

                String workType = firstNonBlank(
                        entry.getWorkType(),
                        project != null ? project.getWorkType() : null,
                        "프로젝트");
                String clientName = CustomerNameHelper.resolveClientName(
                        project != null ? project.getCustomer() : null,
                        entry.getProjectName(),
                        workType);
                if (clientName.isBlank()) {
                    continue;
                }

                String productLine = normalizeProductLine(
                        entry.getProductLine(),
                        project != null ? project.getProductLine() : null);
                String key = productLine + "\0" + clientName + "\0" + workType;

                int sortOrder = order;
                order++;
                byKey.computeIfAbsent(key, k -> new SuggestionAccumulator(
                        productLine,
                        clientName,
                        workType,
                        entry.getProjectId(),
                        sortOrder
                ));
            }
        }

        List<MonthlyWorkItemDto> result = new ArrayList<>();
        for (SuggestionAccumulator acc : byKey.values()) {
            result.add(new MonthlyWorkItemDto(
                    null,
                    acc.productLine(),
                    acc.clientName(),
                    acc.workType(),
                    "신규",
                    null,
                    null,
                    "진행",
                    null,
                    acc.projectId(),
                    acc.sortOrder(),
                    BigDecimal.ZERO,
                    Map.of()
            ));
        }
        return result;
    }

    private static String normalizeProductLine(String fromEntry, String fromProject) {
        String raw = firstNonBlank(fromEntry, fromProject, "SWAT");
        if ("IPRON CTI".equalsIgnoreCase(raw.trim()) || "오실론".equals(raw.trim())) {
            return "IPRON CTI";
        }
        return raw.trim().toUpperCase();
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return "";
    }

    private record SuggestionAccumulator(
            String productLine,
            String clientName,
            String workType,
            Long projectId,
            int sortOrder
    ) {
    }
}
