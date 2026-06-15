import { fetchJson } from './apiBase';

export function getMemberJiraIssues(memberId) {
  return fetchJson(`/api/jira/member/${memberId}/issues`);
}

export function getDev6TeamJiraIssues() {
  return fetchJson('/api/jira/dev6-team/issues');
}
