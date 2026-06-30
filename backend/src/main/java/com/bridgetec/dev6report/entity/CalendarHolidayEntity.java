package com.bridgetec.dev6report.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;

@Getter
@Setter
@Entity
@Table(name = "calendar_holiday")
@IdClass(CalendarHolidayEntity.Pk.class)
public class CalendarHolidayEntity {

    @Id
    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;

    @Id
    @Column(name = "std_ymd", nullable = false, length = 8)
    private String stdYmd;

    @Column(name = "weekday")
    private Integer weekday;

    @Column(name = "weekday_nm", length = 100)
    private String weekdayNm;

    @Column(name = "holi_yn")
    private Integer holiYn;

    @Column(name = "holi_nm", length = 100)
    private String holiNm;

    @Column(name = "week_start_ymd", length = 8)
    private String weekStartYmd;

    @Column(name = "week_end_ymd", length = 8)
    private String weekEndYmd;

    @Column(name = "week_of_year", length = 2)
    private String weekOfYear;

    @Column(name = "week_of_month", length = 2)
    private String weekOfMonth;

    @Column(name = "ms_month", length = 6)
    private String msMonth;

    @Column(name = "public_holi_yn")
    private Integer publicHoliYn;

    @Getter
    @Setter
    public static class Pk implements Serializable {
        private String tenantId;
        private String stdYmd;
    }
}
