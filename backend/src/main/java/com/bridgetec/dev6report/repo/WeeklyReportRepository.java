package com.bridgetec.dev6report.repo;

import com.bridgetec.dev6report.entity.WeeklyReportEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WeeklyReportRepository extends JpaRepository<WeeklyReportEntity, Long> {

    Optional<WeeklyReportEntity> findByMemberIdAndReportYearAndReportWeek(Long memberId, Integer year, Integer week);

    List<WeeklyReportEntity> findByReportYearAndReportWeekOrderByMemberIdAsc(Integer year, Integer week);

    List<WeeklyReportEntity> findByReportYearOrderByReportWeekDescMemberIdAsc(Integer year);

    @Query("""
            SELECT r FROM WeeklyReportEntity r
            WHERE r.reportYear = :year
              AND (:week IS NULL OR r.reportWeek = :week)
              AND (:memberId IS NULL OR r.memberId = :memberId)
            ORDER BY r.reportWeek DESC, r.memberId ASC
            """)
    List<WeeklyReportEntity> search(
            @Param("year") Integer year,
            @Param("week") Integer week,
            @Param("memberId") Long memberId);

    long countByReportYearAndReportWeekAndStatus(Integer year, Integer week, String status);

    @Query("""
            SELECT r.reportWeek, COUNT(r)
            FROM WeeklyReportEntity r
            WHERE r.reportYear = :year AND r.status = 'SUBMITTED'
            GROUP BY r.reportWeek
            ORDER BY r.reportWeek
            """)
    List<Object[]> countSubmittedByWeek(@Param("year") Integer year);

    @Query("""
            SELECT r FROM WeeklyReportEntity r
            WHERE r.memberId = :memberId
              AND r.weekStartDate <= :monthEnd
              AND r.weekEndDate >= :monthStart
            ORDER BY r.reportWeek ASC, r.id ASC
            """)
    List<WeeklyReportEntity> findByMemberOverlappingMonth(
            @Param("memberId") Long memberId,
            @Param("monthStart") java.time.LocalDate monthStart,
            @Param("monthEnd") java.time.LocalDate monthEnd);
}
