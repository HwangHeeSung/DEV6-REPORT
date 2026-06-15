const WORK_TYPE_ORDER = ['프로젝트', '유지보수', '제품개발'];
const SECTION_LINE = '=======================================';

/** weekStartDate(YYYY-MM-DD) 기준 해당 월 N주차 (월요일 시작) */
export function formatKoreanMonthWeek(weekStartDate) {
  if (!weekStartDate) return '';
  const [y, m, d] = weekStartDate.split('-').map(Number);
  if (!y || !m || !d) return '';
  const first = new Date(y, m - 1, 1);
  const mondayOffset = first.getDay() === 0 ? 6 : first.getDay() - 1;
  const weekIndex = Math.ceil((d + mondayOffset) / 7);
  return `${m}월 ${weekIndex}주차`;
}

function formatProjectTitle(entry) {
  const name = (entry.projectName || '').trim();
  if (!name) return '';
  if (entry.workType === '유지보수') {
    return /^\[.+\]/.test(name) ? name : `[${name}]`;
  }
  return name;
}

function formatNextPlanLine(nextPlan) {
  const text = (nextPlan || '').trim();
  return `= ${text || 'N/A'}`;
}

function formatAccomplishments(entry) {
  const text = (entry.accomplishments || '').trim();
  const line = (entry.productLine || '').trim();
  if (!text) {
    return line ? `○ ${line}` : '';
  }
  if (line && !text.startsWith('○')) {
    return `○ ${line}\n${text}`;
  }
  return text;
}

function groupEntriesByWorkType(entries) {
  const groups = new Map();
  for (const entry of entries) {
    const type = entry.workType || '프로젝트';
    if (!groups.has(type)) groups.set(type, []);
    groups.get(type).push(entry);
  }
  const ordered = [];
  for (const type of WORK_TYPE_ORDER) {
    if (groups.has(type)) ordered.push([type, groups.get(type)]);
  }
  for (const [type, list] of groups) {
    if (!WORK_TYPE_ORDER.includes(type)) ordered.push([type, list]);
  }
  return ordered;
}

function formatEntryBlock(entry) {
  const parts = [];
  const title = formatProjectTitle(entry);
  if (title) parts.push(title);
  const accomplishments = formatAccomplishments(entry);
  if (accomplishments) parts.push(accomplishments);
  parts.push(formatNextPlanLine(entry.nextPlan));
  return parts.join('\n\n');
}

function formatBody(entries) {
  const groups = groupEntriesByWorkType(entries);
  if (!groups.length) return '';

  return groups.map(([workType, list]) => {
    const sectionHeader = [
      SECTION_LINE,
      `[${workType}]`,
      SECTION_LINE,
    ].join('\n');
    const blocks = list.map(formatEntryBlock).join('\n\n');
    return `${sectionHeader}\n${blocks}`;
  }).join('\n\n');
}

/** 주간보고 제출용 메일 본문 생성 */
export function formatWeeklyReportMail({ memberName, weekStartDate, entries = [] }) {
  const name = (memberName || '').trim() || '팀원';
  const monthWeek = formatKoreanMonthWeek(weekStartDate);

  const header = [
    '안녕하십니까.',
    '',
    `개발 6팀 ${name}입니다.`,
    '',
    monthWeek ? `${monthWeek} 주간 보고 공유드립니다.` : '주간 보고 공유드립니다.',
    '',
    '감사합니다.',
    '',
    `[${name}]`,
    '',
  ].join('\n');

  const body = formatBody(entries);
  return body ? `${header}\n${body}` : header.trimEnd();
}
