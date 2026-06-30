-- 팀원별 담당 솔루션 (PostgreSQL)

ALTER TABLE member ADD COLUMN IF NOT EXISTS assigned_product_lines VARCHAR(200);

UPDATE member SET assigned_product_lines = 'SWAT' WHERE team LIKE '%1파트%';
UPDATE member SET assigned_product_lines = 'ARGO,RSM' WHERE team LIKE '%2파트%';
