# 개발6팀 보고 관리 (DEV6_REPORT)

개발6팀 주간·월간 보고를 웹에서 등록하고 제출 현황 통계를 확인하는 시스템입니다.

- **[개발자 인수인계 문서](docs/HANDOVER.md)** — 구조, DB, 빌드, `/bt/dev6Report` 배포, 장애 대응

BT Jira Dashboard와 동일한 기술 스택을 사용합니다.

- **프론트엔드**: Create React App + Chakra UI v3 + React Query + Recharts
- **백엔드**: Spring Boot 3.2.5 + JPA + Flyway
- **DB**: MySQL

## 업무 흐름 (기존 Google Sheets / 엑셀 양식 기준)

양식: `기술본부_개발6팀_주간업무_2026(new)_v0.1.xlsx`

### 시트 구성

| 시트 | 작성자 | 역할 |
|------|--------|------|
| 작성명부 | - | 팀원별 개발6팀/JIRA 작성 의무·제출일 추적 |
| (필수-팀원) 개발6팀 | 팀원 | 담당 프로젝트·솔루션별 **전주/금주/차주** 실적 |
| (필수-팀원) JIRA | 팀원 | Assignee 이슈 **진행상황** 요약 (15~20자) |
| (필수) 개발6팀 | 팀장 | 팀 전체 통합 보고 (자동 집계) |
| (팀장작성) 기술본부 등 | 팀장 | 경영회의·기술본부 보고 |

### 팀원 화요일 작업 (웹에서 대체)

1. **개발6팀 시트** — 프로젝트코드·프로젝트명·솔루션(SWAT/ARGO/RSM/IPRON CTI) 단위로 전주/금주/차주 작성
2. **JIRA 시트** — JIRA에서 이슈 상태 업데이트 후, 웹에 진행상황 요약 입력

### 파트 구분

- **1파트**: SWAT 중심
- **2파트**: ARGO, RSM 중심

### 웹 반영 기능

| 화면 | 대상 | 구글시트 대체 |
|------|------|----------------|
| **내 주간보고** | 팀원 | (필수-팀원) 개발6팀 + JIRA — 이름 선택 후 이번 주만 작성 |
| **팀 취합** | 팀장 | (필수) 개발6팀 — 주차별 전체 보고 멤버별/프로젝트별 조회 |
| **통계** | 팀장 | 작성명부 — 누가 제출했는지 한눈에 확인 |

구글시트처럼 **매주 시트를 리셋·복사할 필요 없음** — 주차(년+주)가 자동으로 구분됩니다.

## 주요 기능

| 기능 | 설명 |
|------|------|
| 내 주간보고 | 팀원용 간편 작성 — 이름 기억, 담당 프로젝트 자동 로드, 전주 실적 참고 |
| 팀 취합 | 팀장용 — 이번 주 전체 보고, 미제출자, 프로젝트별 취합 |
| 통계 | 제출률, 작성명부, 추이 차트 |
| 전체 보고 | 관리자용 상세 조회·수정 |
| 프로젝트 코드 | 코드·솔루션 매핑 CRUD (검색·추가·수정·삭제) |
| 설정 | 멤버 관리 |

## 사전 준비

### MySQL (Docker `argo_db_mysql8`)

DB는 아래처럼 생성해 두면 됩니다 (이미 완료하셨다면 생략).

```sql
CREATE DATABASE reportDb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'BTREPORT'@'%' IDENTIFIED WITH mysql_native_password BY 'BTREPORT';
GRANT ALL PRIVILEGES ON reportDb.* TO 'BTREPORT'@'%';
FLUSH PRIVILEGES;
```

이미 사용자를 만든 경우 인증 오류 시:

```sql
ALTER USER 'BTREPORT'@'%' IDENTIFIED WITH mysql_native_password BY 'BTREPORT';
FLUSH PRIVILEGES;
```

백엔드 기본 접속 정보 (BT Dashboard `argo_db_mysql8`과 **동일 서버**):

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `MYSQL_HOST` | 100.100.107.115 | `argo_db_mysql8` 호스트 |
| `MYSQL_PORT` | 3318 | BT Dashboard와 동일 포트 |
| `MYSQL_DATABASE` | reportDb | DB 이름 |
| `MYSQL_USERNAME` | BTREPORT | DB 사용자 |
| `MYSQL_PASSWORD` | BTREPORT | DB 비밀번호 |

> **주의**: PowerShell에 `MYSQL_HOST=localhost`, `MYSQL_PORT=3306`이 남아 있으면  
> `BadAuthenticationPlugin` 오류가 납니다. **`.\run-backend.ps1`로 실행**하세요 (스크립트가 올바른 값으로 덮어씀).  
> IDE에서 직접 실행할 때는 Run Configuration에 `MYSQL_HOST=100.100.107.115`, `MYSQL_PORT=3318`을 넣으세요.

백엔드 **최초 기동** 시 Flyway가 `V1`~`V4` 마이그레이션으로 **테이블·팀원 시드**까지 만듭니다.  
**코드관리(프로젝트 217건) 데이터는 Flyway가 아니라 아래 INSERT SQL을 직접 실행**합니다.

