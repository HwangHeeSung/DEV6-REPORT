/**
 * Oracle TB_CM_HOLIDAY export → MySQL calendar_holiday INSERT SQL 생성
 *
 * Usage:
 *   node scripts/import-calendar-holiday.js
 *   node scripts/import-calendar-holiday.js "C:\Users\...\Desktop\TB_CM_HOLIDAY.sql"
 *
 * 출력: scripts/sql/calendar-holiday-insert.sql
 */
const fs = require('fs');
const path = require('path');

const DEFAULT_SQL = path.join(process.env.USERPROFILE || '', 'Desktop', 'TB_CM_HOLIDAY.sql');
const OUT_DIR = path.join(__dirname, 'sql');
const OUT_FILE = path.join(OUT_DIR, 'calendar-holiday-insert.sql');
const BATCH_SIZE = 400;

function esc(value) {
  if (value == null || value === '') return 'NULL';
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
}

function escNum(value) {
  if (value == null || value === '') return 'NULL';
  const n = Number(value);
  return Number.isNaN(n) ? 'NULL' : String(n);
}

function parseOracleValues(line) {
  const m = line.match(/values\s*\((.*)\)\s*;?\s*$/i);
  if (!m) return null;

  const tokens = [];
  let i = 0;
  const s = m[1];

  while (i < s.length) {
    while (i < s.length && (s[i] === ' ' || s[i] === ',')) i += 1;
    if (i >= s.length) break;

    if (s.substring(i, i + 4).toLowerCase() === 'null') {
      tokens.push(null);
      i += 4;
      continue;
    }

    if (s[i] === "'") {
      i += 1;
      let val = '';
      while (i < s.length) {
        if (s[i] === "'" && s[i + 1] === "'") {
          val += "'";
          i += 2;
        } else if (s[i] === "'") {
          i += 1;
          break;
        } else {
          val += s[i];
          i += 1;
        }
      }
      tokens.push(val);
      continue;
    }

    let raw = '';
    while (i < s.length && s[i] !== ',') {
      raw += s[i];
      i += 1;
    }
    tokens.push(raw.trim());
  }

  return tokens;
}

function weekOfMonthFromYmd(stdYmd) {
  const day = parseInt(stdYmd.slice(6, 8), 10);
  if (!day) return null;
  return String(Math.ceil(day / 7));
}

function rowFromTokens(t) {
  if (!t || t.length < 11) return null;

  const tenantId = t[0];
  const stdYmd = t[1];
  if (!tenantId || !stdYmd || stdYmd.length !== 8) return null;

  const msMonth = t[10] || stdYmd.slice(0, 6);
  const weekOfMonth = t[9] || weekOfMonthFromYmd(stdYmd);

  return {
    tenantId,
    stdYmd,
    weekday: t[2],
    weekdayNm: t[3],
    holiYn: t[4],
    holiNm: t[5],
    weekStartYmd: t[6],
    weekEndYmd: t[7],
    weekOfYear: t[8],
    weekOfMonth,
    msMonth,
    publicHoliYn: t[15] ?? null,
  };
}

function toInsertValue(r) {
  return `(${[
    esc(r.tenantId),
    esc(r.stdYmd),
    escNum(r.weekday),
    esc(r.weekdayNm),
    escNum(r.holiYn),
    esc(r.holiNm),
    esc(r.weekStartYmd),
    esc(r.weekEndYmd),
    esc(r.weekOfYear),
    esc(r.weekOfMonth),
    esc(r.msMonth),
    escNum(r.publicHoliYn),
  ].join(', ')})`;
}

function main() {
  const src = process.argv[2] || DEFAULT_SQL;
  if (!fs.existsSync(src)) {
    console.error(`파일 없음: ${src}`);
    process.exit(1);
  }

  const lines = fs.readFileSync(src, 'utf8').split(/\r?\n/);
  const rows = [];
  const seen = new Set();

  for (const line of lines) {
    if (!/Insert into ARGO\.TB_CM_HOLIDAY/i.test(line)) continue;
    const tokens = parseOracleValues(line);
    const row = rowFromTokens(tokens);
    if (!row) continue;
    const key = `${row.tenantId}|${row.stdYmd}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(row);
  }

  rows.sort((a, b) => a.stdYmd.localeCompare(b.stdYmd));

  if (!rows.length) {
    console.error('INSERT 행을 찾지 못했습니다.');
    process.exit(1);
  }

  const tenants = [...new Set(rows.map((r) => r.tenantId))];
  const minYmd = rows[0].stdYmd;
  const maxYmd = rows[rows.length - 1].stdYmd;

  const chunks = [];
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    chunks.push(rows.slice(i, i + BATCH_SIZE));
  }

  const header = `-- TB_CM_HOLIDAY Oracle export → calendar_holiday
-- source: ${src.replace(/\\/g, '/')}
-- rows: ${rows.length}, tenants: ${tenants.join(', ')}, range: ${minYmd} ~ ${maxYmd}
-- generated: ${new Date().toISOString()}

DELETE FROM calendar_holiday WHERE tenant_id IN (${tenants.map((t) => esc(t)).join(', ')});

`;

  const body = chunks.map((batch, idx) => {
    const values = batch.map(toInsertValue).join(',\n  ');
    return `-- batch ${idx + 1}/${chunks.length}
INSERT INTO calendar_holiday (
  tenant_id, std_ymd, weekday, weekday_nm, holi_yn, holi_nm,
  week_start_ymd, week_end_ymd, week_of_year, week_of_month, ms_month, public_holi_yn
) VALUES
  ${values};
`;
  }).join('\n');

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, header + body, 'utf8');

  console.log(`완료: ${rows.length}건 → ${OUT_FILE}`);
  console.log(`테넌트: ${tenants.join(', ')}`);
  console.log(`기간: ${minYmd} ~ ${maxYmd}`);
}

main();
