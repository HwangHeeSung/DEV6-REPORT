import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Text, Flex, Badge } from '@chakra-ui/react';
import { getWeeklyReports } from '../../services/reportApi';
import { useMembers, useCurrentPeriod } from '../../hooks/useReports';
import { AppSelect, SegmentedControl } from '../ui/FilterBar';
import Dev6TeamSheetTab from './Dev6TeamSheetTab';
import Dev6JiraSheetTab from './Dev6JiraSheetTab';
const SHEET_TABS = [
  { value: 'dev6', label: '(필수-팀원) 개발6팀' },
  { value: 'jira', label: '(필수-팀원) JIRA(개발6팀)' },
];

export default function Dev6SheetPanel({ year }) {
  const { data: period } = useCurrentPeriod();
  const { data: members = [] } = useMembers();
  const [sheetTab, setSheetTab] = useState('dev6');
  const [week, setWeek] = useState(null);
  const [memberId, setMemberId] = useState('');
  const [productLine, setProductLine] = useState('');
  const effectiveWeek = week ?? period?.week;

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['weeklyReports', 'dev6-sheet', year, effectiveWeek],
    queryFn: () => getWeeklyReports({ year, week: effectiveWeek }),
    enabled: !!effectiveWeek,
  });

  return (
    <Box w="100%" maxW="100%">
      <Flex gap={3} mb={4} flexWrap="wrap" align="flex-end">
        <Box>
          <Text className="app-label">주차</Text>
          <AppSelect value={effectiveWeek ?? ''} onChange={(e) => setWeek(Number(e.target.value))} minW="120px">
            {Array.from({ length: period?.week || 1 }, (_, i) => i + 1).map((w) => (
              <option key={w} value={w}>{w}주차</option>
            ))}
          </AppSelect>
        </Box>
        {period && effectiveWeek === period.week && (
          <Badge colorPalette="purple" borderRadius="full" mb={1}>현재 주차</Badge>
        )}
        <Box ml={{ md: 'auto' }} mb={1}>
          <SegmentedControl options={SHEET_TABS} value={sheetTab} onChange={setSheetTab} />
        </Box>
      </Flex>

      {sheetTab === 'dev6' ? (
        <Dev6TeamSheetTab
          year={year}
          effectiveWeek={effectiveWeek}
          reports={reports}
          isLoading={isLoading}
          members={members}
          memberId={memberId}
          onMemberIdChange={setMemberId}
          productLine={productLine}
          onProductLineChange={setProductLine}
        />
      ) : (
        <Dev6JiraSheetTab
          reports={reports}
          reportsLoading={isLoading}
          members={members}
          memberId={memberId}
          onMemberIdChange={setMemberId}
        />
      )}
    </Box>
  );
}
