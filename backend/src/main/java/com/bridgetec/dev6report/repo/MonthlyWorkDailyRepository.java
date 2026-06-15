package com.bridgetec.dev6report.repo;

import com.bridgetec.dev6report.entity.MonthlyWorkDailyEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

import java.util.Collection;
import java.util.List;

public interface MonthlyWorkDailyRepository extends JpaRepository<MonthlyWorkDailyEntity, Long> {

    List<MonthlyWorkDailyEntity> findByWorkItemIdIn(Collection<Long> workItemIds);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    void deleteByWorkItemIdIn(Collection<Long> workItemIds);
}
