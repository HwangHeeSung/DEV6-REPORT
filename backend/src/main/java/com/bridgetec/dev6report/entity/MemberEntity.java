package com.bridgetec.dev6report.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "member")
public class MemberEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 100)
    private String team;

    @Column(nullable = false, length = 30)
    private String role = "MEMBER";

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 999;

    @Column(length = 200)
    private String email;

    @Column(name = "jira_username", length = 100)
    private String jiraUsername;

    @Column(name = "assigned_product_lines", length = 200)
    private String assignedProductLines;

    @Column(name = "requires_dev6_report", nullable = false)
    private Boolean requiresDev6Report = true;

    @Column(name = "requires_jira_report", nullable = false)
    private Boolean requiresJiraReport = true;

    @Column(name = "is_active", nullable = false)
    private Boolean active = true;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
