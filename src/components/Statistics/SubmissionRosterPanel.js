import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Text, Flex, Badge, Spinner, Grid } from '@chakra-ui/react';
import { getSubmissionRoster } from '../../services/reportApi';
import { tokens } from '../../theme/tokens';
import { Card } from '../ui/Card';

const PART_META = {
  part1: { title: '1파트', subtitle: 'SWAT · IPRON CTI' },
  part2: { title: '2파트', subtitle: 'ARGO · RSM' },
};

/** 성명 | 개발6팀 | JIRA | 상태 */
const ROSTER_GRID_PROPS = {
  display: 'grid',
  gridTemplateColumns: 'minmax(100px, 1.4fr) 108px 108px minmax(120px, 1fr)',
  alignItems: 'center',
  columnGap: 4,
};

function groupRoster(rows = []) {
  const part1 = [];
  const part2 = [];
  const other = [];
  for (const row of rows) {
    if (row.team?.includes('1파트')) {
      part1.push(row);
    } else if (row.team?.includes('2파트')) {
      part2.push(row);
    } else {
      other.push(row);
    }
  }
  return { part1, part2, other };
}

function StatusBadge({ done, doneLabel, pendingLabel }) {
  return (
    <Badge
      colorPalette={done ? 'green' : 'orange'}
      borderRadius="full"
      px={3}
      py={1}
      fontSize="sm"
      fontWeight="600"
    >
      {done ? doneLabel : pendingLabel}
    </Badge>
  );
}

function RosterTableHeader() {
  return (
    <Box
      display={{ base: 'none', md: 'grid' }}
      {...ROSTER_GRID_PROPS}
      fontSize="sm"
      fontWeight="700"
      color={tokens.textMuted}
      pb={3}
      mb={2}
      borderBottom="2px solid"
      borderColor={tokens.borderStrong}
    >
      <Text>성명</Text>
      <Text textAlign="center">개발6팀</Text>
      <Text textAlign="center">JIRA</Text>
      <Text>상태</Text>
    </Box>
  );
}

function RosterRow({ row }) {
  return (
    <Box
      py={3.5}
      borderBottom="1px solid"
      borderColor={tokens.border}
      _last={{ borderBottom: 'none' }}
    >
      <Box
        display={{ base: 'none', md: 'grid' }}
        {...ROSTER_GRID_PROPS}
      >
        <Text fontSize="md" fontWeight="700" color={tokens.text} lineHeight="1.4">
          {row.memberName}
        </Text>
        <Flex justify="center">
          {row.requiresDev6Report ? (
            <StatusBadge done={row.dev6Submitted} doneLabel="완료" pendingLabel="미제출" />
          ) : (
            <Text color={tokens.textFaint} fontSize="sm">-</Text>
          )}
        </Flex>
        <Flex justify="center">
          {row.requiresJiraReport ? (
            <StatusBadge done={row.jiraCompleted} doneLabel="작성완료" pendingLabel="미작성" />
          ) : (
            <Text color={tokens.textFaint} fontSize="sm">-</Text>
          )}
        </Flex>
        <Text color={tokens.textMuted} fontSize="sm" lineHeight="1.5">
          {row.weeklyStatus === 'SUBMITTED'
            ? `제출 ${row.submittedAt ? new Date(row.submittedAt).toLocaleDateString('ko-KR') : ''}`
            : row.weeklyStatus === 'MISSING' ? '미작성' : row.weeklyStatus}
        </Text>
      </Box>

      <Box display={{ base: 'block', md: 'none' }}>
        <Flex justify="space-between" align="flex-start" gap={2} mb={2}>
          <Text fontSize="md" fontWeight="700" color={tokens.text} lineHeight="1.4">
            {row.memberName}
          </Text>
          <Text color={tokens.textMuted} fontSize="xs" lineHeight="1.5" textAlign="right" flexShrink={0}>
            {row.weeklyStatus === 'SUBMITTED'
              ? `제출 ${row.submittedAt ? new Date(row.submittedAt).toLocaleDateString('ko-KR') : ''}`
              : row.weeklyStatus === 'MISSING' ? '미작성' : row.weeklyStatus}
          </Text>
        </Flex>
        <Flex gap={2} flexWrap="wrap">
          {row.requiresDev6Report ? (
            <Flex align="center" gap={1.5}>
              <Text fontSize="xs" color={tokens.textFaint}>개발6팀</Text>
              <StatusBadge done={row.dev6Submitted} doneLabel="완료" pendingLabel="미제출" />
            </Flex>
          ) : null}
          {row.requiresJiraReport ? (
            <Flex align="center" gap={1.5}>
              <Text fontSize="xs" color={tokens.textFaint}>JIRA</Text>
              <StatusBadge done={row.jiraCompleted} doneLabel="작성완료" pendingLabel="미작성" />
            </Flex>
          ) : null}
        </Flex>
      </Box>
    </Box>
  );
}

