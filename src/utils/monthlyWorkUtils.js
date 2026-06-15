export const MONTHLY_WORK_TYPES = ['프로젝트', '유지보수', '제품개발'];
export const MONTHLY_MAINTENANCE_TYPES = ['신규', '변경', '지원', '장애', '공통'];
export const MONTHLY_PROGRESS_STATUSES = ['접수', '진행', '완료'];

export function solutionTabLabel(productLine) {
  if (productLine === 'IPRON CTI') return '오실론';
  return productLine;
}

export function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

/** 엑셀처럼 1일부터 7일 단위 주차 (달력 데이터 없을 때) */
export function monthWeeks(year, month) {
  const last = daysInMonth(year, month);
  const weeks = [];
  for (let start = 1; start <= last; start += 7) {
    const days = [];
    for (let d = start; d < start + 7 && d <= last; d += 1) days.push(d);
    weeks.push({ label: `${month}월${weeks.length + 1}주`, days });
  }
  return weeks;
}

/** ARGO 달력(TB_CM_HOLIDAY) 기준 월기준 주차 그룹 */
export function monthWeeksFromCalendar(calendarDays, year, month) {
  if (!calendarDays?.length) return monthWeeks(year, month);

  const hasWeekOfMonth = calendarDays.some((d) => d.weekOfMonth);
  if (!hasWeekOfMonth) return monthWeeks(year, month);

  const byWeek = new Map();
  for (const day of calendarDays) {
    const weekKey = day.weekOfMonth || weekOfMonthFromDate(day.date || day.stdYmd);
    if (!byWeek.has(weekKey)) byWeek.set(weekKey, []);
    const d = parseInt(day.stdYmd?.slice(6, 8) || day.date?.slice(8, 10), 10);
    if (d) byWeek.get(weekKey).push(d);
  }

  const weeks = [...byWeek.entries()]
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([weekOfMonth, days]) => ({
      label: `${month}월${Number(weekOfMonth)}주`,
      days: [...days].sort((a, b) => a - b),
    }))
    .filter((w) => w.days.length > 0);

  return weeks.length ? weeks : monthWeeks(year, month);
}

function weekOfMonthFromDate(dateOrYmd) {
  const src = dateOrYmd || '';
  const day = src.includes('-')
    ? parseInt(src.slice(8, 10), 10)
    : parseInt(src.slice(6, 8), 10);
  if (!day) return '1';
  return String(Math.ceil(day / 7));
}

export function calendarDayMap(calendarDays = []) {
  return Object.fromEntries(
    calendarDays
      .filter((d) => d.date)
      .map((d) => [d.date, d])
  );
}

export function dayHeaderClass(dayInfo) {
  if (!dayInfo) return '';
  if (dayInfo.holiday || dayInfo.publicHoliday) return 'is-holiday';
  if (dayInfo.weekend) return 'is-weekend';
  return '';
}

export function dayHeaderTitle(day, dayInfo) {
  if (!dayInfo) return `${day}일`;
  const parts = [`${day}일`];
  if (dayInfo.weekdayNm) parts.push(dayInfo.weekdayNm);
  if (dayInfo.holidayName) parts.push(dayInfo.holidayName);
  else if (dayInfo.holiday) parts.push('휴일');
  return parts.join(' · ');
}

