-- 구글시트 워크플로우 반영 (PostgreSQL)

ALTER TABLE member ADD COLUMN IF NOT EXISTS requires_dev6_report BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE member ADD COLUMN IF NOT EXISTS requires_jira_report BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE project ADD COLUMN IF NOT EXISTS project_code VARCHAR(50);
ALTER TABLE project ADD COLUMN IF NOT EXISTS work_type VARCHAR(20) NOT NULL DEFAULT '프로젝트';

ALTER TABLE weekly_report ADD COLUMN IF NOT EXISTS jira_completed BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE weekly_report_entry ADD COLUMN IF NOT EXISTS project_code VARCHAR(50);
ALTER TABLE weekly_report_entry ADD COLUMN IF NOT EXISTS work_type VARCHAR(20);
ALTER TABLE weekly_report_entry ADD COLUMN IF NOT EXISTS prev_accomplishments TEXT;

CREATE TABLE IF NOT EXISTS weekly_report_jira_entry (
    id               BIGSERIAL PRIMARY KEY,
    weekly_report_id BIGINT       NOT NULL REFERENCES weekly_report (id) ON DELETE CASCADE,
    issue_key        VARCHAR(30)  NOT NULL,
    issue_summary    VARCHAR(500),
    customer         VARCHAR(100),
    component        VARCHAR(100),
    assignee_name    VARCHAR(100),
    progress_note    VARCHAR(100),
    status           VARCHAR(50),
    UNIQUE (weekly_report_id, issue_key)
);

DELETE FROM member_project;
DELETE FROM weekly_report_jira_entry;
DELETE FROM weekly_report_entry;
DELETE FROM weekly_report;
DELETE FROM monthly_report;
DELETE FROM member;

INSERT INTO member (name, team, role, email, jira_username, requires_dev6_report, requires_jira_report, is_active, created_at, updated_at) VALUES
('이재우', '1파트 (SWAT)', 'MEMBER', NULL, NULL, TRUE, TRUE, TRUE, NOW(), NOW()),
('박시용', '1파트 (SWAT)', 'MEMBER', NULL, NULL, TRUE, FALSE, TRUE, NOW(), NOW()),
('정진우', '1파트 (SWAT)', 'MEMBER', NULL, NULL, TRUE, FALSE, TRUE, NOW(), NOW()),
('장인철', '1파트 (SWAT)', 'MEMBER', NULL, NULL, TRUE, TRUE, TRUE, NOW(), NOW()),
('김형준', '1파트 (SWAT)', 'MEMBER', NULL, NULL, FALSE, FALSE, TRUE, NOW(), NOW()),
('이환호', '1파트 (SWAT)', 'MEMBER', NULL, NULL, TRUE, TRUE, TRUE, NOW(), NOW()),
('박상명', '1파트 (SWAT)', 'MEMBER', NULL, NULL, TRUE, FALSE, TRUE, NOW(), NOW()),
('강대호', '1파트 (SWAT)', 'MEMBER', NULL, NULL, TRUE, FALSE, TRUE, NOW(), NOW()),
('윤건용', '2파트 (ARGO/RSM)', 'MEMBER', NULL, NULL, TRUE, TRUE, TRUE, NOW(), NOW()),
('박영서', '2파트 (ARGO/RSM)', 'MEMBER', NULL, NULL, TRUE, TRUE, TRUE, NOW(), NOW()),
('황희성', '2파트 (ARGO/RSM)', 'MEMBER', NULL, NULL, TRUE, TRUE, TRUE, NOW(), NOW()),
('박진미', '2파트 (ARGO/RSM)', 'MEMBER', NULL, NULL, TRUE, TRUE, TRUE, NOW(), NOW()),
('박천규', '2파트 (ARGO/RSM)', 'MEMBER', NULL, NULL, TRUE, TRUE, TRUE, NOW(), NOW()),
('강준환', '2파트 (ARGO/RSM)', 'MEMBER', NULL, NULL, TRUE, TRUE, TRUE, NOW(), NOW()),
('부팀장', '1파트 (SWAT)', 'SUB_LEADER', NULL, NULL, FALSE, FALSE, TRUE, NOW(), NOW());
