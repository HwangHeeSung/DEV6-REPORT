/**
 * 엑셀 → 수동 실행용 INSERT SQL 생성
 *
 * - 코드관리: 회사 전체 프로젝트 코드 마스터
 * - (필수-팀원) 개발6팀: 개발6팀 투입 코드 + 솔루션(SWAT/ARGO/RSM/IPRON CTI) 매핑
 *
 * project 테이블 INSERT:
 *   · 개발6팀 탭 기준 매핑 코드 (product_line = SWAT/ARGO/RSM/IPRON CTI)
 *   · 코드관리에만 있는 미매핑 코드 (product_line NULL)
 * 코드관리에서 공식 프로젝트명·회사 솔루션(AiRS, CatchALL 등)을 보강합니다.
 *
 * Usage:
 *   node scripts/import-code-management.js
 *   node scripts/import-code-management.js "C:\path\to\기술본부_개발6팀_주간업무_2026(new)_v0.1.xlsx"
 *
 * 출력: scripts/sql/code-management-insert.sql
 */
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const DEFAULT_XLSX = path.join(
  process.env.USERPROFILE || '',
  'Desktop',
  '기술본부_개발6팀_주간업무_2026(new)_v0.1.xlsx'
);

const SHEET_CODE_MASTER = '코드관리';
const SHEET_DEV6 = '(필수-팀원) 개발6팀';

const OUT_DIR = path.join(__dirname, 'sql');
const OUT_FILE = path.join(OUT_DIR, 'code-management-insert.sql');

function extractCustomer(name, workType) {
  if (workType === '유지보수') {
    return String(name).trim() || null;
  }
  const m = String(name).match(/^\[([^\]]+)\]/);
  return m ? m[1] : null;
}

function esc(value) {
  if (value == null || value === '') {
    return 'NULL';
  }
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
}

function loadCodeMaster(wb) {
  const sheet = wb.Sheets[SHEET_CODE_MASTER];
  if (!sheet) {
    throw new Error(`"${SHEET_CODE_MASTER}" 시트를 찾을 수 없습니다.`);
  }
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const map = new Map();
  for (const row of data.slice(2)) {
    const code = String(row[1] || '').trim();
    if (!code || code === '코드') {
      continue;
    }
    map.set(code, {
      workType: String(row[0] || '').trim(),
      name: String(row[2] || '').trim(),
      solution: String(row[4] || '').trim() || null,
    });
  }
  return map;
}

function loadDev6Projects(wb, codeMaster) {
  const sheet = wb.Sheets[SHEET_DEV6];
  if (!sheet) {
    throw new Error(`"${SHEET_DEV6}" 시트를 찾을 수 없습니다.`);
  }
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const records = [];
  const warnings = [];

  data.slice(2).forEach((row, index) => {
    const code = String(row[1] || '').trim();
    const productLine = String(row[6] || '').trim();
    if (!code || !productLine) {
      return;
    }

    const dev6Name = String(row[2] || '').trim();
    const dev6WorkType = String(row[0] || '').trim();
    const master = codeMaster.get(code);

    if (!master) {
      warnings.push(`코드관리에 없음: ${code} (${productLine})`);
    }

    const workType = master?.workType || dev6WorkType || '프로젝트';
    const name = master?.name || dev6Name;
    const companySolution = master?.solution || null;

    records.push({
      workType,
      code,
      name,
      productLine,
      customer: extractCustomer(name, workType),
      solution: companySolution,
      sortOrder: records.length + 1,
    });
  });

  return { records, warnings };
}

/** 코드관리에만 있고 개발6팀 솔루션(SWAT/ARGO/RSM) 미매핑 항목 */
function loadUnmappedFromMaster(codeMaster, dev6Codes) {
  const records = [];
  for (const [code, master] of codeMaster) {
    if (dev6Codes.has(code)) {
      continue;
    }
    const workType = master.workType || '프로젝트';
    const name = master.name;
    records.push({
      workType,
      code,
      name,
      productLine: null,
      customer: extractCustomer(name, workType),
      solution: master.solution,
    });
  }
  return records;
}

function main() {
  const xlsxPath = process.argv[2] || DEFAULT_XLSX;
  if (!fs.existsSync(xlsxPath)) {
    console.error('파일 없음:', xlsxPath);
    process.exit(1);
  }

  const wb = XLSX.readFile(xlsxPath);
  const codeMaster = loadCodeMaster(wb);
  const { records: mappedRecords, warnings } = loadDev6Projects(wb, codeMaster);
  const dev6Codes = new Set(mappedRecords.map((r) => r.code));
  const unmappedRecords = loadUnmappedFromMaster(codeMaster, dev6Codes);
  const records = [
    ...mappedRecords.map((r, i) => ({ ...r, sortOrder: i + 1 })),
    ...unmappedRecords.map((r, i) => ({ ...r, sortOrder: mappedRecords.length + i + 1 })),
  ];

  const values = records
    .map(
      (r) =>
        `(${esc(r.name)}, ${esc(r.code)}, ${esc(r.productLine)}, ${esc(r.workType)}, ${esc(r.customer)}, ${esc(r.solution)}, ${r.sortOrder}, NOW(6), NOW(6))`
    )
    .join(',\n');

  const sql = `-- 개발6팀 프로젝트 INSERT (${records.length}건) — 수동 실행용
-- 원본: 기술본부_개발6팀_주간업무_2026(new)_v0.1.xlsx
--   · 코드관리        → 회사 전체 프로젝트 코드 마스터 (프로젝트명, 회사 솔루션)
--   · (필수-팀원) 개발6팀 → 개발6팀 투입 코드 + 솔루션(SWAT/ARGO/RSM/IPRON CTI) 매핑
--   · 미매핑 ${unmappedRecords.length}건 = 코드관리에만 있고 개발6팀 솔루션 없음 (product_line NULL)
-- 재생성: node scripts/import-code-management.js
--
-- 컬럼 매핑:
--   product_line = 개발6팀 시트 "솔루션" (SWAT, ARGO, RSM, IPRON CTI) — 없으면 NULL
--   solution     = 코드관리 시트 "솔루션" (AiRS, CatchALL-STT 등 회사 솔루션명)
--
-- 사전 조건: Flyway V4 (solution 컬럼) 적용 완료

DELETE FROM member_project;
DELETE FROM project;

INSERT INTO project (name, project_code, product_line, work_type, customer, solution, sort_order, created_at, updated_at) VALUES
${values};
`;

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, sql, 'utf8');

  const byWorkType = records.reduce((acc, r) => {
    acc[r.workType] = (acc[r.workType] || 0) + 1;
    return acc;
  }, {});
  const byLine = records.reduce((acc, r) => {
    acc[r.productLine] = (acc[r.productLine] || 0) + 1;
    return acc;
  }, {});

  console.log(`Wrote ${records.length} rows → ${OUT_FILE}`);
  console.log('코드관리 마스터:', codeMaster.size, '건');
  console.log('개발6팀 매핑:', mappedRecords.length, '건');
  console.log('미매핑(코드관리만):', unmappedRecords.length, '건');
  console.log('by workType:', byWorkType);
  console.log('by product_line:', byLine);
  if (warnings.length) {
    console.log('warnings:', warnings.length);
    warnings.forEach((w) => console.log('  -', w));
  }
}

main();
