-- 컬럼이 이미 있으면 스킵 (재기동·수동 추가 후에도 V8 적용 가능)
SET @exists := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'weekly_report_entry'
      AND COLUMN_NAME = 'participant_member_ids'
);
SET @ddl := IF(
    @exists = 0,
    'ALTER TABLE weekly_report_entry ADD COLUMN participant_member_ids VARCHAR(200) NULL COMMENT ''함께 진행하는 멤버 ID (쉼표구분, 프로젝트 유형)'' AFTER next_plan',
    'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
