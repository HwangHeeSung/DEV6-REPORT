import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Text, Flex, Badge, Spinner } from '@chakra-ui/react';
import { getProjectCodeStats } from '../../services/reportApi';
import { tokens } from '../../theme/tokens';
import { Card } from '../ui/Card';

const WORK_TYPE_ORDER = ['프로젝트', '유지보수', '제품개발'];

const TABLE_GRID = {
  display: 'grid',
  gridTemplateColumns: 'minmax(88px, 110px) minmax(160px, 1.6fr) 88px 88px 72px 72px minmax(120px, 1fr)',
  alignItems: 'center',
  columnGap: 3,
};

function groupByWorkType(rows = []) {
  const groups = Object.fromEntries(WORK_TYPE_ORDER.map((t) => [t, []]));
  const other = [];
  for (const row of rows) {
    const type = WORK_TYPE_ORDER.includes(row.workType) ? row.workType : '기타';
    if (groups[type]) groups[type].push(row);
    else other.push(row);
  }
  if (other.length) groups.기타 = other;
  return groups;
}

function StatsTableHeader() {
  return (
    <Box
      {...TABLE_GRID}
      fontSize="sm"
      fontWeight="700"
      color={tokens.textMuted}
      pb={3}
      mb={2}
      borderBottom="2px solid"
      borderColor={tokens.borderStrong}
    >
      <Text>코드</Text>
      <Text>프로젝트명</Text>
      <Text textAlign="center">솔루션</Text>
      <Text textAlign="center">구분</Text>
      <Text textAlign="center">등록</Text>
      <Text textAlign="center">인원</Text>
      <Text>담당자</Text>
    </Box>
  );
}

function StatsRow({ row }) {
  return (
    <Box
      {...TABLE_GRID}
      py={3}
      borderBottom="1px solid"
      borderColor={tokens.border}
      _last={{ borderBottom: 'none' }}
    >
      <Text fontSize="sm" fontFamily="mono" color={tokens.cyan} fontWeight="600">
        {row.projectCode || '-'}
      </Text>
      <Text fontSize="sm" fontWeight="600" color={tokens.text} lineHeight="1.45">
        {row.projectName}
      </Text>
      <Flex justify="center">
        <Badge colorPalette="purple" borderRadius="full" fontSize="xs">{row.productLine}</Badge>
      </Flex>
      <Text fontSize="xs" color={tokens.textMuted} textAlign="center">{row.workType}</Text>
      <Text fontSize="md" fontWeight="800" color={tokens.accent} textAlign="center">{row.entryCount}</Text>
      <Text fontSize="md" fontWeight="700" color={tokens.text} textAlign="center">{row.memberCount}</Text>
      <Text fontSize="sm" color={tokens.textMuted} lineHeight="1.5">
        {(row.memberNames || []).join(', ') || '-'}
      </Text>
    </Box>
  );
}

function WorkTypeSection({ workType, rows }) {
  const totalEntries = rows.reduce((sum, r) => sum + (r.entryCount || 0), 0);

  return (
    <Card strong p={0} overflow="hidden" mb={5}>
      <Flex
        px={5}
        py={4}
        borderBottom="1px solid"
        borderColor={tokens.borderStrong}
        align="center"
        justify="space-between"
        gap={3}
        bg={tokens.surfaceStrong}
        flexWrap="wrap"
      >
        <Flex align="center" gap={3} flexWrap="wrap">
          <Text fontWeight="800" fontSize="lg" color={tokens.text}>{workType}</Text>
          <Badge colorPalette="gray" borderRadius="full" px={3} py={1} fontSize="sm">
            {rows.length}개 코드
          </Badge>
        </Flex>
        <Text fontSize="sm" fontWeight="700" color={tokens.accent}>
          등록 {totalEntries}건
        </Text>
      </Flex>
      <Box px={5} py={4} overflowX="auto">
        <Box minW="760px">
          <StatsTableHeader />
          {rows.map((row) => (
            <StatsRow
              key={`${row.projectCode || ''}|${row.projectName}|${row.productLine}`}
              row={row}
            />
          ))}
        </Box>
      </Box>
    </Card>
  );
}

export default function ProjectCodeStatsPanel({ year, week }) {
  const { data = [], isLoading, error } = useQuery({
    queryKey: ['projectCodeStats', year, week],
    queryFn: () => getProjectCodeStats({ year, week }),
    enabled: !!year && !!week,
  });

  const grouped = useMemo(() => groupByWorkType(data), [data]);
  const sections = useMemo(() => {
    const list = WORK_TYPE_ORDER.filter((t) => grouped[t]?.length).map((t) => ({ workType: t, rows: grouped[t] }));
    if (grouped.기타?.length) list.push({ workType: '기타', rows: grouped.기타 });
    return list;
  }, [grouped]);

  const totalEntries = data.reduce((sum, r) => sum + (r.entryCount || 0), 0);

  if (isLoading) {
    return <Flex justify="center" py={8}><Spinner size="lg" color={tokens.accent} /></Flex>;
  }

  if (error) {
    return <Text color={tokens.danger} fontSize="md">프로젝트 코드 통계를 불러오지 못했습니다.</Text>;
  }

  return (
    <Box w="100%">
      <Flex align="baseline" justify="space-between" gap={3} flexWrap="wrap" mb={5}>
        <Box>
          <Text fontWeight="800" fontSize="xl" color={tokens.text} mb={1} letterSpacing="-0.02em">
            프로젝트 코드별 등록 현황
          </Text>
          <Text fontSize="md" color={tokens.textMuted}>
            {year}년 {week}주차 · 주간보고에 등록된 프로젝트 코드 건수
          </Text>
        </Box>
        <Badge colorPalette="cyan" borderRadius="full" px={4} py={2} fontSize="md" fontWeight="700">
          총 {totalEntries}건 · {data.length}개 코드
        </Badge>
      </Flex>

      {sections.length === 0 ? (
        <Card strong p={8}>
          <Text textAlign="center" color={tokens.textFaint} fontSize="md">
            이번 주 등록된 프로젝트 코드가 없습니다.
          </Text>
        </Card>
      ) : (
        sections.map(({ workType, rows }) => (
          <WorkTypeSection key={workType} workType={workType} rows={rows} />
        ))
      )}
    </Box>
  );
}
