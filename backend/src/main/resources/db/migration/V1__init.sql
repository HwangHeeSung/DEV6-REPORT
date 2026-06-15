-- 개발6팀 보고 관리 스키마

CREATE TABLE IF NOT EXISTS member (
    id         BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT 'PK',
    name       VARCHAR(100) NOT NULL COMMENT '이름',
    team       VARCHAR(100) NULL COMMENT '소속 파트 (1파트, 2파트 등)',
    role       VARCHAR(30)  NOT NULL DEFAULT 'MEMBER' COMMENT 'MEMBER, SUB_LEADER, LEADER',
    email      VARCHAR(200) NULL COMMENT '이메일 (보고 알림용)',
    is_active  TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '활성 여부',
    created_at DATETIME(6)  NOT NULL COMMENT '생성 일시',
    updated_at DATETIME(6)  NOT NULL COMMENT '수정 일시'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='개발6팀 멤버';

CREATE TABLE IF NOT EXISTS weekly_report (
    id              BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT 'PK',
    member_id       BIGINT       NOT NULL COMMENT 'FK member.id',
    report_year     INT          NOT NULL COMMENT 'ISO 연도',
    report_week     INT          NOT NULL COMMENT 'ISO 주차',
    week_start_date DATE         NOT NULL COMMENT '주 시작일 (월)',
    week_end_date   DATE         NOT NULL COMMENT '주 종료일 (일)',
    accomplishments TEXT         NULL COMMENT '금주 실적',
    next_plan       TEXT         NULL COMMENT '차주 계획',
    issues          TEXT         NULL COMMENT '특이사항/이슈',
    status          VARCHAR(20)  NOT NULL DEFAULT 'DRAFT' COMMENT 'DRAFT, SUBMITTED',
    submitted_at    DATETIME(6)  NULL COMMENT '제출 일시',
    created_at      DATETIME(6)  NOT NULL COMMENT '생성 일시',
    updated_at      DATETIME(6)  NOT NULL COMMENT '수정 일시',
    CONSTRAINT fk_weekly_member FOREIGN KEY (member_id) REFERENCES member (id),
    UNIQUE KEY uq_weekly_member_period (member_id, report_year, report_week)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='주간 보고';

CREATE TABLE IF NOT EXISTS monthly_report (
    id           BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT 'PK',
    member_id    BIGINT       NOT NULL COMMENT 'FK member.id',
    report_year  INT          NOT NULL COMMENT '연도',
    report_month INT          NOT NULL COMMENT '월 (1-12)',
    summary      TEXT         NULL COMMENT '월간 요약',
    achievements TEXT         NULL COMMENT '주요 성과',
    next_plan    TEXT         NULL COMMENT '차월 계획',
    issues       TEXT         NULL COMMENT '특이사항/이슈',
    status       VARCHAR(20)  NOT NULL DEFAULT 'DRAFT' COMMENT 'DRAFT, SUBMITTED',
    submitted_at DATETIME(6)  NULL COMMENT '제출 일시',
    created_at   DATETIME(6)  NOT NULL COMMENT '생성 일시',
    updated_at   DATETIME(6)  NOT NULL COMMENT '수정 일시',
    CONSTRAINT fk_monthly_member FOREIGN KEY (member_id) REFERENCES member (id),
    UNIQUE KEY uq_monthly_member_period (member_id, report_year, report_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='월간 보고';

-- 시드: 개발6팀 멤버 (이름은 실제 인원에 맞게 수정)
INSERT INTO member (name, team, role, email, is_active, created_at, updated_at) VALUES
('황희승', '1파트 (SWAT)', 'MEMBER', NULL, 1, NOW(6), NOW(6)),
('팀원2', '1파트 (SWAT)', 'MEMBER', NULL, 1, NOW(6), NOW(6)),
('팀원3', '2파트 (ARGO/RSM)', 'MEMBER', NULL, 1, NOW(6), NOW(6)),
('부팀장', '1파트 (SWAT)', 'SUB_LEADER', NULL, 1, NOW(6), NOW(6));
