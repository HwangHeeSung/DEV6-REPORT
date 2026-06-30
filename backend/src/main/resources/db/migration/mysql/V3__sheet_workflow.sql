-- 구글시트(기술본부_개발6팀_주간업무) 워크플로우 반영

ALTER TABLE member
    ADD COLUMN requires_dev6_report TINYINT(1) NOT NULL DEFAULT 1 COMMENT '개발6팀 시트 작성 대상' AFTER jira_username,
    ADD COLUMN requires_jira_report TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'JIRA 진행상황 작성 대상' AFTER requires_dev6_report;

ALTER TABLE project
    ADD COLUMN project_code VARCHAR(50) NULL COMMENT '프로젝트/유지보수 코드 (SO*, SL*)' AFTER name,
    ADD COLUMN work_type VARCHAR(20) NOT NULL DEFAULT '프로젝트' COMMENT '프로젝트, 유지보수' AFTER product_line;

ALTER TABLE weekly_report
    ADD COLUMN jira_completed TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'JIRA 진행상황 작성 완료 여부' AFTER status;

ALTER TABLE weekly_report_entry
    ADD COLUMN project_code VARCHAR(50) NULL COMMENT '프로젝트코드' AFTER project_name,
    ADD COLUMN work_type VARCHAR(20) NULL COMMENT '프로젝트, 유지보수' AFTER project_code,
    ADD COLUMN prev_accomplishments TEXT NULL COMMENT '전주 실적' AFTER product_line;

CREATE TABLE IF NOT EXISTS weekly_report_jira_entry (
    id               BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT 'PK',
    weekly_report_id BIGINT       NOT NULL COMMENT 'FK weekly_report.id',
    issue_key        VARCHAR(30)  NOT NULL COMMENT 'JIRA 이슈 키 (SS-3739)',
    issue_summary    VARCHAR(500) NULL COMMENT '이슈 제목',
    customer         VARCHAR(100) NULL COMMENT '고객사',
    component        VARCHAR(100) NULL COMMENT 'Component (SWAT, ARGO 등)',
    assignee_name    VARCHAR(100) NULL COMMENT 'Assignee 표시명',
    progress_note    VARCHAR(100) NULL COMMENT '진행상황 (15~20자 요약)',
    status           VARCHAR(50)  NULL COMMENT 'JIRA Status',
    CONSTRAINT fk_wrje_report FOREIGN KEY (weekly_report_id) REFERENCES weekly_report (id) ON DELETE CASCADE,
    UNIQUE KEY uq_wrje_report_issue (weekly_report_id, issue_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='주간보고 JIRA 진행상황 (필수-팀원 JIRA 시트)';

-- 작성명부 기준 멤버 시드 (기존 시드 대체)
DELETE FROM member_project;
DELETE FROM weekly_report_jira_entry;
DELETE FROM weekly_report_entry;
DELETE FROM weekly_report;
DELETE FROM monthly_report;
DELETE FROM member;

INSERT INTO member (name, team, role, email, jira_username, requires_dev6_report, requires_jira_report, is_active, created_at, updated_at) VALUES
('이재우', '1파트 (SWAT)', 'MEMBER', NULL, NULL, 1, 1, 1, NOW(6), NOW(6)),
('박시용', '1파트 (SWAT)', 'MEMBER', NULL, NULL, 1, 0, 1, NOW(6), NOW(6)),
('정진우', '1파트 (SWAT)', 'MEMBER', NULL, NULL, 1, 0, 1, NOW(6), NOW(6)),
('장인철', '1파트 (SWAT)', 'MEMBER', NULL, NULL, 1, 1, 1, NOW(6), NOW(6)),
('김형준', '1파트 (SWAT)', 'MEMBER', NULL, NULL, 0, 0, 1, NOW(6), NOW(6)),
('이환호', '1파트 (SWAT)', 'MEMBER', NULL, NULL, 1, 1, 1, NOW(6), NOW(6)),
('박상명', '1파트 (SWAT)', 'MEMBER', NULL, NULL, 1, 0, 1, NOW(6), NOW(6)),
('강대호', '1파트 (SWAT)', 'MEMBER', NULL, NULL, 1, 0, 1, NOW(6), NOW(6)),
('윤건용', '2파트 (ARGO/RSM)', 'MEMBER', NULL, NULL, 1, 1, 1, NOW(6), NOW(6)),
('박영서', '2파트 (ARGO/RSM)', 'MEMBER', NULL, NULL, 1, 1, 1, NOW(6), NOW(6)),
('황희성', '2파트 (ARGO/RSM)', 'MEMBER', NULL, NULL, 1, 1, 1, NOW(6), NOW(6)),
('박진미', '2파트 (ARGO/RSM)', 'MEMBER', NULL, NULL, 1, 1, 1, NOW(6), NOW(6)),
('박천규', '2파트 (ARGO/RSM)', 'MEMBER', NULL, NULL, 1, 1, 1, NOW(6), NOW(6)),
('강준환', '2파트 (ARGO/RSM)', 'MEMBER', NULL, NULL, 1, 1, 1, NOW(6), NOW(6)),
('부팀장', '1파트 (SWAT)', 'SUB_LEADER', NULL, NULL, 0, 0, 1, NOW(6), NOW(6));
