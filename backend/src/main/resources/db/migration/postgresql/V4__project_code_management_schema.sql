-- 코드관리(프로젝트 마스터)용 컬럼 추가 (PostgreSQL)

ALTER TABLE project ADD COLUMN IF NOT EXISTS solution VARCHAR(200);
ALTER TABLE project ALTER COLUMN product_line DROP NOT NULL;
