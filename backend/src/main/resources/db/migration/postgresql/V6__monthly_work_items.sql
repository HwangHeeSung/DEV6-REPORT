-- 월간보고 솔루션별 실적 (PostgreSQL)

CREATE TABLE IF NOT EXISTS monthly_work_item (
    id                BIGSERIAL PRIMARY KEY,
    monthly_report_id BIGINT       NOT NULL REFERENCES monthly_report (id) ON DELETE CASCADE,
    product_line      VARCHAR(20)  NOT NULL,
    client_name       VARCHAR(100),
    work_type         VARCHAR(20),
    maintenance_type  VARCHAR(20),
    received_date     DATE,
    completed_date    DATE,
    progress_status   VARCHAR(20),
    description       TEXT,
    project_id        BIGINT       REFERENCES project (id) ON DELETE SET NULL,
    sort_order        INT          NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS monthly_work_daily (
    id           BIGSERIAL PRIMARY KEY,
    work_item_id BIGINT        NOT NULL REFERENCES monthly_work_item (id) ON DELETE CASCADE,
    work_date    DATE          NOT NULL,
    effort       DECIMAL(2, 1) NOT NULL DEFAULT 0,
    UNIQUE (work_item_id, work_date)
);

CREATE INDEX IF NOT EXISTS idx_mwi_report_line ON monthly_work_item (monthly_report_id, product_line);
