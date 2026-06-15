import { Box } from '@chakra-ui/react';
import { FiBarChart2 } from 'react-icons/fi';
import { useCurrentPeriod } from '../../hooks/useReports';
import SubmissionRosterPanel from './SubmissionRosterPanel';
import ProjectCodeStatsPanel from './ProjectCodeStatsPanel';
import PageBanner from '../ui/PageBanner';

export default function StatisticsPanel({ year }) {
  const { data: period } = useCurrentPeriod();
  const week = period?.week;

  return (
    <Box>
      <PageBanner
        icon={FiBarChart2}
        title="통계"
        description="작성명부와 프로젝트 코드별 주간보고 등록 현황을 확인합니다."
      />

      <SubmissionRosterPanel year={year} week={week} />
      <ProjectCodeStatsPanel year={year} week={week} />
    </Box>
  );
}