function RosterPartSection({ title, subtitle, rows }) {
  const submitted = rows.filter((r) => r.weeklyStatus === 'SUBMITTED').length;

  return (
    <Card strong p={0} overflow="hidden" h="100%">
      <Flex
        px={{ base: 4, md: 5 }}
        py={4}
        borderBottom="1px solid"
        borderColor={tokens.borderStrong}
        align="center"
        justify="space-between"
        gap={3}
        bg={tokens.surfaceStrong}
        flexWrap="wrap"
      >
        <Box minW={0}>
          <Flex align="center" gap={3} flexWrap="wrap" mb={1}>
            <Text fontWeight="800" fontSize={{ base: 'lg', md: 'xl' }} color={tokens.text} letterSpacing="-0.02em">
              {title}
            </Text>
            <Badge colorPalette="purple" borderRadius="full" px={3} py={1} fontSize="sm" fontWeight="700">
              {rows.length}명
            </Badge>
          </Flex>
          <Text fontSize="md" color={tokens.textMuted} fontWeight="500">{subtitle}</Text>
        </Box>
        <Flex
          align="center"
          gap={2}
          px={3}
          py={1.5}
          borderRadius="full"
          bg={tokens.accentSoft}
          border="1px solid"
          borderColor="rgba(129, 140, 248, 0.4)"
        >
          <Text fontSize="sm" fontWeight="700" color={tokens.accent}>
            제출 {submitted}/{rows.length}
          </Text>
        </Flex>
      </Flex>
      <Box px={{ base: 4, md: 5 }} py={4}>
        {rows.length === 0 ? (
          <Text fontSize="md" color={tokens.textFaint} py={10} textAlign="center">
            이번 주 작성 대상 없음
          </Text>
        ) : (
          <>
            <RosterTableHeader />
            {rows.map((row) => (
              <RosterRow key={row.memberId} row={row} />
            ))}
          </>
        )}
      </Box>
    </Card>
  );
}

export default function SubmissionRosterPanel({ year, week }) {
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['submissionRoster', year, week],
    queryFn: () => getSubmissionRoster({ year, week }),
    enabled: !!year && !!week,
  });

  const { part1, part2, other } = useMemo(() => groupRoster(data), [data]);

  if (isLoading) {
    return <Flex justify="center" py={8}><Spinner size="lg" color={tokens.accent} /></Flex>;
  }

  if (error) {
    return <Text color={tokens.danger} fontSize="md">작성명부를 불러오지 못했습니다.</Text>;
  }

  return (
    <Box mb={6} w="100%">
      <Text fontWeight="800" fontSize={{ base: 'lg', md: 'xl' }} color={tokens.text} mb={1} letterSpacing="-0.02em">
        작성명부
      </Text>
      <Text fontSize={{ base: 'sm', md: 'md' }} color={tokens.textMuted} mb={{ base: 4, md: 5 }}>
        {year}년 {week}주차 · 개발6팀 / JIRA 제출 현황
      </Text>

      {other.length > 0 && (
        <Box maxW="720px" mx="auto" mb={5}>
          <RosterPartSection title="기타" subtitle="파트 미지정" rows={other} />
        </Box>
      )}

      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={5} w="100%">
        <RosterPartSection
          title={PART_META.part1.title}
          subtitle={PART_META.part1.subtitle}
          rows={part1}
        />
        <RosterPartSection
          title={PART_META.part2.title}
          subtitle={PART_META.part2.subtitle}
          rows={part2}
        />
      </Grid>
    </Box>
  );
}
