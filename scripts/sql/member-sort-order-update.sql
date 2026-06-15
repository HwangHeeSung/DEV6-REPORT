-- member.sort_order 연차 순번 (Flyway 미사용, 수동 1회 실행)
-- 컬럼이 없을 때만 아래 ALTER 실행 (이미 있으면 스킵)
--
-- ALTER TABLE member
--     ADD COLUMN sort_order INT NOT NULL DEFAULT 999 COMMENT '파트 내 연차 순번 (낮을수록 선배)' AFTER role;

-- V3 시드 기준 1파트·2파트 연차 순서
UPDATE member SET sort_order = 1 WHERE name = '이재우';
UPDATE member SET sort_order = 2 WHERE name = '박시용';
UPDATE member SET sort_order = 3 WHERE name = '정진우';
UPDATE member SET sort_order = 4 WHERE name = '장인철';
UPDATE member SET sort_order = 5 WHERE name = '김형준';
UPDATE member SET sort_order = 6 WHERE name = '이환호';
UPDATE member SET sort_order = 7 WHERE name = '박상명';
UPDATE member SET sort_order = 8 WHERE name = '강대호';

UPDATE member SET sort_order = 1 WHERE name = '윤건용';
UPDATE member SET sort_order = 2 WHERE name = '박영서';
UPDATE member SET sort_order = 3 WHERE name = '황희성';
UPDATE member SET sort_order = 4 WHERE name = '박진미';
UPDATE member SET sort_order = 5 WHERE name = '박천규';
UPDATE member SET sort_order = 6 WHERE name = '강준환';
