package com.bridgetec.dev6report.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "monthly_report")
public class MonthlyReportEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "report_year", nullable = false)
    private Integer reportYear;

    @Column(name = "report_month", nullable = false)
    private Integer reportMonth;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(columnDefinition = "TEXT")
    private String achievements;

    @Column(name = "next_plan", columnDefinition = "TEXT")
    private String nextPlan;

    @Column(columnDefinition = "TEXT")
    private String issues;

    @Column(nullable = false, length = 20)
    private String status = "DRAFT";

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
