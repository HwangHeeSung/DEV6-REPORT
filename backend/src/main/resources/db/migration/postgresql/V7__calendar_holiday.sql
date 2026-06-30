-- ARGO TB_CM_HOLIDAY 동기화용 달력·휴일 (PostgreSQL)

CREATE TABLE IF NOT EXISTS calendar_holiday (
    tenant_id       VARCHAR(50)  NOT NULL,
    std_ymd         VARCHAR(8)   NOT NULL,
    weekday         INT,
    weekday_nm      VARCHAR(100),
    holi_yn         SMALLINT,
    holi_nm         VARCHAR(100),
    week_start_ymd  VARCHAR(8),
    week_end_ymd    VARCHAR(8),
    week_of_year    VARCHAR(2),
    week_of_month   VARCHAR(2),
    ms_month        VARCHAR(6),
    public_holi_yn  SMALLINT,
    PRIMARY KEY (tenant_id, std_ymd)
);

CREATE INDEX IF NOT EXISTS idx_calendar_ms_month ON calendar_holiday (tenant_id, ms_month);
