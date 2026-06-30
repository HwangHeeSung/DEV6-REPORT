package com.bridgetec.dev6report.service;

import com.bridgetec.dev6report.dto.*;
import com.bridgetec.dev6report.entity.*;
import com.bridgetec.dev6report.repo.MemberRepository;
import com.bridgetec.dev6report.repo.ProjectRepository;
import com.bridgetec.dev6report.repo.WeeklyReportEntryRepository;
import com.bridgetec.dev6report.repo.WeeklyReportJiraEntryRepository;
import com.bridgetec.dev6report.repo.WeeklyReportRepository;
import com.bridgetec.dev6report.util.MemberSortHelper;
import com.bridgetec.dev6report.util.ParticipantMemberIdsHelper;
import com.bridgetec.dev6report.util.PeriodHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WeeklyReportService {

    private final WeeklyReportRepository weeklyReportRepository;
    private final WeeklyReportEntryRepository weeklyReportEntryRepository;
    private final WeeklyReportJiraEntryRepository weeklyReportJiraEntryRepository;
    private final MemberRepository memberRepository;
    private final ProjectRepository projectRepository;
    private final MemberService memberService;

    @Transactional(readOnly = true)
    public List<WeeklyReportDto> search(Integer year, Integer week, Long memberId, String productLine) {
        int targetYear = year != null ? year : PeriodHelper.currentPeriod().year();
        Map<Long, MemberEntity> members = memberRepository.findAll().stream()
                .sorted(MemberSortHelper.comparator())
                .collect(Collectors.toMap(MemberEntity::getId, Function.identity(), (a, b) -> a, LinkedHashMap::new));
        return weeklyReportRepository.search(targetYear, week, memberId).stream()
                .map(r -> toDto(r, members.get(r.getMemberId())))
                .filter(dto -> filterByProductLine(dto, productLine))
                .toList();
    }

    @Transactional(readOnly = true)
    public WeeklyReportDto get(Long id) {
        WeeklyReportEntity entity = weeklyReportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "주간 보고를 찾을 수 없습니다."));
        MemberEntity member = memberRepository.findById(entity.getMemberId()).orElse(null);
        return toDto(entity, member);
    }

    @Transactional
    public WeeklyReportDto create(WeeklyReportRequest request) {
        memberService.requireActiveMember(request.memberId());
        var period = PeriodHelper.currentPeriod();
        int year = request.reportYear() != null ? request.reportYear() : period.year();
        int week = request.reportWeek() != null ? request.reportWeek() : period.week();

        weeklyReportRepository.findByMemberIdAndReportYearAndReportWeek(request.memberId(), year, week)
                .ifPresent(r -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "해당 주차 보고가 이미 존재합니다.");
                });

        Instant now = Instant.now();
        WeeklyReportEntity entity = new WeeklyReportEntity();
        entity.setMemberId(request.memberId());
        entity.setReportYear(year);
        entity.setReportWeek(week);
        entity.setWeekStartDate(PeriodHelper.weekStart(year, week));
        entity.setWeekEndDate(PeriodHelper.weekEnd(year, week));
        applyHeader(entity, request);
        entity.setStatus("DRAFT");
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        WeeklyReportEntity saved = weeklyReportRepository.save(entity);
        saveEntries(saved.getId(), request.entries());
        saveJiraEntries(saved.getId(), request.jiraEntries());
        MemberEntity member = memberRepository.findById(request.memberId()).orElse(null);
        return toDto(saved, member);
    }

    @Transactional
    public WeeklyReportDto update(Long id, WeeklyReportRequest request) {
        WeeklyReportEntity entity = weeklyReportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "주간 보고를 찾을 수 없습니다."));
        if ("SUBMITTED".equals(entity.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "제출된 보고는 수정할 수 없습니다.");
        }
        applyHeader(entity, request);
        entity.setUpdatedAt(Instant.now());
        WeeklyReportEntity saved = weeklyReportRepository.save(entity);
        weeklyReportEntryRepository.deleteByWeeklyReportId(saved.getId());
        weeklyReportJiraEntryRepository.deleteByWeeklyReportId(saved.getId());
        weeklyReportEntryRepository.flush();
        weeklyReportJiraEntryRepository.flush();
        saveEntries(saved.getId(), request.entries());
        saveJiraEntries(saved.getId(), request.jiraEntries());
        MemberEntity member = memberRepository.findById(entity.getMemberId()).orElse(null);
        return toDto(saved, member);
    }

    @Transactional
    public WeeklyReportDto submit(Long id) {
        WeeklyReportEntity entity = weeklyReportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "주간 보고를 찾을 수 없습니다."));
        Instant now = Instant.now();
        entity.setStatus("SUBMITTED");
        entity.setSubmittedAt(now);
        entity.setUpdatedAt(now);
        MemberEntity member = memberRepository.findById(entity.getMemberId()).orElse(null);
        return toDto(weeklyReportRepository.save(entity), member);
    }

    @Transactional
    public WeeklyReportDto withdraw(Long id) {
        WeeklyReportEntity entity = weeklyReportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "주간 보고를 찾을 수 없습니다."));
        if (!"SUBMITTED".equals(entity.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "제출된 보고만 취소할 수 있습니다.");
        }
        Instant now = Instant.now();
        entity.setStatus("DRAFT");
        entity.setSubmittedAt(null);
        entity.setUpdatedAt(now);
        MemberEntity member = memberRepository.findById(entity.getMemberId()).orElse(null);
        return toDto(weeklyReportRepository.save(entity), member);
    }

    @Transactional
    public void delete(Long id) {
        WeeklyReportEntity entity = weeklyReportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "주간 보고를 찾을 수 없습니다."));
        weeklyReportRepository.delete(entity);
    }

    private void applyHeader(WeeklyReportEntity entity, WeeklyReportRequest request) {
        entity.setAccomplishments(trimOrNull(request.accomplishments()));
        entity.setNextPlan(trimOrNull(request.nextPlan()));
        entity.setIssues(trimOrNull(request.issues()));
        if (request.jiraCompleted() != null) {
            entity.setJiraCompleted(request.jiraCompleted());
        }
    }

    private void saveEntries(Long reportId, List<WeeklyReportEntryRequest> entries) {
        if (entries == null || entries.isEmpty()) return;
        int order = 0;
        for (WeeklyReportEntryRequest req : entries) {
            WeeklyReportEntryEntity entry = new WeeklyReportEntryEntity();
            entry.setWeeklyReportId(reportId);
            entry.setProjectId(req.projectId());
            entry.setProjectName(resolveProjectName(req));
            entry.setProjectCode(trimOrNull(req.projectCode()));
            entry.setWorkType(trimOrNull(req.workType()));
            entry.setProductLine(req.productLine() != null ? req.productLine().toUpperCase() : "SWAT");
            entry.setPrevAccomplishments(trimOrNull(req.prevAccomplishments()));
            entry.setAccomplishments(trimOrNull(req.accomplishments()));
            entry.setNextPlan(trimOrNull(req.nextPlan()));
            entry.setSortOrder(req.sortOrder() != null ? req.sortOrder() : order++);
            if (req.projectId() != null) {
                projectRepository.findById(req.projectId()).ifPresent(p -> {
                    if (entry.getProjectCode() == null) entry.setProjectCode(p.getProjectCode());
                    if (entry.getWorkType() == null) entry.setWorkType(p.getWorkType());
                });
            }
            if ("프로젝트".equals(entry.getWorkType())) {
                entry.setParticipantMemberIds(ParticipantMemberIdsHelper.serialize(req.participantMemberIds()));
            } else {
                entry.setParticipantMemberIds(null);
            }
            weeklyReportEntryRepository.save(entry);
        }
    }

    private void saveJiraEntries(Long reportId, List<WeeklyReportJiraEntryRequest> entries) {
        if (entries == null || entries.isEmpty()) return;
        for (WeeklyReportJiraEntryRequest req : entries) {
            if (req.issueKey() == null || req.issueKey().isBlank()) continue;
            WeeklyReportJiraEntryEntity entry = new WeeklyReportJiraEntryEntity();
            entry.setWeeklyReportId(reportId);
            entry.setIssueKey(req.issueKey().trim());
            entry.setIssueSummary(trimOrNull(req.issueSummary()));
            entry.setCustomer(trimOrNull(req.customer()));
            entry.setComponent(trimOrNull(req.component()));
            entry.setAssigneeName(trimOrNull(req.assigneeName()));
            entry.setProgressNote(trimProgressNote(req.progressNote()));
            entry.setStatus(trimOrNull(req.status()));
            weeklyReportJiraEntryRepository.save(entry);
        }
    }

    private String resolveProjectName(WeeklyReportEntryRequest req) {
        if (req.projectName() != null && !req.projectName().isBlank()) {
            return req.projectName().trim();
        }
        if (req.projectId() != null) {
            return projectRepository.findById(req.projectId())
                    .map(ProjectEntity::getName)
                    .orElse("프로젝트");
        }
        return "기타";
    }

    private WeeklyReportDto toDto(WeeklyReportEntity entity, MemberEntity member) {
        Map<Long, MemberEntity> memberById = memberRepository.findAll().stream()
                .collect(Collectors.toMap(MemberEntity::getId, Function.identity(), (a, b) -> a));
        List<WeeklyReportEntryDto> entries = weeklyReportEntryRepository
                .findByWeeklyReportIdOrderBySortOrderAscIdAsc(entity.getId()).stream()
                .map(e -> toEntryDto(e, memberById))
                .toList();
        List<WeeklyReportJiraEntryDto> jiraEntries = weeklyReportJiraEntryRepository
                .findByWeeklyReportIdOrderByIssueKeyAsc(entity.getId()).stream()
                .map(e -> new WeeklyReportJiraEntryDto(
                        e.getId(), e.getIssueKey(), e.getIssueSummary(), e.getCustomer(), e.getComponent(),
                        e.getAssigneeName(), e.getProgressNote(), e.getStatus()))
                .toList();
        return new WeeklyReportDto(
                entity.getId(),
                entity.getMemberId(),
                member != null ? member.getName() : null,
                member != null ? member.getTeam() : null,
                entity.getReportYear(),
                entity.getReportWeek(),
                entity.getWeekStartDate(),
                entity.getWeekEndDate(),
                entity.getAccomplishments(),
                entity.getNextPlan(),
                entity.getIssues(),
                entries,
                jiraEntries,
                Boolean.TRUE.equals(entity.getJiraCompleted()),
                entity.getStatus(),
                entity.getSubmittedAt(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private WeeklyReportEntryDto toEntryDto(WeeklyReportEntryEntity e, Map<Long, MemberEntity> memberById) {
        List<Long> participantIds = ParticipantMemberIdsHelper.parse(e.getParticipantMemberIds());
        List<String> participantNames = ParticipantMemberIdsHelper.resolveNames(e.getParticipantMemberIds(), memberById);
        return new WeeklyReportEntryDto(
                e.getId(), e.getProjectId(), e.getProjectName(), e.getProjectCode(), e.getWorkType(),
                e.getProductLine(), e.getPrevAccomplishments(), e.getAccomplishments(), e.getNextPlan(),
                e.getSortOrder(), participantIds, participantNames);
    }

    private boolean filterByProductLine(WeeklyReportDto dto, String productLine) {
        if (productLine == null || productLine.isBlank()) return true;
        String line = productLine.toUpperCase();
        if (dto.entries() == null || dto.entries().isEmpty()) return false;
        return dto.entries().stream().anyMatch(e -> line.equals(e.productLine()));
    }

    private String trimProgressNote(String value) {
        String trimmed = trimOrNull(value);
        if (trimmed != null && trimmed.length() > 100) {
            return trimmed.substring(0, 100);
        }
        return trimmed;
    }

    private String trimOrNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