### 코드관리(프로젝트 마스터) 넣기

1. 백엔드 1회 기동 → Flyway **V4**까지 적용 (`solution` 컬럼 추가)
2. `scripts/sql/code-management-insert.sql` 실행

```powershell
# INSERT SQL 생성
node scripts/import-code-management.js
```

생성 기준:
- **코드관리** — 회사 전체 프로젝트 코드 (공식 프로젝트명, 회사 솔루션명)
- **(필수-팀원) 개발6팀** — 개발6팀 투입 코드 + 솔루션(SWAT/ARGO/RSM/IPRON CTI) 매핑
- **미매핑** — 코드관리에만 있고 개발6팀 솔루션이 없는 코드 (`product_line` NULL)

| DB 컬럼 | 출처 |
|---------|------|
| `product_line` | 개발6팀 시트 **솔루션** (없으면 NULL = 미매핑) |
| `solution` | 코드관리 시트 **솔루션** (AiRS, CatchALL-STT 등) |
| `name`, `work_type` | 코드관리 우선, 없으면 개발6팀 시트 |

```powershell
# DB에 직접 넣기 (Docker mysql 등)
# mysql -u root -p reportDb < scripts/sql/code-management-insert.sql
```

생성 파일: `scripts/sql/code-management-insert.sql` (DELETE + INSERT 포함)

> 이미 예전 V4(시드 포함)가 적용된 DB에서 마이그레이션 파일을 바꾸면 **checksum 불일치**가 납니다.  
> 한 번만 실행: `.\scripts\flyway-repair.ps1` (또는 `scripts/sql/flyway-repair-v4-checksum.sql`을 mysql에서 실행)

## 개발 실행

### 1. 백엔드 (포트 8993)

**Java 17** 필요 (Spring Boot 3). PC에 `C:\Program Files\Java\jdk-17` 이 있으면 아래 스크립트가 자동 설정합니다.

Maven 전역 설치 없이 실행 (`mvnw` 포함):

```powershell
cd "C:\Users\Hwang Hee Seoung\git\DEV6_REPORT"
.\run-backend.ps1
```

또는:

```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
cd backend
.\mvnw.cmd spring-boot:run
```

로컬 Docker Desktop 사용 시 (포트가 다를 때):

```powershell
$env:MYSQL_HOST = "localhost"
$env:MYSQL_PORT = "3307"   # docker port argo_db_mysql8 결과
.\run-backend.ps1
```

### 2. 프론트엔드 (포트 3000)

```bash
npm install
npm start
```

개발 시 `src/setupProxy.js`가 `/api` 요청을 `http://localhost:8993`으로 프록시합니다.

## 프로덕션 배포 (단일 JAR)

DEV6_PORTAL과 동일하게 React 빌드 결과를 Spring Boot JAR에 포함합니다.

**반드시 순서:** `npm run build` → `mvn package -Pbundle-frontend`

```powershell
.\scripts\build.ps1
```

또는 수동:

```powershell
npm install
npm run build
cd backend
.\mvnw.cmd clean package -Pbundle-frontend -DskipTests
```

**결과 JAR:** `backend\target\dev6-report-1.0.0.jar`

> `-Pbundle-frontend` 없이 빌드하면 API만 있고 **화면(React)이 JAR에 없습니다.**

### 로컬 JAR 실행

```powershell
.\scripts\run-jar.ps1
```

### Linux 서버 배포 (`/bt/dev6Report`)

| 항목 | 경로 |
|------|------|
| JAR | `/bt/dev6Report/dev6-report-1.0.0.jar` |
| `.env` | `/bt/dev6Report/.env` |
| 기동 스크립트 | `/bt/dev6Report/scripts/dev6-report.sh` |

```bash
# 최초 (Windows에서)
.\scripts\deploy.ps1 -Init -Build

# 갱신
.\scripts\deploy.ps1 -Build

# 서버에서
/bt/dev6Report/scripts/dev6-report.sh start
/bt/dev6Report/scripts/dev6-report.sh stop
/bt/dev6Report/scripts/dev6-report.sh restart
/bt/dev6Report/scripts/dev6-report.sh status
/bt/dev6Report/scripts/dev6-report.sh logs
```

서버 `.env` 예시는 `.env.example` 참고 (`PORT`, `MYSQL_*`, `JIRA_*`).

## API 요약

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/members` | 멤버 목록 |
| POST | `/api/members` | 멤버 추가 |
| GET | `/api/weekly-reports` | 주간 보고 조회 |
| POST | `/api/weekly-reports` | 주간 보고 작성 |
| POST | `/api/weekly-reports/{id}/submit` | 주간 보고 제출 |
| GET | `/api/monthly-reports` | 월간 보고 조회 |
| POST | `/api/monthly-reports` | 월간 보고 작성 |
| GET | `/api/statistics/overview` | 통계 대시보드 |

## 향후 확장 (선택)

- 부팀장 이메일 자동 발송 (현재 Google Drive + 메일 워크플로우 대체)
- 로그인/권한 (팀원 본인 보고만 수정)
- Google Drive 연동 내보내기
