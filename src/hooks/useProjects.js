import { useQuery } from '@tanstack/react-query';
import { getProjects } from '../services/reportApi';
import { getDev6TeamJiraIssues, getMemberJiraIssues } from '../services/jiraApi';

export function useMemberProjects(memberId) {
  return useQuery({
    queryKey: ['projects', 'member', memberId],
    queryFn: () => getProjects({ memberId }),
    enabled: !!memberId,
  });
}

/** 멤버 담당 솔루션 기준 활성 프로젝트 (주간보고 선택용) */
export function useMemberSolutionProjects(memberId) {
  return useQuery({
    queryKey: ['projects', 'memberSolutions', memberId],
    queryFn: () => getProjects({ memberId, memberSolutions: true }),
    enabled: !!memberId,
  });
}

/** @deprecated use useMemberSolutionProjects */
export function useTeamProjects(team) {
  return useQuery({
    queryKey: ['projects', 'team', team],
    queryFn: () => getProjects({ team }),
    enabled: !!team,
  });
}

export function useDev6TeamJiraIssues(enabled = true) {
  return useQuery({
    queryKey: ['jiraIssues', 'dev6-team'],
    queryFn: getDev6TeamJiraIssues,
    enabled,
    retry: false,
    staleTime: 60_000,
  });
}

export function useMemberJiraIssues(memberId, enabled = true) {
  return useQuery({
    queryKey: ['jiraIssues', memberId],
    queryFn: () => getMemberJiraIssues(memberId),
    enabled: !!memberId && enabled,
    retry: false,
    staleTime: 60_000,
  });
}

export function useProjectList(filters = {}) {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: () => getProjects(filters),
  });
}

/** @deprecated use useProjectList */
export function useProjects(productLine) {
  return useProjectList(productLine ? { productLine } : {});
}
