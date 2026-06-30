-- 개발6팀 보고 관리 스키마 (PostgreSQL)

CREATE TABLE IF NOT EXISTS member (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    team       VARCHAR(100),
    role       VARCHAR(30)  NOT NULL DEFAULT 'MEMBER',
    email      VARCHAR(200),
    sort_order INT          NOT NULL DEFAULT 999,
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL
);

CREATE TABLE IF NOT EXISTS weekly_report (
    id              BIGSERIAL PRIMARY KEY,
    member_id       BIGINT       NOT NULL REFERENCES member (id),
    report_year     INT          NOT NULL,
    report_week     INT          NOT NULL,
    week_start_date DATE         NOT NULL,
    week_end_date   DATE         NOT NULL,
    accomplishments TEXT,
    next_plan       TEXT,
    issues          TEXT,
    status          VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    submitted_at    TIMESTAMP(6),
    created_at      TIMESTAMP(6) NOT NULL,
    updated_at      TIMESTAMP(6) NOT NULL,
    UNIQUE (member_id, report_year, report_week)
);

CREATE TABLE IF NOT EXISTS monthly_report (
    id           BIGSERIAL PRIMARY KEY,
    member_id    BIGINT       NOT NULL REFERENCES member (id),
    report_year  INT          NOT NULL,
    report_month INT          NOT NULL,
    summary      TEXT,
    achievements TEXT,
    next_plan    TEXT,
    issues       TEXT,
    status       VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    submitted_at TIMESTAMP(6),
    created_at   TIMESTAMP(6) NOT NULL,
    updated_at   TIMESTAMP(6) NOT NULL,
    UNIQUE (member_id, report_year, report_month)
);

INSERT INTO member (name, team, role, email, is_active, created_at, updated_at) VALUES
('황희승', '1파트 (SWAT)', 'MEMBER', NULL, TRUE, NOW(), NOW()),
('팀원2', '1파트 (SWAT)', 'MEMBER', NULL, TRUE, NOW(), NOW()),
('팀원3', '2파트 (ARGO/RSM)', 'MEMBER', NULL, TRUE, NOW(), NOW()),
('부팀장', '1파트 (SWAT)', 'SUB_LEADER', NULL, TRUE, NOW(), NOW());