export function dateKey(year, month, day) {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export function cycleEffort(current) {
  const v = Number(current) || 0;
  if (v === 0) return 0.5;
  if (v === 0.5) return 1;
  return 0;
}

export function effortSymbol(effort) {
  const v = Number(effort) || 0;
  if (v === 0.5) return '○';
  if (v === 1) return '●';
  return '';
}

export function sumDailyEfforts(dailyEfforts = {}) {
  return Object.values(dailyEfforts).reduce((sum, v) => sum + (Number(v) || 0), 0);
}

/** 업무 행 전체 기준 일자별 공수 합계 */
export function dailyEffortTotals(workItems = []) {
  const totals = {};
  for (const item of workItems) {
    for (const [dk, v] of Object.entries(item.dailyEfforts || {})) {
      const effort = Number(v) || 0;
      if (effort > 0) {
        totals[dk] = (totals[dk] || 0) + effort;
      }
    }
  }
  return totals;
}

/** 일자별 합계 1.0 M/D 초과 여부 — 오류 메시지 또는 null */
export function validateDailyEffortLimits(workItems = []) {
  const totals = dailyEffortTotals(workItems);
  for (const [dk, total] of Object.entries(totals)) {
    if (total > 1.0001) {
      const day = Number(dk.slice(8, 10));
      return `${day}일 공수 합계가 1.0 M/D를 초과합니다 (${total.toFixed(1)}).`;
    }
  }
  return null;
}

function otherDailyTotal(allWorkItems, itemKey, dk) {
  let total = 0;
  for (const wi of allWorkItems) {
    if (workItemKey(wi) === itemKey) continue;
    total += Number(wi.dailyEfforts?.[dk]) || 0;
  }
  return total;
}

export function canSetEffort(allWorkItems, itemKey, dk, effort) {
  const value = Number(effort) || 0;
  if (value === 0) return true;
  return otherDailyTotal(allWorkItems, itemKey, dk) + value <= 1.0001;
}

/**
 * 공수 셀 클릭 시 다음 값.
 * - ●(1.0) → 항상 0 (취소)
 * - ○(0.5) → 1.0 가능하면 ●, 아니면 0 (취소)
 * - 0 → ○(0.5) 가능할 때만, 불가 시 null
 */
export function nextEffortIfAllowed(allWorkItems, itemKey, dk, currentEffort) {
  const current = Number(currentEffort) || 0;

  if (current === 1) return 0;

  if (current === 0.5) {
    if (canSetEffort(allWorkItems, itemKey, dk, 1)) return 1;
    return 0;
  }

  if (canSetEffort(allWorkItems, itemKey, dk, 0.5)) return 0.5;
  return null;
}

export function formatEffortLimitMessage(dk) {
  const day = Number(dk.slice(8, 10));
  return `${day}일 공수 합계는 1.0 M/D를 넘을 수 없습니다.`;
}

export function workItemKey(item) {
  return item.id ?? item.clientId;
}

export function emptyWorkItem(productLine) {
  return {
    clientId: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    id: null,
    productLine,
    clientName: '',
    workType: '프로젝트',
    maintenanceType: '신규',
    receivedDate: '',
    completedDate: '',
    progressStatus: '진행',
    description: '',
    projectId: null,
    sortOrder: 0,
    dailyEfforts: {},
  };
}

export function workItemFromApi(item) {
  return {
    clientId: item.id ? `id-${item.id}` : `new-${Math.random()}`,
    id: item.id,
    productLine: item.productLine,
    clientName: item.clientName || '',
    workType: item.workType || '프로젝트',
    maintenanceType: item.maintenanceType || '신규',
    receivedDate: item.receivedDate || '',
    completedDate: item.completedDate || '',
    progressStatus: item.progressStatus || '진행',
    description: item.description || '',
    projectId: item.projectId || null,
    sortOrder: item.sortOrder ?? 0,
    dailyEfforts: { ...(item.dailyEfforts || {}) },
  };
}

export function serializeWorkItems(items) {
  return items.map((item, index) => ({
    id: item.id || undefined,
    productLine: item.productLine,
    clientName: item.clientName || null,
    workType: item.workType || null,
    maintenanceType: item.maintenanceType || null,
    receivedDate: item.receivedDate || null,
    completedDate: item.completedDate || null,
    progressStatus: item.progressStatus || null,
    description: item.description || null,
    projectId: item.projectId || null,
    sortOrder: index,
    dailyEfforts: Object.fromEntries(
      Object.entries(item.dailyEfforts || {}).filter(([, v]) => Number(v) > 0)
    ),
  }));
}
