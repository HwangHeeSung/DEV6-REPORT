import { fetchJson } from './apiBase';

export function getCalendarDays({ year, month, tenantId } = {}) {
  const qs = new URLSearchParams();
  qs.set('year', year);
  qs.set('month', month);
  if (tenantId) qs.set('tenantId', tenantId);
  return fetchJson(`/api/calendar/days?${qs}`);
}
