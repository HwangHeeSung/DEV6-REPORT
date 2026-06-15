package com.bridgetec.dev6report.service;

import com.bridgetec.dev6report.dto.MonthlyReportDto;
import com.bridgetec.dev6report.dto.MonthlyReportRequest;
import com.bridgetec.dev6report.dto.MonthlyWorkItemDto;
import com.bridgetec.dev6report.dto.MonthlyWorkItemRequest;
import com.bridgetec.dev6report.entity.MemberEntity;
import com.bridgetec.dev6report.entity.MonthlyReportEntity;
import com.bridgetec.dev6report.entity.MonthlyWorkDailyEntity;
import com.bridgetec.dev6report.entity.MonthlyWorkItemEntity;
import com.bridgetec.dev6report.repo.MemberRepository;
import com.bridgetec.dev6report.repo.MonthlyReportRepository;
import com.bridgetec.dev6report.repo.MonthlyWorkDailyRepository;
import com.bridgetec.dev6report.repo.MonthlyWorkItemRepository;
import com.bridgetec.dev6report.util.MemberSortHelper;
import com.bridgetec.dev6report.util.PeriodHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MonthlyReportService {

    private static final BigDecimal HALF = new BigDecimal("0.5");
    private static final BigDecimal ONE = BigDecimal.ONE;

    private final MonthlyReportRepository monthlyReportRepository;
    private final MonthlyWorkItemRepository monthlyWorkItemRepository;
    private final MonthlyWorkDailyRepository monthlyWorkDailyRepository;
    private final MemberRepository memberRepository;
    private final MemberService memberService;
    private final MonthlyWorkItemSuggestionService workItemSuggestionService;

    @Transactional(readOnly = true)
    public List<MonthlyReportDto> search(Integer year, Integer month, Long memberId) {
        int targetYear = year != null ? year : PeriodHelper.currentPeriod().year();
        Map<Long, MemberEntity> members = memberRepository.findAll().stream()
                .sorted(MemberSortHelper.comparator())
                .collect(Collectors.toMap(MemberEntity::getId, Function.identity(), (a, b) -> a, LinkedHashMap::new));
        boolean includeWorkItems = memberId != null;
        return monthlyReportRepository.search(targetYear, month, memberId).stream()
                .map(r -> toDto(r, members.get(r.getMemberId()), includeWorkItems))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MonthlyWorkItemDto> suggestWorkItems(Integer year, Integer month, Long memberId) {
        if (memberId == null) {
            return List.of();
        }
        int targetYear = year != null ? year : PeriodHelper.currentPeriod().year();
        int targetMonth = month != null ? month : PeriodHelper.currentPeriod().month();
        memberService.requireActiveMember(memberId);
        return workItemSuggestionService.suggestFromWeeklyReports(memberId, targetYear, targetMonth);
    }

    @Transactional(readOnly = true)
    public MonthlyReportDto get(Long id) {
        MonthlyReportEntity entity = monthlyReportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "월간 보고를 찾을 수 없습니다."));
        MemberEntity member = memberRepository.findById(entity.getMemberId()).orElse(null);
        return toDto(entity, member, true);
    }

    @Transactional
    public MonthlyReportDto create(MonthlyReportRequest request) {
        memberService.requireActiveMember(request.memberId());
        var period = PeriodHelper.currentPeriod();
        int year = request.reportYear() != null ? request.reportYear() : period.year();
        int month = request.reportMonth() != null ? request.reportMonth() : period.month();

        monthlyReportRepository.findByMemberIdAndReportYearAndReportMonth(request.memberId(), year, month)
                .ifPresent(r -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "해당 월 보고가 이미 존재합니다.");
                });

        Instant now = Instant.now();
        MonthlyReportEntity entity = new MonthlyReportEntity();
        entity.setMemberId(request.memberId());
        entity.setReportYear(year);
        entity.setReportMonth(month);
        applyContent(entity, request);
        entity.setStatus("DRAFT");
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        MonthlyReportEntity saved = monthlyReportRepository.save(entity);
        saveWorkItems(saved.getId(), year, month, request.workItems());
        MemberEntity member = memberRepository.findById(request.memberId()).orElse(null);
        return toDto(saved, member, true);
    }

    @Transactional
    public MonthlyReportDto update(Long id, MonthlyReportRequest request) {
        MonthlyReportEntity entity = monthlyReportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "월간 보고를 찾을 수 없습니다."));
        if ("SUBMITTED".equals(entity.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "제출된 보고는 수정할 수 없습니다.");
        }
        applyContent(entity, request);
        entity.setUpdatedAt(Instant.now());
        MonthlyReportEntity saved = monthlyReportRepository.save(entity);
        if (request.workItems() != null) {
            replaceWorkItems(saved.getId(), saved.getReportYear(), saved.getReportMonth(), request.workItems());
        }
        MemberEntity member = memberRepository.findById(entity.getMemberId()).orElse(null);
        return toDto(saved, member, true);
    }

    @Transactional
    public MonthlyReportDto submit(Long id) {
        MonthlyReportEntity entity = monthlyReportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "월간 보고를 찾을 수 없습니다."));
        Instant now = Instant.now();
        entity.setStatus("SUBMITTED");
        entity.setSubmittedAt(now);
        entity.setUpdatedAt(now);
        MemberEntity member = memberRepository.findById(entity.getMemberId()).orElse(null);
        return toDto(monthlyReportRepository.save(entity), member, true);
    }

    @Transactional
    public MonthlyReportDto withdraw(Long id) {
        MonthlyReportEntity entity = monthlyReportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "월간 보고를 찾을 수 없습니다."));
        if (!"SUBMITTED".equals(entity.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "제출된 보고만 취소할 수 있습니다.");
        }
        Instant now = Instant.now();
        entity.setStatus("DRAFT");
        entity.setSubmittedAt(null);
        entity.setUpdatedAt(now);
        MemberEntity member = memberRepository.findById(entity.getMemberId()).orElse(null);
        return toDto(monthlyReportRepository.save(entity), member, true);
    }

    @Transactional
    public void delete(Long id) {
        MonthlyReportEntity entity = monthlyReportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "월간 보고를 찾을 수 없습니다."));
        monthlyReportRepository.delete(entity);
    }

    private void applyContent(MonthlyReportEntity entity, MonthlyReportRequest request) {
        entity.setSummary(trimOrNull(request.summary()));
        entity.setAchievements(trimOrNull(request.achievements()));
        entity.setNextPlan(trimOrNull(request.nextPlan()));
        entity.setIssues(trimOrNull(request.issues()));
    }

    private void saveWorkItems(Long reportId, int year, int month, List<MonthlyWorkItemRequest> items) {
        if (items == null || items.isEmpty()) {
            return;
        }
        validateDailyEffortLimits(items, year, month);
        int order = 0;
        for (MonthlyWorkItemRequest req : items) {
            MonthlyWorkItemEntity item = toItemEntity(reportId, req, order++);
            MonthlyWorkItemEntity saved = monthlyWorkItemRepository.save(item);
            saveDailyEfforts(saved.getId(), year, month, req.dailyEfforts());
        }
    }

    private void replaceWorkItems(Long reportId, int year, int month, List<MonthlyWorkItemRequest> items) {
        List<MonthlyWorkItemEntity> existing = monthlyWorkItemRepository.findByMonthlyReportIdOrderByProductLineAscSortOrderAscIdAsc(reportId);
        if (!existing.isEmpty()) {
            List<Long> itemIds = existing.stream().map(MonthlyWorkItemEntity::getId).toList();
            monthlyWorkDailyRepository.deleteByWorkItemIdIn(itemIds);
            monthlyWorkDailyRepository.flush();
            monthlyWorkItemRepository.deleteByMonthlyReportId(reportId);
            monthlyWorkItemRepository.flush();
        }
        saveWorkItems(reportId, year, month, items);
    }

    private MonthlyWorkItemEntity toItemEntity(Long reportId, MonthlyWorkItemRequest req, int fallbackOrder) {
        MonthlyWorkItemEntity item = new MonthlyWorkItemEntity();
        item.setMonthlyReportId(reportId);
        item.setProductLine(normalizeProductLine(req.productLine()));
        item.setClientName(trimOrNull(req.clientName()));
        item.setWorkType(trimOrNull(req.workType()));
        item.setMaintenanceType(trimOrNull(req.maintenanceType()));
        item.setReceivedDate(req.receivedDate());
        item.setCompletedDate(req.completedDate());
        item.setProgressStatus(trimOrNull(req.progressStatus()));
        item.setDescription(trimOrNull(req.description()));
        item.setProjectId(req.projectId());
        item.setSortOrder(req.sortOrder() != null ? req.sortOrder() : fallbackOrder);
        return item;
    }

    private void saveDailyEfforts(Long workItemId, int year, int month, Map<String, BigDecimal> dailyEfforts) {
        if (dailyEfforts == null || dailyEfforts.isEmpty()) {
            return;
        }
        LocalDate monthStart = LocalDate.of(year, month, 1);
        LocalDate monthEnd = monthStart.withDayOfMonth(monthStart.lengthOfMonth());
        for (Map.Entry<String, BigDecimal> entry : dailyEfforts.entrySet()) {
            BigDecimal effort = normalizeEffort(entry.getValue());
            if (effort.compareTo(BigDecimal.ZERO) == 0) {
                continue;
            }
            LocalDate date = LocalDate.parse(entry.getKey());
            if (date.isBefore(monthStart) || date.isAfter(monthEnd)) {
                continue;
            }
            MonthlyWorkDailyEntity daily = new MonthlyWorkDailyEntity();
            daily.setWorkItemId(workItemId);
            daily.setWorkDate(date);
            daily.setEffort(effort);
            monthlyWorkDailyRepository.save(daily);
        }
    }

    private BigDecimal normalizeEffort(BigDecimal value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value.compareTo(HALF) == 0) {
            return HALF;
        }
        if (value.compareTo(ONE) == 0) {
            return ONE;
        }
        return BigDecimal.ZERO;
    }

    private void validateDailyEffortLimits(List<MonthlyWorkItemRequest> items, int year, int month) {
        if (items == null || items.isEmpty()) {
            return;
        }
        LocalDate monthStart = LocalDate.of(year, month, 1);
        LocalDate monthEnd = monthStart.withDayOfMonth(monthStart.lengthOfMonth());
        Map<String, BigDecimal> totals = new LinkedHashMap<>();

        for (MonthlyWorkItemRequest req : items) {
            if (req.dailyEfforts() == null) {
                continue;
            }
            for (Map.Entry<String, BigDecimal> entry : req.dailyEfforts().entrySet()) {
                BigDecimal effort = normalizeEffort(entry.getValue());
                if (effort.compareTo(BigDecimal.ZERO) == 0) {
                    continue;
                }
                LocalDate date = LocalDate.parse(entry.getKey());
                if (date.isBefore(monthStart) || date.isAfter(monthEnd)) {
                    continue;
                }
                totals.merge(entry.getKey(), effort, BigDecimal::add);
            }
        }

        for (Map.Entry<String, BigDecimal> entry : totals.entrySet()) {
            if (entry.getValue().compareTo(ONE) > 0) {
                int day = LocalDate.parse(entry.getKey()).getDayOfMonth();
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        day + "일 공수 합계가 1.0 M/D를 초과합니다 ("
                                + entry.getValue().stripTrailingZeros().toPlainString() + ").");
            }
        }
    }

    private String normalizeProductLine(String line) {
        if (line == null || line.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "솔루션(제품군)이 필요합니다.");
        }
        if ("IPRON CTI".equalsIgnoreCase(line.trim()) || "오실론".equals(line.trim())) {
            return "IPRON CTI";
        }
        return line.trim().toUpperCase();
    }

    private MonthlyReportDto toDto(MonthlyReportEntity entity, MemberEntity member, boolean includeWorkItems) {
        List<MonthlyWorkItemDto> workItems = includeWorkItems ? loadWorkItems(entity.getId()) : List.of();
        return new MonthlyReportDto(
                entity.getId(),
                entity.getMemberId(),
                member != null ? member.getName() : null,
                member != null ? member.getTeam() : null,
                entity.getReportYear(),
                entity.getReportMonth(),
                entity.getSummary(),
                entity.getAchievements(),
                entity.getNextPlan(),
                entity.getIssues(),
                entity.getStatus(),
                entity.getSubmittedAt(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                workItems
        );
    }

    private List<MonthlyWorkItemDto> loadWorkItems(Long reportId) {
        List<MonthlyWorkItemEntity> items = monthlyWorkItemRepository
                .findByMonthlyReportIdOrderByProductLineAscSortOrderAscIdAsc(reportId);
        if (items.isEmpty()) {
            return List.of();
        }
        List<Long> itemIds = items.stream().map(MonthlyWorkItemEntity::getId).toList();
        Map<Long, List<MonthlyWorkDailyEntity>> dailyByItem = monthlyWorkDailyRepository.findByWorkItemIdIn(itemIds)
                .stream()
                .collect(Collectors.groupingBy(MonthlyWorkDailyEntity::getWorkItemId));

        List<MonthlyWorkItemDto> result = new ArrayList<>();
        for (MonthlyWorkItemEntity item : items) {
            Map<String, BigDecimal> dailyEfforts = new LinkedHashMap<>();
            BigDecimal total = BigDecimal.ZERO;
            for (MonthlyWorkDailyEntity daily : dailyByItem.getOrDefault(item.getId(), List.of())) {
                dailyEfforts.put(daily.getWorkDate().toString(), daily.getEffort());
                total = total.add(daily.getEffort());
            }
            result.add(new MonthlyWorkItemDto(
                    item.getId(),
                    item.getProductLine(),
                    item.getClientName(),
                    item.getWorkType(),
                    item.getMaintenanceType(),
                    item.getReceivedDate(),
                    item.getCompletedDate(),
                    item.getProgressStatus(),
                    item.getDescription(),
                    item.getProjectId(),
                    item.getSortOrder(),
                    total,
                    dailyEfforts
            ));
        }
        return result;
    }

    private String trimOrNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
