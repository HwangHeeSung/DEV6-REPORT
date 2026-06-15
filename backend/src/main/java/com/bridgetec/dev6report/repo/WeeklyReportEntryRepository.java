package com.bridgetec.dev6report.repo;

import com.bridgetec.dev6report.entity.WeeklyReportEntryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

import java.util.List;

public interface WeeklyReportEntryRepository extends JpaRepository<WeeklyReportEntryEntity, Long> {

    List<WeeklyReportEntryEntity> findByWeeklyReportIdOrderBySortOrderAscIdAsc(Long weeklyReportId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    void deleteByWeeklyReportId(Long weeklyReportId);
}
