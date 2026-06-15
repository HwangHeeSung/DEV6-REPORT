package com.bridgetec.dev6report.repo;

import com.bridgetec.dev6report.entity.WeeklyReportJiraEntryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

import java.util.Collection;
import java.util.List;

public interface WeeklyReportJiraEntryRepository extends JpaRepository<WeeklyReportJiraEntryEntity, Long> {

    List<WeeklyReportJiraEntryEntity> findByWeeklyReportIdOrderByIssueKeyAsc(Long weeklyReportId);

    List<WeeklyReportJiraEntryEntity> findByWeeklyReportIdIn(Collection<Long> weeklyReportIds);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    void deleteByWeeklyReportId(Long weeklyReportId);
}
