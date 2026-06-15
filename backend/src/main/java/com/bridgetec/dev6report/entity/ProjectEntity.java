package com.bridgetec.dev6report.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "project")
public class ProjectEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "project_code", length = 50)
    private String projectCode;

    @Column(name = "product_line", length = 20)
    private String productLine;

    @Column(name = "work_type", nullable = false, length = 20)
    private String workType = "프로젝트";

    @Column(length = 100)
    private String customer;

    @Column(length = 200)
    private String solution;

    @Column(name = "is_active", nullable = false)
    private Boolean active = true;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
