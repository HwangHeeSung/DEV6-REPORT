-- 프로젝트별 주간보고 + JIRA 연동

ALTER TABLE member
    ADD COLUMN jira_username VARCHAR(100) NULL COMMENT 'Jira assignee 계정 (예: woos798)' AFTER email;

CREATE TABLE IF NOT EXISTS project (
    id           BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT 'PK',
    name         VARCHAR(200) NOT NULL COMMENT '프로젝트명',
    product_line VARCHAR(20)  NOT NULL COMMENT 'SWAT, ARGO, RSM',
    customer     VARCHAR(100) NULL COMMENT '고객사',
    is_active    TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '활성 여부',
    sort_order   INT          NOT NULL DEFAULT 0 COMMENT '표시 순서',
    created_at   DATETIME(6)  NOT NULL COMMENT '생성 일시',
    updated_at   DATETIME(6)  NOT NULL COMMENT '수정 일시'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='투입 프로젝트 (제품군별)';

CREATE TABLE IF NOT EXISTS member_project (
    member_id  BIGINT NOT NULL COMMENT 'FK member.id',
    project_id BIGINT NOT NULL COMMENT 'FK project.id',
    PRIMARY KEY (member_id, project_id),
    CONSTRAINT fk_mp_member FOREIGN KEY (member_id) REFERENCES member (id),
    CONSTRAINT fk_mp_project FOREIGN KEY (project_id) REFERENCES project (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='멤버별 담당 프로젝트';

CREATE TABLE IF NOT EXISTS weekly_report_entry (
    id              BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT 'PK',
    weekly_report_id BIGINT      NOT NULL COMMENT 'FK weekly_report.id',
    project_id      BIGINT       NULL COMMENT 'FK project.id (삭제 시 NULL)',
    project_name    VARCHAR(200) NOT NULL COMMENT '작성 시점 프로젝트명',
    product_line    VARCHAR(20)  NOT NULL COMMENT 'SWAT, ARGO, RSM',
    accomplishments TEXT         NULL COMMENT '금주 실적',
    next_plan       TEXT         NULL COMMENT '차주 계획',
    sort_order      INT          NOT NULL DEFAULT 0 COMMENT '표시 순서',
    CONSTRAINT fk_wre_report FOREIGN KEY (weekly_report_id) REFERENCES weekly_report (id) ON DELETE CASCADE,
    CONSTRAINT fk_wre_project FOREIGN KEY (project_id) REFERENCES project (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='주간보고 프로젝트별 행';

-- 시드 프로젝트 (실제 투입 현황에 맞게 수정)
INSERT INTO project (name, product_line, customer, is_active, sort_order, created_at, updated_at) VALUES
('SWAT 프로젝트 A', 'SWAT', NULL, 1, 1, NOW(6), NOW(6)),
('SWAT 프로젝트 B', 'SWAT', NULL, 1, 2, NOW(6), NOW(6)),
('ARGO 고객사 A', 'ARGO', NULL, 1, 10, NOW(6), NOW(6)),
('ARGO 고객사 B', 'ARGO', NULL, 1, 11, NOW(6), NOW(6)),
('RSM 고객사 A', 'RSM', NULL, 1, 20, NOW(6), NOW(6)),
('RSM 고객사 B', 'RSM', NULL, 1, 21, NOW(6), NOW(6));

-- 멤버 시드 업데이트: 파트·Jira 계정
UPDATE member SET team = '1파트 (SWAT)', jira_username = NULL WHERE team = '1파트';
UPDATE member SET team = '2파트 (ARGO/RSM)', jira_username = NULL WHERE team = '2파트';

-- 멤버-프로젝트 배정 예시 (id 기준 — 시드 순서 가정)
INSERT INTO member_project (member_id, project_id)
SELECT m.id, p.id FROM member m, project p
WHERE m.name = '황희승' AND p.product_line = 'SWAT' LIMIT 1;

INSERT INTO member_project (member_id, project_id)
SELECT m.id, p.id FROM member m, project p
WHERE m.name = '팀원3' AND p.product_line = 'ARGO' LIMIT 1;
