package com.bridgetec.dev6report.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;

@Getter
@Setter
@Entity
@Table(name = "member_project")
@IdClass(MemberProjectEntity.Pk.class)
public class MemberProjectEntity {

    @Id
    @Column(name = "member_id")
    private Long memberId;

    @Id
    @Column(name = "project_id")
    private Long projectId;

    @Getter
    @Setter
    public static class Pk implements Serializable {
        private Long memberId;
        private Long projectId;
    }
}
