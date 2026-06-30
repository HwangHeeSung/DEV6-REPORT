import { useMemo } from 'react';
import { Box, Text, Flex, Spinner, Badge, Link } from '@chakra-ui/react';
import { useDev6TeamJiraIssues } from '../../hooks/useProjects';
import { AppSelect } from '../ui/FilterBar';
import EmptyState from '../ui/EmptyState';
import { tokens } from '../../theme/tokens';
import { shouldShowCustomer } from '../../utils/displayLabel';

const JIRA_BASE = process.env.REACT_APP_JIRA_BASE_URL || 'http://qa.bridgetec.co.kr/jira/browse';
const SHEET_MIN_WIDTH = '1680px';

const COLUMNS = [
  { key: 'type', label: 'Issue Type', width: '108px' },
  { key: 'customer', label: '고객사', width: 'minmax(100px, 1fr)' },
  { key: 'createdDate', label: 'Created', width: '108px' },
  { key: 'updatedDate', label: 'Updated', width: '108px' },
  { key: 'dueDate', label: 'Due Date', width: '108px' },
  { key: 'key', label: 'Key', width: '100px' },
  { key: 'summary', label: 'Summary', width: 'minmax(300px, 2fr)' },
  { key: 'assignee', label: 'Assignee', width: '96px' },
  { key: 'progressNote', label: '진행상황', width: 'minmax(220px, 1.3fr)' },
];

const GRID_TEMPLATE = COLUMNS.map((c) => c.width).join(' ');

function matchesAssignee(assignee, member) {
  if (!member) return true;
  const a = (assignee || '').trim().toLowerCase();
  if (!a) return false;
  const name = (member.name || '').trim().toLowerCase();
  const jira = (member.jiraUsername || '').trim().toLowerCase();
  return (name && a === name) || (jira && a === jira);
}

function buildProgressMap(reports, memberId) {
  const map = {};
  for (const report of reports) {
    if (memberId && String(report.memberId) !== String(memberId)) continue;
    for (const entry of report.jiraEntries || []) {
      const note = (entry.progressNote || '').trim();
      if (!note) continue;
      map[entry.issueKey] = {
        progressNote: note,
        memberName: report.memberName,
        draft: report.status !== 'SUBMITTED',
      };
    }
  }
  return map;
}

function SheetCell({ children, mono, accent, muted }) {
  return (
    <Text
      fontSize="sm"
      color={accent ? tokens.cyan : muted ? tokens.textMuted : tokens.text}
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

function JiraSheetRow({ row }) {
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
      bg={row.isDelayed ? 'rgba(248, 113, 113, 0.06)' : undefined}
    >
      <SheetCell muted>{row.type}</SheetCell>
      <SheetCell>{row.customer}</SheetCell>
      <SheetCell muted>{row.createdDate}</SheetCell>
      <SheetCell muted>{row.updatedDate}</SheetCell>
      <SheetCell muted={!row.isDelayed} accent={row.isDelayed}>{row.dueDate}</SheetCell>
      <Box>
        <Link href={`${JIRA_BASE}/${row.key}`} target="_blank" fontSize="sm" fontWeight="700" color={tokens.cyan} fontFamily="mono">
          {row.key}
        </Link>
      </Box>
      <SheetCell>
        {row.summary}
        {shouldShowCustomer(row.summary, row.customer) && (
          <Text as="span" color={tokens.textMuted}> · {row.customer}</Text>
        )}
      </SheetCell>
      <SheetCell>{row.assignee}</SheetCell>
      <Box>
        {row.progressNote ? (
          <>
            <SheetCell>{row.progressNote}</SheetCell>
            {row.progressAuthor && (
              <Text fontSize="xs" color={tokens.textFaint} mt={1}>
                {row.progressAuthor}
                {row.progressDraft && (
                  <Badge ml={2} size="sm" colorPalette="yellow" borderRadius="full">임시</Badge>
                )}
              </Text>
            )}
          </>
        ) : (
          <Text fontSize="sm" color={tokens.textFaint}>-</Text>
        )}
      </Box>
    </Box>
  );
}

export default function Dev6JiraSheetTab({
  reports,
  reportsLoading,
  members,
  memberId,
  onMemberIdChange,
}) {
  const { data, isLoading, error } = useDev6TeamJiraIssues();

  const progressMap = useMemo(
    () => buildProgressMap(reports, memberId || null),
    [reports, memberId]
  );

  const jiraTargets = members.filter((m) => m.requiresJiraReport !== false);
  const selectedMember = memberId ? members.find((m) => String(m.id) === String(memberId)) : null;

  const rows = useMemo(() => {
    const issues = data?.issues || [];
    return issues
      .filter((issue) => matchesAssignee(issue.assignee, selectedMember))
      .map((issue) => {
        const progress = progressMap[issue.key];
        return {
          id: issue.key,
          type: issue.type || '-',
          customer: issue.customer || '-',
          createdDate: issue.createdDate || '-',
          updatedDate: issue.updatedDate || '-',
          dueDate: issue.dueDate || '-',
          isDelayed: !!issue.isDelayed,
          key: issue.key,
          summary: issue.summary || '',
          assignee: issue.assignee || '-',
          status: issue.status,
          progressNote: progress?.progressNote || '',
          progressAuthor: progress?.memberName || '',
          progressDraft: progress?.draft,
        };
      });
  }, [data, progressMap, selectedMember]);

  const notedCount = rows.filter((r) => r.progressNote).length;

  return (
    <Box>
      <Text fontSize="sm" color={tokens.textMuted} mb={4} lineHeight="1.6">
        BT Dashboard 개발6팀 기준 JIRA 이슈를 표시합니다. 주간보고에 진행상황을 작성한 항목만 「진행상황」열에 반영됩니다.
      </Text>

      <Flex gap={3} mb={5} flexWrap="wrap" align="flex-end">
        <Box>
          <Text className="app-label">Assignee</Text>
          <AppSelect value={memberId} onChange={(e) => onMemberIdChange(e.target.value)} minW="180px">
            <option value="">전체</option>
            {jiraTargets.map((m) => (
              <option key={m.id} value={m.id}>{m.name} ({m.team})</option>
            ))}
          </AppSelect>
        </Box>
        <Text color={tokens.textMuted} fontSize="sm" fontWeight="500" mb={1}>
          이슈 {rows.length}건 · 진행상황 작성 {notedCount}건
        </Text>
      </Flex>

      {isLoading || reportsLoading ? (
        <Flex justify="center" py={16}><Spinner size="lg" color={tokens.accent} /></Flex>
      ) : error ? (
        <Box p={5} borderRadius={tokens.radius.lg} bg="rgba(248,113,113,0.1)" border="1px solid rgba(248,113,113,0.3)">
          <Text color={tokens.danger} fontSize="sm">
            JIRA 조회 실패: {error.message}
          </Text>
        </Box>
      ) : rows.length === 0 ? (
        <EmptyState
          title="개발6팀 JIRA 이슈 없음"
          description={selectedMember
            ? `${selectedMember.name} Assignee 이슈가 없습니다.`
            : 'JQL 조건에 맞는 진행 중 이슈가 없습니다.'}
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
          <Box overflowX="auto" maxH={{ base: 'calc(100dvh - 460px)', md: 'calc(100vh - 380px)' }} overflowY="auto" w="100%" className="app-scroll-x">
            {rows.map((row) => (
              <JiraSheetRow key={row.id} row={row} />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
