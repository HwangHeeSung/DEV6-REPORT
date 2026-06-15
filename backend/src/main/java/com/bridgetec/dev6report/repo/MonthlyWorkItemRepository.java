package com.bridgetec.dev6report.repo;

import com.bridgetec.dev6report.entity.MonthlyWorkItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

import java.util.List;

public interface MonthlyWorkItemRepository extends JpaRepository<MonthlyWorkItemEntity, Long> {

    List<MonthlyWorkItemEntity> findByMonthlyReportIdOrderByProductLineAscSortOrderAscIdAsc(Long monthlyReportId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    void deleteByMonthlyReportId(Long monthlyReportId);
}
