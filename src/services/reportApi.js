import { fetchJson } from './apiBase';

export function getMembers(includeInactive = false) {
  return fetchJson(`/api/members?includeInactive=${includeInactive}`);
}

export function createMember(body) {
  return fetchJson('/api/members', { method: 'POST', body: JSON.stringify(body) });
}

export function updateMember(id, body) {
  return fetchJson(`/api/members/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export function reorderMembers(memberIds) {
  return fetchJson('/api/members/reorder', { method: 'PUT', body: JSON.stringify({ memberIds }) });
}

export function deleteMember(id) {
  return fetchJson(`/api/members/${id}`, { method: 'DELETE' });
}

export function getWeeklyReports(params = {}) {
  const qs = new URLSearchParams();
  if (params.year) qs.set('year', params.year);
  if (params.week) qs.set('week', params.week);
  if (params.memberId) qs.set('memberId', params.memberId);
  if (params.productLine) qs.set('productLine', params.productLine);
  const query = qs.toString();
  return fetchJson(`/api/weekly-reports${query ? `?${query}` : ''}`);
}

export function createWeeklyReport(body) {
  return fetchJson('/api/weekly-reports', { method: 'POST', body: JSON.stringify(body) });
}

export function updateWeeklyReport(id, body) {
  return fetchJson(`/api/weekly-reports/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export function submitWeeklyReport(id) {
  return fetchJson(`/api/weekly-reports/${id}/submit`, { method: 'POST' });
}

export function withdrawWeeklyReport(id) {
  return fetchJson(`/api/weekly-reports/${id}/withdraw`, { method: 'POST' });
}

export function deleteWeeklyReport(id) {
  return fetchJson(`/api/weekly-reports/${id}`, { method: 'DELETE' });
}

export function getMonthlyReports(params = {}) {
  const qs = new URLSearchParams();
  if (params.year) qs.set('year', params.year);
  if (params.month) qs.set('month', params.month);
  if (params.memberId) qs.set('memberId', params.memberId);
  const query = qs.toString();
  return fetchJson(`/api/monthly-reports${query ? `?${query}` : ''}`);
}

/** 해당 월 주간보고에 등록된 고객사 기준 업무 행 제안 */
export function getMonthlyWorkItemSuggestions(params = {}) {
  const qs = new URLSearchParams();
  if (params.year) qs.set('year', params.year);
  if (params.month) qs.set('month', params.month);
  if (params.memberId) qs.set('memberId', params.memberId);
  return fetchJson(`/api/monthly-reports/work-item-suggestions?${qs.toString()}`);
}

export function createMonthlyReport(body) {
  return fetchJson('/api/monthly-reports', { method: 'POST', body: JSON.stringify(body) });
}

export function updateMonthlyReport(id, body) {
  return fetchJson(`/api/monthly-reports/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export function submitMonthlyReport(id) {
  return fetchJson(`/api/monthly-reports/${id}/submit`, { method: 'POST' });
}

export function withdrawMonthlyReport(id) {
  return fetchJson(`/api/monthly-reports/${id}/withdraw`, { method: 'POST' });
}

export function deleteMonthlyReport(id) {
  return fetchJson(`/api/monthly-reports/${id}`, { method: 'DELETE' });
}

export function getStatisticsOverview(year) {
  const qs = year ? `?year=${year}` : '';
  return fetchJson(`/api/statistics/overview${qs}`);
}

export function getSubmissionRoster(params = {}) {
  const qs = new URLSearchParams();
  if (params.year) qs.set('year', params.year);
  if (params.week) qs.set('week', params.week);
  const query = qs.toString();
  return fetchJson(`/api/statistics/submission-roster${query ? `?${query}` : ''}`);
}

export function getProjectCodeStats(params = {}) {
  const qs = new URLSearchParams();
  if (params.year) qs.set('year', params.year);
  if (params.week) qs.set('week', params.week);
  const query = qs.toString();
  return fetchJson(`/api/statistics/project-codes${query ? `?${query}` : ''}`);
}

export function getCurrentPeriod() {
  return fetchJson('/api/statistics/current-period');
}

export function getProjects(params = {}) {
  const qs = new URLSearchParams();
  if (params.productLine) qs.set('productLine', params.productLine);
  if (params.workType) qs.set('workType', params.workType);
  if (params.q) qs.set('q', params.q);
  if (params.mapping) qs.set('mapping', params.mapping);
  if (params.memberId) qs.set('memberId', params.memberId);
  if (params.team) qs.set('team', params.team);
  if (params.memberSolutions) qs.set('memberSolutions', 'true');
  if (params.includeInactive) qs.set('includeInactive', 'true');
  const query = qs.toString();
  return fetchJson(`/api/projects${query ? `?${query}` : ''}`);
}

export function createProject(body) {
  return fetchJson('/api/projects', { method: 'POST', body: JSON.stringify(body) });
}

export function updateProject(id, body) {
  return fetchJson(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export function deleteProject(id) {
  return fetchJson(`/api/projects/${id}`, { method: 'DELETE' });
}

export function restoreProject(id) {
  return fetchJson(`/api/projects/${id}/restore`, { method: 'POST' });
}
