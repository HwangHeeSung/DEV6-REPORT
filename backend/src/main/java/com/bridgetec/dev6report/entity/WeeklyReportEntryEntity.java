package com.bridgetec.dev6report.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "weekly_report_entry")
public class WeeklyReportEntryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "weekly_report_id", nullable = false)
    private Long weeklyReportId;

    @Column(name = "project_id")
    private Long projectId;

    @Column(name = "project_name", nullable = false, length = 200)
    private String projectName;

    @Column(name = "project_code", length = 50)
    private String projectCode;

    @Column(name = "work_type", length = 20)
    private String workType;

    @Column(name = "product_line", nullable = false, length = 20)
    private String productLine;

    @Column(name = "prev_accomplishments", columnDefinition = "TEXT")
    private String prevAccomplishments;

    @Column(columnDefinition = "TEXT")
    private String accomplishments;

    @Column(name = "next_plan", columnDefinition = "TEXT")
    private String nextPlan;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
}
