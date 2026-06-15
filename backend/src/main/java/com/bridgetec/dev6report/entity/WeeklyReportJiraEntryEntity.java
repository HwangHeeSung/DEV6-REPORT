package com.bridgetec.dev6report.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "weekly_report_jira_entry")
public class WeeklyReportJiraEntryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "weekly_report_id", nullable = false)
    private Long weeklyReportId;

    @Column(name = "issue_key", nullable = false, length = 30)
    private String issueKey;

    @Column(name = "issue_summary", length = 500)
    private String issueSummary;

    @Column(length = 100)
    private String customer;

    @Column(length = 100)
    private String component;

    @Column(name = "assignee_name", length = 100)
    private String assigneeName;

    @Column(name = "progress_note", length = 100)
    private String progressNote;

    @Column(length = 50)
    private String status;
}
