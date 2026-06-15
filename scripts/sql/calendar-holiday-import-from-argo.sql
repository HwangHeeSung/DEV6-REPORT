-- ARGO.TB_CM_HOLIDAY → reportDb.calendar_holiday 동기화
--
-- Oracle SQL Developer 등에서 export 한 TB_CM_HOLIDAY.sql 이 있으면:
--   node scripts/import-calendar-holiday.js "C:\Users\...\Desktop\TB_CM_HOLIDAY.sql"
-- → scripts/sql/calendar-holiday-insert.sql 생성 후 MySQL에서 실행
--
-- 기본 테넌트: ARGO1 (application.yml calendar.default-tenant-id)

-- 예: 특정 월 전체 삭제 후 재적재
-- DELETE FROM calendar_holiday WHERE tenant_id = 'BRIDGETEC' AND ms_month = '202606';

-- INSERT 예시 (컬럼 매핑)
-- INSERT INTO calendar_holiday (
--   tenant_id, std_ymd, weekday, weekday_nm, holi_yn, holi_nm,
--   week_start_ymd, week_end_ymd, week_of_year, week_of_month, ms_month, public_holi_yn
-- ) VALUES
-- ('BRIDGETEC', '20260601', 1, '월', 0, NULL, '20260601', '20260607', '23', '1', '202606', 0),
-- ('BRIDGETEC', '20260606', 6, '토', 1, '현충일', '20260601', '20260607', '23', '1', '202606', 1);

-- Oracle에서 MySQL로 일괄 추출 (SQL*Plus / SQL Developer 결과를 가공)
/*
SELECT
  TENANT_ID,
  STD_YMD,
  WEEKDAY,
  WEEKDAY_NM,
  HOLI_YN,
  HOLI_NM,
  WEEK_START_YMD,
  WEEK_END_YMD,
  WEEK_OF_YEAR,
  WEEK_OF_MONTH,
  MS_MONTH,
  PUBLIC_HOLI_YN
FROM ARGO.TB_CM_HOLIDAY
WHERE TENANT_ID = 'BRIDGETEC'
  AND MS_MONTH = '202606'
ORDER BY STD_YMD;
*/
