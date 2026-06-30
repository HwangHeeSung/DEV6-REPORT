-- 코드관리(프로젝트 마스터)용 컬럼 추가
-- 데이터 INSERT는 Flyway가 아니라 scripts/sql/code-management-insert.sql 을 직접 실행

ALTER TABLE project
    ADD COLUMN solution VARCHAR(200) NULL COMMENT '솔루션 (코드관리 시트 원본)' AFTER work_type;

ALTER TABLE project
    MODIFY COLUMN product_line VARCHAR(20) NULL COMMENT 'SWAT, ARGO, RSM, IPRON CTI (유지보수는 주간보고 시 선택)';
