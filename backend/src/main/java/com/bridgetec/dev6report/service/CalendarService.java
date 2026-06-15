package com.bridgetec.dev6report.service;

import com.bridgetec.dev6report.config.CalendarProperties;
import com.bridgetec.dev6report.dto.CalendarDayDto;
import com.bridgetec.dev6report.entity.CalendarHolidayEntity;
import com.bridgetec.dev6report.repo.CalendarHolidayRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CalendarService {

    private final CalendarHolidayRepository calendarHolidayRepository;
    private final CalendarProperties calendarProperties;

    @Transactional(readOnly = true)
    public List<CalendarDayDto> days(int year, int month, String tenantId) {
        String tenant = tenantId != null && !tenantId.isBlank()
                ? tenantId.trim()
                : calendarProperties.getDefaultTenantId();
        String msMonth = String.format("%04d%02d", year, month);
        String startYmd = msMonth + "01";
        String endYmd = msMonth + String.format("%02d", java.time.YearMonth.of(year, month).lengthOfMonth());

        List<CalendarHolidayEntity> byMonth = calendarHolidayRepository
                .findByTenantIdAndMsMonthOrderByStdYmdAsc(tenant, msMonth);
        List<CalendarHolidayEntity> entities = !byMonth.isEmpty()
                ? byMonth
                : calendarHolidayRepository.findByTenantIdAndStdYmdBetweenOrderByStdYmdAsc(tenant, startYmd, endYmd);

        return entities.stream().map(this::toDto).toList();
    }

    private CalendarDayDto toDto(CalendarHolidayEntity entity) {
        boolean holiday = isTruthy(entity.getHoliYn()) || isTruthy(entity.getPublicHoliYn());
        boolean weekend = isWeekend(entity);
        String isoDate = toIsoDate(entity.getStdYmd());
        return new CalendarDayDto(
                entity.getStdYmd(),
                isoDate,
                entity.getWeekday(),
                entity.getWeekdayNm(),
                holiday,
                trimOrNull(entity.getHoliNm()),
                isTruthy(entity.getPublicHoliYn()),
                weekend,
                trimOrNull(entity.getWeekOfMonth()),
                trimOrNull(entity.getWeekOfYear())
        );
    }

    private boolean isWeekend(CalendarHolidayEntity entity) {
        if (entity.getWeekdayNm() != null) {
            String nm = entity.getWeekdayNm().trim();
            if ("토".equals(nm) || "일".equals(nm)
                    || nm.endsWith("토요일") || nm.endsWith("일요일")
                    || nm.equalsIgnoreCase("Sat") || nm.equalsIgnoreCase("Sun")) {
                return true;
            }
        }
        Integer wd = entity.getWeekday();
        if (wd == null) {
            return false;
        }
        // ARGO TB_CM_HOLIDAY: 1=일, 2=월, 3=화, 4=수, 5=목, 6=금, 7=토
        return wd == 1 || wd == 7;
    }

    private boolean isTruthy(Number value) {
        return value != null && value.intValue() != 0;
    }

    private String toIsoDate(String ymd) {
        if (ymd == null || ymd.length() != 8) {
            return null;
        }
        return ymd.substring(0, 4) + "-" + ymd.substring(4, 6) + "-" + ymd.substring(6, 8);
    }

    private String trimOrNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
