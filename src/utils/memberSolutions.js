/** 파트별 선택 가능 솔루션 */
export const SOLUTION_OPTIONS_BY_TEAM = {
  '1파트 (SWAT)': ['SWAT', 'IPRON CTI'],
  '2파트 (ARGO/RSM)': ['ARGO', 'RSM'],
};

export function solutionOptionsForTeam(team) {
  if (team?.includes('1파트')) return SOLUTION_OPTIONS_BY_TEAM['1파트 (SWAT)'];
  if (team?.includes('2파트')) return SOLUTION_OPTIONS_BY_TEAM['2파트 (ARGO/RSM)'];
  return [];
}

export function defaultSolutionsForTeam(team) {
  if (team?.includes('1파트')) return ['SWAT'];
  if (team?.includes('2파트')) return ['ARGO', 'RSM'];
  return [];
}

export function normalizeMemberSolutions(selected, team) {
  const allowed = solutionOptionsForTeam(team);
  if (!allowed.length) return [];
  const filtered = (selected || []).filter((s) => allowed.includes(s));
  return filtered.length ? filtered : defaultSolutionsForTeam(team);
}

export function formatSolutionsLabel(lines = []) {
  if (!lines.length) return '미지정';
  return lines.join(' · ');
}
