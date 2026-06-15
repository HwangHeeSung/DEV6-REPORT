package com.bridgetec.dev6report.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "monthly_work_daily")
public class MonthlyWorkDailyEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "work_item_id", nullable = false)
    private Long workItemId;

    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    @Column(nullable = false, precision = 2, scale = 1)
    private BigDecimal effort = BigDecimal.ZERO;
}
