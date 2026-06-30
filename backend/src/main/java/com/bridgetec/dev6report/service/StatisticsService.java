package com.bridgetec.dev6report.service;

import com.bridgetec.dev6report.dto.*;
import com.bridgetec.dev6report.entity.MemberEntity;
import com.bridgetec.dev6report.entity.MonthlyReportEntity;
import com.bridgetec.dev6report.entity.WeeklyReportEntity;
import com.bridgetec.dev6report.entity.WeeklyReportEntryEntity;
import com.bridgetec.dev6report.entity.WeeklyReportJiraEntryEntity;
import com.bridgetec.dev6report.repo.MemberRepository;
import com.bridgetec.dev6report.repo.MonthlyReportRepository;
import com.bridgetec.dev6report.repo.WeeklyReportEntryRepository;
import com.bridgetec.dev6report.repo.WeeklyReportJiraEntryRepository;
import com.bridgetec.dev6report.repo.WeeklyReportRepository;
import com.bridgetec.dev6report.util.MemberSortHelper;
import com.bridgetec.dev6report.util.ParticipantMemberIdsHelper;
import com.bridgetec.dev6report.util.PeriodHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.IsoFields;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatisticsService {

    private static final List<String> WORK_TYPE_ORDER = List.of("프로젝트", "유지보수", "제품개발");

    private final MemberRepository memberRepository;
    private final WeeklyReportRepository weeklyReportRepository;
    private final WeeklyReportEntryRepository weeklyReportEntryRepository;
    private final WeeklyReportJiraEntryRepository weeklyReportJiraEntryRepository;
    private final MonthlyReportRepository monthlyReportRepository;

    @Transactional(readOnly = true)
    public List<SubmissionRosterDto> submissionRoster(Integer year, Integer week) {
        CurrentPeriodDto period = PeriodHelper.currentPeriod();
        int targetYear = year != null ? year : period.year();
        int targetWeek = week != null ? week : period.week();

        List<MemberEntity> members = sortedActiveMembers();
        Map<Long, WeeklyReportEntity> reports = weeklyReportRepository
                .findByReportYearAndReportWeekOrderByMemberIdAsc(targetYear, targetWeek).stream()
                .collect(Collectors.toMap(WeeklyReportEntity::getMemberId, r -> r, (a, b) -> a));

        Set<Long> reportIds = reports.values().stream().map(WeeklyReportEntity::getId).collect(Collectors.toSet());
        Set<Long> jiraWrittenReportIds = new HashSet<>();
        if (!reportIds.isEmpty()) {
            for (WeeklyReportJiraEntryEntity entry : weeklyReportJiraEntryRepository.findByWeeklyReportIdIn(reportIds)) {
                if (hasJiraProgress(entry)) {
                    jiraWrittenReportIds.add(entry.getWeeklyReportId());
                }
            }
        }

        return members.stream()
                .filter(m -> Boolean.TRUE.equals(m.getRequiresDev6Report()) || Boolean.TRUE.equals(m.getRequiresJiraReport()))
                .map(m -> {
                    WeeklyReportEntity report = reports.get(m.getId());
                    boolean dev6Submitted = report != null && "SUBMITTED".equals(report.getStatus());
                    boolean jiraDone = report != null && (
                            Boolean.TRUE.equals(report.getJiraCompleted())
                                    || jiraWrittenReportIds.contains(report.getId()));
                    return new SubmissionRosterDto(
                            m.getId(),
                            m.getName(),
                            m.getTeam(),
                            Boolean.TRUE.equals(m.getRequiresDev6Report()),
                            Boolean.TRUE.equals(m.getRequiresJiraReport()),
                            dev6Submitted,
                            jiraDone,
                            report != null ? report.getStatus() : "MISSING",
                            report != null ? report.getSubmittedAt() : null
                    );
                })
                .toList();
    }

    private boolean hasJiraProgress(WeeklyReportJiraEntryEntity entry) {
        if (entry.getProgressNote() == null) {
            return false;
        }
        return !entry.getProgressNote().isBlank();
    }

    @Transactional(readOnly = true)
    public CurrentPeriodDto currentPeriod() {
        return PeriodHelper.currentPeriod();
    }

    /** 주차별 프로젝트 코드 등록 건수 (주간보고 항목 기준) */
    @Transactional(readOnly = true)
    public List<ProjectCodeStatDto> projectCodeStats(Integer year, Integer week) {
        CurrentPeriodDto period = PeriodHelper.currentPeriod();
        int targetYear = year != null ? year : period.year();
        int targetWeek = week != null ? week : period.week();

        Map<Long, MemberEntity> members = memberRepository.findAll().stream()
                .collect(Collectors.toMap(MemberEntity::getId, m -> m, (a, b) -> a));

        Map<String, ProjectCodeAccumulator> accumulators = new LinkedHashMap<>();
        List<WeeklyReportEntity> reports = weeklyReportRepository
                .findByReportYearAndReportWeekOrderByMemberIdAsc(targetYear, targetWeek);

        for (WeeklyReportEntity report : reports) {
            MemberEntity member = members.get(report.getMemberId());
            String memberName = member != null ? member.getName() : "알 수 없음";
            List<WeeklyReportEntryEntity> entries = weeklyReportEntryRepository
                    .findByWeeklyReportIdOrderBySortOrderAscIdAsc(report.getId());
            for (WeeklyReportEntryEntity entry : entries) {
                String key = statKey(entry);
                accumulators.computeIfAbsent(key, k -> ProjectCodeAccumulator.from(entry))
                        .add(memberName, entry.getParticipantMemberIds(), members);
            }
        }

        return accumulators.values().stream()
                .map(ProjectCodeAccumulator::toDto)
                .sorted(Comparator
                        .comparingInt((ProjectCodeStatDto d) -> workTypeOrder(d.workType()))
                        .thenComparing(d -> d.projectCode() != null ? d.projectCode() : "", String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(ProjectCodeStatDto::projectName, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    private String statKey(WeeklyReportEntryEntity entry) {
        String code = entry.getProjectCode() != null ? entry.getProjectCode().trim() : "";
        String name = entry.getProjectName() != null ? entry.getProjectName().trim() : "";
        String workType = entry.getWorkType() != null ? entry.getWorkType().trim() : "프로젝트";
        String line = entry.getProductLine() != null ? entry.getProductLine().trim() : "";
        return code + "|" + name + "|" + workType + "|" + line;
    }

    private int workTypeOrder(String workType) {
        int idx = WORK_TYPE_ORDER.indexOf(workType);
        return idx >= 0 ? idx : WORK_TYPE_ORDER.size();
    }

    private static final class ProjectCodeAccumulator {
        private final String projectCode;
        private final String projectName;
        private final String workType;
        private final String productLine;
        private int entryCount;
        private final LinkedHashSet<String> memberNames = new LinkedHashSet<>();

        private ProjectCodeAccumulator(String projectCode, String projectName, String workType, String productLine) {
            this.projectCode = projectCode;
            this.projectName = projectName;
            this.workType = workType;
            this.productLine = productLine;
        }

        static ProjectCodeAccumulator from(WeeklyReportEntryEntity entry) {
            return new ProjectCodeAccumulator(
                    blankToNull(entry.getProjectCode()),
                    entry.getProjectName(),
                    entry.getWorkType() != null ? entry.getWorkType() : "프로젝트",
                    entry.getProductLine()
            );
        }

        void add(String memberName, String participantMemberIds, Map<Long, MemberEntity> members) {
            entryCount++;
            if (memberName != null && !memberName.isBlank()) {
                memberNames.add(memberName.trim());
            }
            for (String name : ParticipantMemberIdsHelper.resolveNames(participantMemberIds, members)) {
                memberNames.add(name);
            }
        }

        ProjectCodeStatDto toDto() {
            return new ProjectCodeStatDto(
                    projectCode,
                    projectName,
                    workType,
                    productLine,
                    entryCount,
                    memberNames.size(),
                    List.copyOf(memberNames)
            );
        }
    }

    private static String blankToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    @Transactional(readOnly = true)
    public StatisticsOverviewDto overview(Integer year) {
        CurrentPeriodDto period = PeriodHelper.currentPeriod();
        int targetYear = year != null ? year : period.year();
        List<MemberEntity> activeMembers = sortedActiveMembers();
        int memberCount = activeMembers.size();

        List<WeeklyReportEntity> currentWeekReports =
                weeklyReportRepository.findByReportYearAndReportWeekOrderByMemberIdAsc(targetYear, period.week());
        Map<Long, WeeklyReportEntity> weeklyByMember = currentWeekReports.stream()
                .collect(Collectors.toMap(WeeklyReportEntity::getMemberId, r -> r, (a, b) -> a));

        int weeklySubmitted = (int) currentWeekReports.stream().filter(r -> "SUBMITTED".equals(r.getStatus())).count();
        int weeklyDraft = (int) currentWeekReports.stream().filter(r -> "DRAFT".equals(r.getStatus())).count();
        int weeklyMissing = memberCount - currentWeekReports.size();

        List<MonthlyReportEntity> currentMonthReports =
                monthlyReportRepository.findByReportYearAndReportMonthOrderByMemberIdAsc(targetYear, period.month());
        int monthlySubmitted = (int) currentMonthReports.stream().filter(r -> "SUBMITTED".equals(r.getStatus())).count();
        int monthlyDraft = (int) currentMonthReports.stream().filter(r -> "DRAFT".equals(r.getStatus())).count();
        int monthlyMissing = memberCount - currentMonthReports.size();

        List<String> weeklyMissingMembers = activeMembers.stream()
                .filter(m -> !weeklyByMember.containsKey(m.getId()))
                .map(MemberEntity::getName)
                .toList();

        Set<Long> monthlyReportMemberIds = currentMonthReports.stream()
                .map(MonthlyReportEntity::getMemberId)
                .collect(Collectors.toSet());
        List<String> monthlyMissingMembers = activeMembers.stream()
                .filter(m -> !monthlyReportMemberIds.contains(m.getId()))
                .map(MemberEntity::getName)
                .toList();

        int weeksPassed = weeksPassedInYear(targetYear, period);
        int monthsPassed = monthsPassedInYear(targetYear, period);

        List<MemberSubmissionStatDto> memberWeeklyStats = buildMemberWeeklyStats(activeMembers, targetYear, weeksPassed);
        List<MemberSubmissionStatDto> memberMonthlyStats = buildMemberMonthlyStats(activeMembers, targetYear, monthsPassed);
        List<WeeklyTrendDto> weeklyTrend = buildWeeklyTrend(targetYear, memberCount, period.week());
        List<MonthlyTrendDto> monthlyTrend = buildMonthlyTrend(targetYear, memberCount, period.month());

        return new StatisticsOverviewDto(
                targetYear,
                period.week(),
                period.month(),
                memberCount,
                weeklySubmitted,
                weeklyDraft,
                weeklyMissing,
                memberCount == 0 ? 0 : roundRate(weeklySubmitted, memberCount),
                monthlySubmitted,
                monthlyDraft,
                monthlyMissing,
                memberCount == 0 ? 0 : roundRate(monthlySubmitted, memberCount),
                memberWeeklyStats,
                memberMonthlyStats,
                weeklyTrend,
                monthlyTrend,
                weeklyMissingMembers,
                monthlyMissingMembers
        );
    }

    private List<MemberSubmissionStatDto> buildMemberWeeklyStats(List<MemberEntity> members, int year, int weeksPassed) {
        List<WeeklyReportEntity> all = weeklyReportRepository.findByReportYearOrderByReportWeekDescMemberIdAsc(year);
        Map<Long, Long> submittedCounts = all.stream()
                .filter(r -> "SUBMITTED".equals(r.getStatus()))
                .collect(Collectors.groupingBy(WeeklyReportEntity::getMemberId, Collectors.counting()));

        return members.stream()
                .map(m -> {
                    int submitted = submittedCounts.getOrDefault(m.getId(), 0L).intValue();
                    return new MemberSubmissionStatDto(
                            m.getId(), m.getName(), m.getTeam(), submitted, weeksPassed,
                            weeksPassed == 0 ? 0 : roundRate(submitted, weeksPassed)
                    );
                })
                .sorted(Comparator.comparing(MemberSubmissionStatDto::submissionRate).reversed())
                .toList();
    }

    private List<MemberSubmissionStatDto> buildMemberMonthlyStats(List<MemberEntity> members, int year, int monthsPassed) {
        List<MonthlyReportEntity> all = monthlyReportRepository.search(year, null, null);
        Map<Long, Long> submittedCounts = all.stream()
                .filter(r -> "SUBMITTED".equals(r.getStatus()))
                .collect(Collectors.groupingBy(MonthlyReportEntity::getMemberId, Collectors.counting()));

        return members.stream()
                .map(m -> {
                    int submitted = submittedCounts.getOrDefault(m.getId(), 0L).intValue();
                    return new MemberSubmissionStatDto(
                            m.getId(), m.getName(), m.getTeam(), submitted, monthsPassed,
                            monthsPassed == 0 ? 0 : roundRate(submitted, monthsPassed)
                    );
                })
                .sorted(Comparator.comparing(MemberSubmissionStatDto::submissionRate).reversed())
                .toList();
    }

    private List<WeeklyTrendDto> buildWeeklyTrend(int year, int memberCount, int currentWeek) {
        Map<Integer, Long> counts = weeklyReportRepository.countSubmittedByWeek(year).stream()
                .collect(Collectors.toMap(
                        row -> ((Number) row[0]).intValue(),
                        row -> ((Number) row[1]).longValue()
                ));
        int fromWeek = Math.max(1, currentWeek - 11);
        List<WeeklyTrendDto> trend = new ArrayList<>();
        for (int w = fromWeek; w <= currentWeek; w++) {
            trend.add(new WeeklyTrendDto(w, counts.getOrDefault(w, 0L).intValue(), memberCount));
        }
        return trend;
    }

    private List<MonthlyTrendDto> buildMonthlyTrend(int year, int memberCount, int currentMonth) {
        Map<Integer, Long> counts = monthlyReportRepository.countSubmittedByMonth(year).stream()
                .collect(Collectors.toMap(
                        row -> ((Number) row[0]).intValue(),
                        row -> ((Number) row[1]).longValue()
                ));
        int fromMonth = Math.max(1, currentMonth - 5);
        List<MonthlyTrendDto> trend = new ArrayList<>();
        for (int m = fromMonth; m <= currentMonth; m++) {
            trend.add(new MonthlyTrendDto(m, counts.getOrDefault(m, 0L).intValue(), memberCount));
        }
        return trend;
    }

    private int weeksPassedInYear(int year, CurrentPeriodDto period) {
        if (year < LocalDate.now().getYear()) {
            return LocalDate.of(year, 12, 28).get(IsoFields.WEEK_OF_WEEK_BASED_YEAR);
        }
        if (year > LocalDate.now().getYear()) {
            return 0;
        }
        return period.week();
    }

    private int monthsPassedInYear(int year, CurrentPeriodDto period) {
        if (year < LocalDate.now().getYear()) {
            return 12;
        }
        if (year > LocalDate.now().getYear()) {
            return 0;
        }
        return period.month();
    }

    private double roundRate(int numerator, int denominator) {
        if (denominator == 0) return 0;
        return Math.round((numerator * 1000.0) / denominator) / 10.0;
    }

    private List<MemberEntity> sortedActiveMembers() {
        List<MemberEntity> members = new ArrayList<>(memberRepository.findByActiveTrue());
        members.sort(MemberSortHelper.comparator());
        return members;
    }
}
