import { useMemo } from 'react';
import { Box, Text, Flex, Spinner, Badge } from '@chakra-ui/react';
import { AppSelect } from '../ui/FilterBar';
import EmptyState from '../ui/EmptyState';
import { tokens } from '../../theme/tokens';

const WORK_TYPE_ORDER = ['프로젝트', '유지보수', '제품개발'];
const PRODUCT_LINES = ['SWAT', 'IPRON CTI', 'ARGO', 'RSM'];
const SHEET_MIN_WIDTH = '1840px';

const COLUMNS = [
  { key: 'workType', label: '업무 구분', width: '96px' },
  { key: 'projectCode', label: '프로젝트코드', width: '128px' },
  { key: 'projectName', label: '프로젝트명', width: 'minmax(280px, 1.8fr)' },
  { key: 'team', label: '팀', width: '80px' },
  { key: 'productLine', label: '솔루션', width: '108px' },
  { key: 'memberName', label: '작성자', width: '100px' },
  { key: 'prevAccomplishments', label: '전주 실적', width: 'minmax(300px, 1.5fr)' },
  { key: 'accomplishments', label: '금주 실적', width: 'minmax(360px, 1.8fr)' },
  { key: 'nextPlan', label: '차주 계획', width: 'minmax(280px, 1.4fr)' },
];

const GRID_TEMPLATE = COLUMNS.map((c) => c.width).join(' ');

function workTypeOrder(workType) {
  const idx = WORK_TYPE_ORDER.indexOf(workType);
  return idx >= 0 ? idx : WORK_TYPE_ORDER.length;
}

function productLineOrder(line) {
  const idx = PRODUCT_LINES.indexOf(line);
  return idx >= 0 ? idx : PRODUCT_LINES.length;
}

function flattenSheetRows(reports, memberId, productLine) {
  const rows = [];
  for (const report of reports) {
    if (memberId && String(report.memberId) !== String(memberId)) continue;
    for (const entry of report.entries || []) {
      const line = (entry.productLine || '').trim();
      if (productLine && line !== productLine) continue;
      rows.push({
        id: `${report.id}-${entry.id ?? entry.projectCode}-${line}`,
        memberName: report.memberName,
        status: report.status,
        workType: entry.workType || '프로젝트',
        projectCode: entry.projectCode || '',
        projectName: entry.projectName || '',
        team: '개발6팀',
        productLine: line,
        prevAccomplishments: entry.prevAccomplishments || '',
        accomplishments: entry.accomplishments || '',
        nextPlan: entry.nextPlan || '',
      });
    }
  }
  return rows.sort((a, b) => {
    const pl = productLineOrder(a.productLine) - productLineOrder(b.productLine);
    if (pl !== 0) return pl;
    const wt = workTypeOrder(a.workType) - workTypeOrder(b.workType);
    if (wt !== 0) return wt;
    const code = (a.projectCode || '').localeCompare(b.projectCode || '', 'ko');
    if (code !== 0) return code;
    return (a.memberName || '').localeCompare(b.memberName || '', 'ko');
  });
}

function SheetCell({ children, mono, accent }) {
  return (
    <Text
      fontSize="sm"
      color={accent ? tokens.cyan : tokens.text}
      fontFamily={mono ? 'mono' : 'inherit'}
      fontWeight={mono ? '600' : '400'}
      whiteSpace="pre-wrap"
      lineHeight="1.65"
      wordBreak="break-word"
    >
      {children || ''}
    </Text>
  );
}

function SheetRow({ row }) {
  return (
    <Box
      display="grid"
      gridTemplateColumns={GRID_TEMPLATE}
      gap={3}
      px={4}
      py={3.5}
      borderBottom="1px solid"
      borderColor={tokens.border}
      minW={SHEET_MIN_WIDTH}
      _hover={{ bg: tokens.surfaceHover }}
      alignItems="start"
    >
      <SheetCell>{row.workType}</SheetCell>
      <SheetCell mono accent>{row.projectCode || '-'}</SheetCell>
      <SheetCell>{row.projectName}</SheetCell>
      <SheetCell>{row.team}</SheetCell>
      <Box>
        <Badge colorPalette="purple" borderRadius="full" fontSize="xs" px={2}>{row.productLine}</Badge>
      </Box>
      <Box>
        <Text fontSize="sm" fontWeight="600" color={tokens.text}>{row.memberName}</Text>
        {row.status !== 'SUBMITTED' && (
          <Badge size="sm" colorPalette="yellow" borderRadius="full" mt={1}>임시</Badge>
        )}
      </Box>
      <SheetCell>{row.prevAccomplishments}</SheetCell>
      <SheetCell>{row.accomplishments}</SheetCell>
      <SheetCell>{row.nextPlan}</SheetCell>
    </Box>
  );
}

export default function Dev6TeamSheetTab({
  year,
  effectiveWeek,
  reports,
  isLoading,
  members,
  memberId,
  onMemberIdChange,
  productLine,
  onProductLineChange,
}) {
  const rows = useMemo(
    () => flattenSheetRows(reports, memberId || null, productLine || ''),
    [reports, memberId, productLine]
  );

  const reportTargets = members.filter((m) => m.requiresDev6Report !== false);

  return (
    <Box>
      <Flex gap={3} mb={5} flexWrap="wrap" align="flex-end">
        <Box>
          <Text className="app-label">작성자</Text>
          <AppSelect value={memberId} onChange={(e) => onMemberIdChange(e.target.value)} minW="180px">
            <option value="">전체</option>
            {reportTargets.map((m) => (
              <option key={m.id} value={m.id}>{m.name} ({m.team})</option>
            ))}
          </AppSelect>
        </Box>
        <Box>
          <Text className="app-label">솔루션</Text>
          <AppSelect value={productLine} onChange={(e) => onProductLineChange(e.target.value)} minW="140px">
            <option value="">전체</option>
            {PRODUCT_LINES.map((line) => (
              <option key={line} value={line}>{line}</option>
            ))}
          </AppSelect>
        </Box>
        <Text color={tokens.textMuted} fontSize="sm" fontWeight="500" mb={1}>
          등록 {rows.length}건
        </Text>
      </Flex>

      {isLoading ? (
        <Flex justify="center" py={16}><Spinner size="lg" color={tokens.accent} /></Flex>
      ) : rows.length === 0 ? (
        <EmptyState
          title={`${year}년 ${effectiveWeek}주차 등록 없음`}
          description={productLine
            ? `${productLine} 솔루션으로 등록된 항목이 없습니다.`
            : '팀원이 주간보고에 프로젝트를 등록하면 이 화면에 표시됩니다.'}
        />
      ) : (
        <Box
          className="glass-panel-strong"
          borderRadius={tokens.radius.lg}
          overflow="hidden"
          border="1px solid"
          borderColor={tokens.borderStrong}
          w="100%"
        >
          <Box
            display="grid"
            gridTemplateColumns={GRID_TEMPLATE}
            gap={3}
            px={4}
            py={3}
            bg={tokens.surfaceStrong}
            borderBottom="2px solid"
            borderColor={tokens.borderStrong}
            position="sticky"
            top={0}
            zIndex={2}
            minW={SHEET_MIN_WIDTH}
          >
            {COLUMNS.map((col) => (
              <Text key={col.key} fontSize="sm" fontWeight="700" color={tokens.textMuted}>
                {col.label}
              </Text>
            ))}
          </Box>
          <Box overflowX="auto" maxH="calc(100vh - 340px)" overflowY="auto" w="100%">
            {rows.map((row) => (
              <SheetRow key={row.id} row={row} />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
