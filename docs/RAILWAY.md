# Railway 배포 가이드

Spring Boot + React 단일 JAR를 Railway에 올리고, PostgreSQL을 붙이는 방법입니다.

## 사전 준비

- [Railway](https://railway.com) 계정 (GitHub 연동)
- 이 저장소 GitHub 푸시 권한
- Jira 계정 (`JIRA_USERNAME`, `JIRA_PASSWORD`)

> **Jira 접근**: Railway 서버(외부 IP)에서 `qa.bridgetec.co.kr/jira` 에 접속되는지 먼저 확인하세요.  
> 사내망 전용이면 Jira 기능만 동작하지 않을 수 있습니다.

## 1. Railway 프로젝트 생성

1. [Railway 대시보드](https://railway.com/dashboard) → **New Project**
2. **Deploy from GitHub repo** → `DEV6_REPORT` 선택
3. 서비스가 생성되면 **Settings → Build** 에서 Dockerfile 빌드 사용 확인  
   (`railway.toml` 이 `Dockerfile` 을 지정함)

## 2. PostgreSQL 추가

1. 프로젝트 화면 → **+ New** → **Database** → **PostgreSQL**
2. Postgres 서비스 → **Connect** → **app 서비스에 연결** (Reference Variable)
3. 앱 서비스 Variables에 아래가 자동 추가됨:
   - `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

## 3. 앱 환경변수 설정

앱 서비스 → **Variables** 에 추가:

| 변수 | 값 |
|------|-----|
| `SPRING_PROFILES_ACTIVE` | `railway` |
| `JIRA_BASE_URL` | `http://qa.bridgetec.co.kr/jira` |
| `JIRA_USERNAME` | (운영 계정) |
| `JIRA_PASSWORD` | (운영 비밀번호) |
| `CALENDAR_TENANT_ID` | `ARGO1` (선택) |

`.env.railway.example` 참고.

## 4. 배포

GitHub에 push 하면 자동 빌드·배포됩니다.

빌드 순서 (Dockerfile):

1. `npm run build` (React)
2. `mvn package -Pbundle-frontend` (JAR에 React 포함)
3. JAR 실행 (`SPRING_PROFILES_ACTIVE=railway`)

최초 기동 시 Flyway가 `db/migration/postgresql` 스키마를 적용하고 팀원 시드를 넣습니다.

## 5. 배포 확인

- Railway → 앱 서비스 → **Settings → Networking** → **Generate Domain**
- 브라우저에서 `https://<your-app>.up.railway.app/` 접속
- API 헬스: `https://<your-app>.up.railway.app/api/statistics/current-period`

## 6. 코드관리(프로젝트 마스터) 데이터

Flyway는 테이블·팀원 시드만 적용합니다. 프로젝트 217건은 별도 INSERT가 필요합니다.

```powershell
# 로컬에서 INSERT SQL 생성
node scripts/import-code-management.js
```

생성된 `scripts/sql/code-management-insert.sql` 을 Railway Postgres에 실행:

1. Postgres 서비스 → **Connect** → **Public Network** (또는 Railway CLI)
2. `psql` 또는 DBeaver로 접속 후 SQL 실행

> MySQL용 INSERT 문이면 Postgres 문법으로 변환이 필요할 수 있습니다.  
> 신규 DB라면 `DELETE FROM project;` 후 Postgres 호환 INSERT를 사용하세요.

## 7. 로컬 vs Railway

| 환경 | DB | 프로필 |
|------|-----|--------|
| 로컬 개발 | MySQL (`application.yml`) | (기본) |
| Railway | PostgreSQL | `railway` (`application-railway.yml`) |

로컬 MySQL 개발 흐름은 기존과 동일합니다 (`.\run-backend.ps1`).

## 8. 비용

- Trial: $5 크레딧 (체험)
- Hobby: **$5/월** (사용량 $5 포함)
- Spring Boot + Postgres 2서비스 → 대략 **$5~10/월**

## 9. 트러블슈팅

### 빌드 실패 (Maven)

- Docker 빌드 로그에서 `mvnw` 오류 확인
- 로컬에서 `.\scripts\build.ps1` 이 성공하는지 먼저 테스트

### DB 연결 실패

- Postgres 서비스가 앱에 **연결(Reference)** 되었는지 확인
- `SPRING_PROFILES_ACTIVE=railway` 설정 확인

### Flyway 오류

- Railway Postgres는 빈 DB에서 시작 → V1~V7 순서 적용
- 수동으로 테이블을 만든 경우 `flyway_schema_history` 확인

### Jira 502/타임아웃

- Railway 외부 IP에서 Jira URL 접근 불가 여부 확인
- 사내망 전용이면 VPN/프록시 또는 VM 배포 유지

## 10. 수동 배포 (CLI, 선택)

```bash
npm i -g @railway/cli
railway login
railway link
railway up
```
