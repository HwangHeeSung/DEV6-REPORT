-- ARGO TB_CM_HOLIDAY 동기화용 달력·휴일 (월간보고 일자 표시)

CREATE TABLE IF NOT EXISTS calendar_holiday (
    tenant_id       VARCHAR(50)  NOT NULL COMMENT '테넌트ID (ARGO TENANT_ID)',
    std_ymd         VARCHAR(8)   NOT NULL COMMENT '기준일자 YYYYMMDD',
    weekday         INT          NULL COMMENT '요일코드',
    weekday_nm      VARCHAR(100) NULL COMMENT '요일명',
    holi_yn         TINYINT      NULL COMMENT '휴일여부',
    holi_nm         VARCHAR(100) NULL COMMENT '휴일명',
    week_start_ymd  VARCHAR(8)   NULL COMMENT '주 시작일',
    week_end_ymd    VARCHAR(8)   NULL COMMENT '주 종료일',
    week_of_year    VARCHAR(2)   NULL COMMENT '연기준 주차',
    week_of_month   VARCHAR(2)   NULL COMMENT '월기준 주차',
    ms_month        VARCHAR(6)   NULL COMMENT '기준월 YYYYMM',
    public_holi_yn  TINYINT      NULL COMMENT '공휴일 여부',
    PRIMARY KEY (tenant_id, std_ymd),
    KEY idx_calendar_ms_month (tenant_id, ms_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='달력 휴일 (ARGO TB_CM_HOLIDAY 동기화)';
