package com.bridgetec.dev6report.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "monthly_work_item")
public class MonthlyWorkItemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "monthly_report_id", nullable = false)
    private Long monthlyReportId;

    @Column(name = "product_line", nullable = false, length = 20)
    private String productLine;

    @Column(name = "client_name", length = 100)
    private String clientName;

    @Column(name = "work_type", length = 20)
    private String workType;

    @Column(name = "maintenance_type", length = 20)
    private String maintenanceType;

    @Column(name = "received_date")
    private LocalDate receivedDate;

    @Column(name = "completed_date")
    private LocalDate completedDate;

    @Column(name = "progress_status", length = 20)
    private String progressStatus;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "project_id")
    private Long projectId;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
}
