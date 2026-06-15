import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Text, Flex, Spinner, Badge, Grid,
} from '@chakra-ui/react';
import { getWeeklyReports } from '../../services/reportApi';
import { useMembers, useCurrentPeriod } from '../../hooks/useReports';
import SubmissionRosterPanel from '../Statistics/SubmissionRosterPanel';
import PageBanner from '../ui/PageBanner';
import { Card } from '../ui/Card';
import { AppSelect, SegmentedControl } from '../ui/FilterBar';
import EmptyState from '../ui/EmptyState';
import { tokens } from '../../theme/tokens';
import { FiUsers } from 'react-icons/fi';

export default function TeamWeeklySummaryPanel({ year }) {
  const { data: period } = useCurrentPeriod();
  const { data: members = [] } = useMembers();
  const [week, setWeek] = useState(null);
  const [viewMode, setViewMode] = useState('member');
  const effectiveWeek = week ?? period?.week;

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['weeklyReports', 'team', year, effectiveWeek],
    queryFn: () => getWeeklyReports({ year, week: effectiveWeek }),
    enabled: !!effectiveWeek,
  });

  const submittedCount = reports.filter((r) => r.status === 'SUBMITTED').length;
  const targetCount = members.filter((m) => m.requiresDev6Report !== false).length;

  const projectGroups = {};
  reports.forEach((report) => {
    (report.entries || []).forEach((entry) => {
      const key = `${entry.workType || '프로젝트'}|${entry.projectCode || ''}|${entry.projectName}|${entry.productLine}`;
      if (!projectGroups[key]) {
        projectGroups[key] = {
          workType: entry.workType || '프로젝트',
          projectCode: entry.projectCode,
          projectName: entry.projectName,
          productLine: entry.productLine,
          items: [],
        };
      }
      projectGroups[key].items.push({
        memberName: report.memberName,
        team: report.memberTeam,
        accomplishments: entry.accomplishments,
        nextPlan: entry.nextPlan,
        status: report.status,
      });
    });
  });

  return (
    <Box>
      <PageBanner
        icon={FiUsers}
        title="팀 취합"
        description="이번 주 전체 보고를 멤버별·프로젝트별로 확인합니다."
      />

      <Flex gap={3} mb={5} flexWrap="wrap" align="center">
        <Box>
          <Text className="app-label">주차</Text>
          <AppSelect value={effectiveWeek ?? ''} onChange={(e) => setWeek(Number(e.target.value))} minW="120px">
            {Array.from({ length: period?.week || 1 }, (_, i) => i + 1).map((w) => (
              <option key={w} value={w}>{w}주차</option>
            ))}
          </AppSelect>
        </Box>
        {period && effectiveWeek === period.week && (
          <Badge colorPalette="purple" mt={5} borderRadius="full">현재 주차</Badge>
        )}
        <Text color={tokens.textMuted} fontSize="sm" fontWeight="500" mt={5}>
          제출 {submittedCount} / {targetCount}명
        </Text>
        <Box ml="auto" mt={4}>
          <SegmentedControl
            options={[
              { value: 'member', label: '멤버별' },
              { value: 'project', label: '프로젝트별' },
            ]}
            value={viewMode}
            onChange={setViewMode}
          />
        </Box>
      </Flex>

      <SubmissionRosterPanel year={year} week={effectiveWeek} />

      {isLoading ? (
        <Flex justify="center" py={16}><Spinner size="lg" color={tokens.accent} /></Flex>
      ) : reports.length === 0 ? (
        <EmptyState title={`${year}년 ${effectiveWeek}주차 제출 없음`} description="팀원이 보고를 제출하면 여기에 표시됩니다." />
      ) : viewMode === 'member' ? (
        <Box display="flex" flexDirection="column" gap={4}>
          {reports.map((r) => (
            <Card key={r.id} strong>
              <Flex justify="space-between" align="start" mb={3}>
                <Box>
                  <Text fontSize="lg" fontWeight="700" color={tokens.text}>
                    {r.memberName}
                    <Text as="span" color={tokens.textMuted} fontSize="md" fontWeight="500" ml={2}>{r.memberTeam}</Text>
                  </Text>
                  <Text fontSize="sm" color={tokens.textMuted} mt={1}>
                    {r.submittedAt ? `제출: ${new Date(r.submittedAt).toLocaleString('ko-KR')}` : '미제출'}
                  </Text>
                </Box>
                <Badge colorPalette={r.status === 'SUBMITTED' ? 'green' : 'yellow'} borderRadius="full">
                  {r.status === 'SUBMITTED' ? '제출완료' : '임시저장'}
                </Badge>
              </Flex>

              {(r.entries || []).map((e, i) => (
                <Box key={i} mb={3} pl={4} borderLeft="3px solid" borderColor={tokens.accentStrong}>
                  <Flex gap={2} mb={2} flexWrap="wrap" align="center">
                    <Badge size="sm" colorPalette="gray" borderRadius="full">{e.workType || '프로젝트'}</Badge>
                    <Badge size="sm" colorPalette="purple" borderRadius="full">{e.productLine}</Badge>
                    {e.projectCode && <Text fontSize="sm" fontFamily="mono" color={tokens.cyan}>{e.projectCode}</Text>}
                    <Text fontWeight="600" fontSize="sm" color={tokens.text}>{e.projectName}</Text>
                  </Flex>
                  <Text fontSize="sm" color={tokens.text} whiteSpace="pre-wrap" lineHeight="1.7">
                    <Text as="span" fontWeight="600" color={tokens.textMuted}>금주: </Text>{e.accomplishments || '-'}
                  </Text>
                  {e.nextPlan && (
                    <Text fontSize="sm" color={tokens.text} whiteSpace="pre-wrap" lineHeight="1.7" mt={1}>
                      <Text as="span" fontWeight="600" color={tokens.textMuted}>차주: </Text>{e.nextPlan}
                    </Text>
                  )}
                </Box>
              ))}

              {(r.jiraEntries || []).length > 0 && (
                <Box mt={3} pt={3} borderTop="1px solid" borderColor={tokens.border}>
                  <Text fontSize="sm" fontWeight="700" color={tokens.text} mb={2}>JIRA 진행상황</Text>
                  {r.jiraEntries.map((j) => (
                    <Flex key={j.issueKey} gap={2} fontSize="sm" mb={2} lineHeight="1.5">
                      <Text color={tokens.cyan} minW="80px" fontFamily="mono">{j.issueKey}</Text>
                      <Text color={tokens.textMuted} flex={1}>{j.issueSummary}</Text>
                      <Text color={tokens.text} fontWeight="500">{j.progressNote || '-'}</Text>
                    </Flex>
                  ))}
                </Box>
              )}
            </Card>
          ))}
        </Box>
      ) : (
        <Box display="flex" flexDirection="column" gap={3}>
          {Object.values(projectGroups).map((group, idx) => (
            <Card key={idx} strong>
              <Flex gap={2} mb={3} flexWrap="wrap" align="center">
                <Badge colorPalette="gray" borderRadius="full">{group.workType}</Badge>
                <Badge colorPalette="purple" borderRadius="full">{group.productLine}</Badge>
                {group.projectCode && <Badge colorPalette="blue" borderRadius="full">{group.projectCode}</Badge>}
                <Text fontWeight="700" color={tokens.text}>{group.projectName}</Text>
              </Flex>
              <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={3}>
                {group.items.map((item, i) => (
                  <Box key={i} p={4} borderRadius={tokens.radius.lg} className="glass-panel">
                    <Flex justify="space-between" mb={2}>
                      <Text fontWeight="600" fontSize="sm" color={tokens.text}>{item.memberName}</Text>
                      <Badge size="sm" colorPalette={item.status === 'SUBMITTED' ? 'green' : 'yellow'} borderRadius="full">
                        {item.status === 'SUBMITTED' ? '제출' : '임시'}
                      </Badge>
                    </Flex>
                    <Text fontSize="sm" color={tokens.text} whiteSpace="pre-wrap" lineHeight="1.7">
                      {item.accomplishments || '-'}
                    </Text>
                  </Box>
                ))}
              </Grid>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
