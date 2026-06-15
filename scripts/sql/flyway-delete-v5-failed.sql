-- V5 Flyway 실패 기록 제거 (Duplicate column 등으로 V5가 중단된 경우)
-- mysql reportDb < flyway-delete-v5-failed.sql

DELETE FROM flyway_schema_history WHERE version = '5';

SELECT installed_rank, version, description, script, success
FROM flyway_schema_history
ORDER BY installed_rank;
