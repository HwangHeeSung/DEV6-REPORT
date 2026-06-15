package com.bridgetec.dev6report.repo;

import com.bridgetec.dev6report.entity.MonthlyReportEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MonthlyReportRepository extends JpaRepository<MonthlyReportEntity, Long> {

    Optional<MonthlyReportEntity> findByMemberIdAndReportYearAndReportMonth(Long memberId, Integer year, Integer month);

    List<MonthlyReportEntity> findByReportYearAndReportMonthOrderByMemberIdAsc(Integer year, Integer month);

    @Query("""
            SELECT r FROM MonthlyReportEntity r
            WHERE r.reportYear = :year
              AND (:month IS NULL OR r.reportMonth = :month)
              AND (:memberId IS NULL OR r.memberId = :memberId)
            ORDER BY r.reportMonth DESC, r.memberId ASC
            """)
    List<MonthlyReportEntity> search(
            @Param("year") Integer year,
            @Param("month") Integer month,
            @Param("memberId") Long memberId);

    long countByReportYearAndReportMonthAndStatus(Integer year, Integer month, String status);

    @Query("""
            SELECT r.reportMonth, COUNT(r)
            FROM MonthlyReportEntity r
            WHERE r.reportYear = :year AND r.status = 'SUBMITTED'
            GROUP BY r.reportMonth
            ORDER BY r.reportMonth
            """)
    List<Object[]> countSubmittedByMonth(@Param("year") Integer year);
}
