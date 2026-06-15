import { useQuery } from '@tanstack/react-query';
import { getMembers, getStatisticsOverview, getCurrentPeriod } from '../services/reportApi';

export function useMembers(includeInactive = false) {
  return useQuery({
    queryKey: ['members', includeInactive],
    queryFn: () => getMembers(includeInactive),
  });
}

export function useStatistics(year) {
  return useQuery({
    queryKey: ['statistics', year],
    queryFn: () => getStatisticsOverview(year),
  });
}

export function useCurrentPeriod() {
  return useQuery({
    queryKey: ['currentPeriod'],
    queryFn: getCurrentPeriod,
  });
}
