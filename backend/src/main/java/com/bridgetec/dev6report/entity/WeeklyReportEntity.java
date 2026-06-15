package com.bridgetec.dev6report.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "weekly_report")
public class WeeklyReportEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "report_year", nullable = false)
    private Integer reportYear;

    @Column(name = "report_week", nullable = false)
    private Integer reportWeek;

    @Column(name = "week_start_date", nullable = false)
    private LocalDate weekStartDate;

    @Column(name = "week_end_date", nullable = false)
    private LocalDate weekEndDate;

    @Column(columnDefinition = "TEXT")
    private String accomplishments;

    @Column(name = "next_plan", columnDefinition = "TEXT")
    private String nextPlan;

    @Column(columnDefinition = "TEXT")
    private String issues;

    @Column(nullable = false, length = 20)
    private String status = "DRAFT";

    @Column(name = "jira_completed", nullable = false)
    private Boolean jiraCompleted = false;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
