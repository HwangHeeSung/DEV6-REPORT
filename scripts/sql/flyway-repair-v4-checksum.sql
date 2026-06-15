-- Flyway V4 마이그레이션 파일 변경 후 checksum 불일치 해결
-- (구 V4: 시드+INSERT 포함 → 신 V4: 스키마만)
--
-- docker exec -it argo_db_mysql8 mysql -u root -p reportDb < flyway-repair-v4-checksum.sql

UPDATE flyway_schema_history
SET checksum  = -2060280400,
    script    = 'V4__project_code_management_schema.sql',
    description = 'project code management schema'
WHERE version = '4';

SELECT installed_rank, version, description, script, checksum, success
FROM flyway_schema_history
WHERE version = '4';
