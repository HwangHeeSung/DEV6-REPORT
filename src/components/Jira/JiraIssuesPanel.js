import { useEffect } from 'react';
import { Box, Text, Flex, Spinner, Badge, Link, Input } from '@chakra-ui/react';
import { useMemberJiraIssues } from '../../hooks/useProjects';
import { Card } from '../ui/Card';
import { tokens } from '../../theme/tokens';
import { shouldShowCustomer } from '../../utils/displayLabel';

const JIRA_BASE = process.env.REACT_APP_JIRA_BASE_URL || 'http://qa.bridgetec.co.kr/jira/browse';

export default function JiraIssuesPanel({ memberId, memberName, jiraEntries = [], onJiraEntriesChange, readOnly = false }) {
  const { data, isLoading, error } = useMemberJiraIssues(memberId, !!memberId && !readOnly);

  useEffect(() => {
    if (!data?.issues?.length || readOnly || !onJiraEntriesChange) return;
    if (jiraEntries.length > 0) return;
    onJiraEntriesChange(data.issues.map((issue) => ({
      issueKey: issue.key,
      issueSummary: issue.summary,
      customer: issue.customer,
      component: issue.type,
      assigneeName: issue.assignee,
      progressNote: '',
      status: issue.status,
    })));
  }, [data, readOnly, onJiraEntriesChange, jiraEntries.length]);

  const updateNote = (issueKey, progressNote) => {
    if (!onJiraEntriesChange) return;
    const next = jiraEntries.map((e) => (
      e.issueKey === issueKey ? { ...e, progressNote: progressNote.slice(0, 100) } : e
    ));
    onJiraEntriesChange(next);
  };

  const displayIssues = readOnly
    ? jiraEntries
    : (jiraEntries.length > 0 ? jiraEntries : (data?.issues || []).map((issue) => {
        const existing = jiraEntries.find((e) => e.issueKey === issue.key);
        return existing || {
          issueKey: issue.key,
          issueSummary: issue.summary,
          customer: issue.customer,
          component: issue.type,
          assigneeName: issue.assignee,
          progressNote: '',
          status: issue.status,
        };
      }));

  if (!memberId) {
    return (
      <Card p={4}>
        <Text color={tokens.textFaint} fontSize="sm">작성자를 선택하면 JIRA Assignee 이슈가 표시됩니다.</Text>
      </Card>
    );
  }

  return (
    <Card strong p={4}>
      <Text fontWeight="700" fontSize="md" color={tokens.text} mb={1}>JIRA 진행상황 (필수-팀원 JIRA)</Text>
      <Text fontSize="sm" color={tokens.textMuted} mb={3} lineHeight="1.6">
        본인 assignee와 일치하는 항목입니다. 진행상황을 15자로 요약하세요.
      </Text>

      {isLoading && !readOnly && <Flex justify="center" py={4}><Spinner size="sm" color={tokens.accent} /></Flex>}

      {error && !readOnly && (
        <Text fontSize="sm" color={tokens.warning} mb={2}>
          JIRA 조회 실패: {error.message}
          {error.message?.includes('JIRA_USERNAME') || error.message?.includes('JIRA_PASSWORD')
            ? ' — 백엔드 Jira 로그인(JIRA_USERNAME/JIRA_PASSWORD)을 확인하세요. BT Dashboard와 동일 계정입니다.'
            : ''}
        </Text>
      )}

      {displayIssues.length > 0 && (
        <Box maxH={readOnly ? 'none' : '280px'} overflowY={readOnly ? 'visible' : 'auto'}>
          {displayIssues.map((issue) => (
            <Box key={issue.issueKey} py={1.5} borderBottom="1px solid" borderColor={tokens.border}>
              <Flex gap={2} align="center" flexWrap="wrap" mb={1} lineHeight="1.35">
                <Link href={`${JIRA_BASE}/${issue.issueKey}`} target="_blank" color={tokens.cyan} fontSize="sm" fontWeight="600" flexShrink={0}>
                  {issue.issueKey}
                </Link>
                <Badge size="sm" colorPalette="purple" borderRadius="full" flexShrink={0}>{issue.status}</Badge>
                <Text fontSize="md" fontWeight="600" color={tokens.text} flex="1" minW={0}>
                  {issue.issueSummary}
                  {shouldShowCustomer(issue.issueSummary, issue.customer) && (
                    <Text as="span" fontWeight="500" color={tokens.textMuted}> · {issue.customer}</Text>
                  )}
                </Text>
              </Flex>
              {!readOnly ? (
                <Input
                  size="sm"
                  className="app-input"
                  placeholder="진행상황 요약 (15자)"
                  value={issue.progressNote || ''}
                  onChange={(e) => updateNote(issue.issueKey, e.target.value)}
                  maxLength={100}
                />
              ) : (
                <Text fontSize="sm" color={tokens.text} fontWeight="500">
                  진행: {issue.progressNote || '-'}
                </Text>
              )}
            </Box>
          ))}
        </Box>
      )}

      {!isLoading && displayIssues.length === 0 && (
        <Text fontSize="sm" color={tokens.textFaint}>진행 중인 Assignee 이슈가 없습니다.</Text>
      )}
    </Card>
  );
}
