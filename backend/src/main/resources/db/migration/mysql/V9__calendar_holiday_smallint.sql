-- JPA(Short/SMALLINT)와 맞추기 — MySQL V7은 TINYINT 로 생성됨
ALTER TABLE calendar_holiday
    MODIFY COLUMN holi_yn SMALLINT NULL COMMENT '휴일여부',
    MODIFY COLUMN public_holi_yn SMALLINT NULL COMMENT '공휴일 여부';
