package com.bridgetec.dev6report.repo;

import com.bridgetec.dev6report.entity.CalendarHolidayEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CalendarHolidayRepository extends JpaRepository<CalendarHolidayEntity, CalendarHolidayEntity.Pk> {

    List<CalendarHolidayEntity> findByTenantIdAndMsMonthOrderByStdYmdAsc(String tenantId, String msMonth);

    List<CalendarHolidayEntity> findByTenantIdAndStdYmdBetweenOrderByStdYmdAsc(
            String tenantId, String startYmd, String endYmd);
}
