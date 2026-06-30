-- 월간보고 솔루션별 실적 (엑셀 SWAT/ARGO/RSM/오실론 탭)

CREATE TABLE IF NOT EXISTS monthly_work_item (
    id                BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT 'PK',
    monthly_report_id BIGINT       NOT NULL COMMENT 'FK monthly_report.id',
    product_line      VARCHAR(20)  NOT NULL COMMENT 'SWAT, ARGO, RSM, IPRON CTI',
    client_name       VARCHAR(100) NULL COMMENT '고객사',
    work_type         VARCHAR(20)  NULL COMMENT '프로젝트, 유지보수, 제품개발',
    maintenance_type  VARCHAR(20)  NULL COMMENT '신규, 변경, 지원, 장애, 공통',
    received_date     DATE         NULL COMMENT '접수일',
    completed_date    DATE         NULL COMMENT '처리 완료일',
    progress_status   VARCHAR(20)  NULL COMMENT '접수, 진행, 완료',
    description       TEXT         NULL COMMENT '업무명',
    project_id        BIGINT       NULL COMMENT 'FK project.id',
    sort_order        INT          NOT NULL DEFAULT 0 COMMENT '표시 순서',
    CONSTRAINT fk_mwi_report FOREIGN KEY (monthly_report_id) REFERENCES monthly_report (id) ON DELETE CASCADE,
    CONSTRAINT fk_mwi_project FOREIGN KEY (project_id) REFERENCES project (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='월간보고 업무 행';

CREATE TABLE IF NOT EXISTS monthly_work_daily (
    id           BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT 'PK',
    work_item_id BIGINT        NOT NULL COMMENT 'FK monthly_work_item.id',
    work_date    DATE          NOT NULL COMMENT '근무일',
    effort       DECIMAL(2, 1) NOT NULL DEFAULT 0 COMMENT '0, 0.5, 1.0 M/D',
    CONSTRAINT fk_mwd_item FOREIGN KEY (work_item_id) REFERENCES monthly_work_item (id) ON DELETE CASCADE,
    UNIQUE KEY uq_mwd_item_date (work_item_id, work_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='월간보고 일별 공수';

CREATE INDEX idx_mwi_report_line ON monthly_work_item (monthly_report_id, product_line);
