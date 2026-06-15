-- 팀원별 담당 솔루션 (1파트: SWAT·IPRON CTI / 2파트: ARGO·RSM)
ALTER TABLE member
    ADD COLUMN assigned_product_lines VARCHAR(200) NULL COMMENT '담당 솔루션(쉼표구분)' AFTER jira_username;

UPDATE member SET assigned_product_lines = 'SWAT' WHERE team LIKE '%1파트%';
UPDATE member SET assigned_product_lines = 'ARGO,RSM' WHERE team LIKE '%2파트%';
