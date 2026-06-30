-- 프로젝트별 주간보고 + JIRA 연동 (PostgreSQL)

ALTER TABLE member ADD COLUMN IF NOT EXISTS jira_username VARCHAR(100);

CREATE TABLE IF NOT EXISTS project (
    id           BIGSERIAL PRIMARY KEY,
    name         VARCHAR(200) NOT NULL,
    product_line VARCHAR(20)  NOT NULL,
    customer     VARCHAR(100),
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    sort_order   INT          NOT NULL DEFAULT 0,
    created_at   TIMESTAMP(6) NOT NULL,
    updated_at   TIMESTAMP(6) NOT NULL
);

CREATE TABLE IF NOT EXISTS member_project (
    member_id  BIGINT NOT NULL REFERENCES member (id),
    project_id BIGINT NOT NULL REFERENCES project (id),
    PRIMARY KEY (member_id, project_id)
);

CREATE TABLE IF NOT EXISTS weekly_report_entry (
    id               BIGSERIAL PRIMARY KEY,
    weekly_report_id BIGINT       NOT NULL REFERENCES weekly_report (id) ON DELETE CASCADE,
    project_id       BIGINT       REFERENCES project (id) ON DELETE SET NULL,
    project_name     VARCHAR(200) NOT NULL,
    product_line     VARCHAR(20)  NOT NULL,
    accomplishments  TEXT,
    next_plan        TEXT,
    sort_order       INT          NOT NULL DEFAULT 0
);

INSERT INTO project (name, product_line, customer, is_active, sort_order, created_at, updated_at) VALUES
('SWAT 프로젝트 A', 'SWAT', NULL, TRUE, 1, NOW(), NOW()),
('SWAT 프로젝트 B', 'SWAT', NULL, TRUE, 2, NOW(), NOW()),
('ARGO 고객사 A', 'ARGO', NULL, TRUE, 10, NOW(), NOW()),
('ARGO 고객사 B', 'ARGO', NULL, TRUE, 11, NOW(), NOW()),
('RSM 고객사 A', 'RSM', NULL, TRUE, 20, NOW(), NOW()),
('RSM 고객사 B', 'RSM', NULL, TRUE, 21, NOW(), NOW());

UPDATE member SET team = '1파트 (SWAT)', jira_username = NULL WHERE team = '1파트';
UPDATE member SET team = '2파트 (ARGO/RSM)', jira_username = NULL WHERE team = '2파트';

INSERT INTO member_project (member_id, project_id)
SELECT m.id, p.id FROM member m, project p
WHERE m.name = '황희승' AND p.product_line = 'SWAT' LIMIT 1;

INSERT INTO member_project (member_id, project_id)
SELECT m.id, p.id FROM member m, project p
WHERE m.name = '팀원3' AND p.product_line = 'ARGO' LIMIT 1;
