import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Text, Flex, Button, Spinner, Badge, Textarea, Input, Grid,
} from '@chakra-ui/react';
import {
  getWeeklyReports, createWeeklyReport, updateWeeklyReport, submitWeeklyReport, withdrawWeeklyReport,
} from '../../services/reportApi';
import { useMembers, useCurrentPeriod } from '../../hooks/useReports';
import { useMemberSolutionProjects } from '../../hooks/useProjects';
import JiraIssuesPanel from '../Jira/JiraIssuesPanel';
import PageBanner from '../ui/PageBanner';
import { Card } from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import { AppSelect } from '../ui/FilterBar';
import { tokens } from '../../theme/tokens';
import { accomplishmentsOrDefault, accomplishmentsTemplateForProductLine } from '../../utils/weeklyReportTemplate';
import { formatSolutionsLabel } from '../../utils/memberSolutions';
import { formatWeeklyReportMail } from '../../utils/weeklyReportMail';
import { FiEdit3, FiX, FiCopy } from 'react-icons/fi';

const STORAGE_KEY = 'dev6_report_member_id';

function projectKey(projectOrEntry) {
  const code = projectOrEntry.projectCode || '';
  const line = projectOrEntry.productLine || '';
  const id = projectOrEntry.projectId || projectOrEntry.id || '';
  return `${id}|${code}|${line}`;
}

function emptyEntry(project, prevText = '') {
  const productLine = project?.productLine || '';
  return {
    projectId: project?.id || null,
    projectName: project?.name || '',
    projectCode: project?.projectCode || '',
    workType: project?.workType || '프로젝트',
    productLine,
    prevAccomplishments: prevText,
    accomplishments: accomplishmentsTemplateForProductLine(productLine),
    nextPlan: '',
  };
}

function entryFromReport(e) {
  return {
    projectId: e.projectId,
    projectName: e.projectName,
    projectCode: e.projectCode || '',
    workType: e.workType || '프로젝트',
    productLine: e.productLine,
    prevAccomplishments: e.prevAccomplishments || '',
    accomplishments: accomplishmentsOrDefault(e.accomplishments, e.productLine),
    nextPlan: e.nextPlan || '',
  };
}

function buildPrevMap(prevEntries) {
  return Object.fromEntries(
    prevEntries.map((e) => [projectKey(e), e.accomplishments || ''])
  );
}

function resolveSelectedIds(teamProjects, reportEntries, prevEntries) {
  if (reportEntries?.length) {
    const ids = new Set();
    for (const e of reportEntries) {
      const match = teamProjects.find(
        (p) => p.id === e.projectId
          || (p.projectCode === e.projectCode && p.productLine === e.productLine)
      );
      if (match) ids.add(match.id);
    }
    return ids;
  }
  if (prevEntries?.length) {
    const ids = new Set();
    for (const e of prevEntries) {
      const match = teamProjects.find(
        (p) => p.projectCode === e.projectCode && p.productLine === e.productLine
      );
      if (match) ids.add(match.id);
    }
    if (ids.size) return ids;
  }
  return new Set();
}

function MailTextPanel({ mailText, onCopy, copied }) {
  if (!mailText) return null;
  return (
    <Box mt={4} p={4} className="glass-panel" borderRadius={tokens.radius.lg}>
      <Flex justify="space-between" align="center" mb={2} gap={2} flexWrap="wrap">
        <Text fontWeight="700" fontSize="md" color={tokens.accent}>메일 문구</Text>
        <Button
          size="sm"
          className="app-btn-secondary"
          borderRadius="full"
          onClick={() => onCopy(mailText)}
        >
          <FiCopy />
          {copied ? '복사됨' : '클립보드 복사'}
        </Button>
      </Flex>
      <Text fontSize="xs" color={tokens.textMuted} mb={2} lineHeight="1.6">
        제출 후 부팀장에게 보낼 메일 본문입니다. 아래 내용을 복사해 사용하세요.
      </Text>
      <Textarea
        className="app-input"
        value={mailText}
        readOnly
        rows={18}
        fontFamily="inherit"
        fontSize="sm"
        lineHeight="1.7"
      />
    </Box>
  );
}

function buildEntriesFromSelection(teamProjects, selectedIds, prevMap, existingEntries) {
  const existingByKey = Object.fromEntries(existingEntries.map((e) => [projectKey(e), e]));
  return teamProjects
    .filter((p) => selectedIds.has(p.id))
    .map((p) => {
      const key = projectKey(p);
      if (existingByKey[key]) return existingByKey[key];
      return emptyEntry(p, prevMap[key] || '');
    });
}

export default function MyWeeklyReportPanel({ year }) {
  const queryClient = useQueryClient();
  const { data: period } = useCurrentPeriod();
  const { data: members = [] } = useMembers();
  const [memberId, setMemberId] = useState(() => localStorage.getItem(STORAGE_KEY) || '');
  const [modalOpen, setModalOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [entries, setEntries] = useState([]);
  const [jiraEntries, setJiraEntries] = useState([]);
  const [jiraCompleted, setJiraCompleted] = useState(false);
  const [issues, setIssues] = useState('');
  const [error, setError] = useState('');
  const [showMailPreview, setShowMailPreview] = useState(false);
  const [mailCopied, setMailCopied] = useState(false);

  const week = period?.week;
  const member = members.find((m) => String(m.id) === memberId);
  const { data: teamProjects = [], isLoading: projectsLoading } = useMemberSolutionProjects(memberId ? Number(memberId) : null);

  useEffect(() => {
    if (memberId) localStorage.setItem(STORAGE_KEY, memberId);
  }, [memberId]);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['weeklyReports', 'my', year, week, memberId],
    queryFn: () => getWeeklyReports({ year, week, memberId }),
    enabled: !!week && !!memberId,
  });

  const myReport = reports[0] || null;

  const { data: prevWeekReports = [] } = useQuery({
    queryKey: ['weeklyReports', 'prev', year, week && week > 1 ? week - 1 : null, memberId],
    queryFn: () => getWeeklyReports({ year, week: week - 1, memberId }),
    enabled: !!week && week > 1 && !!memberId && !myReport,
  });

  const prevMap = useMemo(
    () => buildPrevMap(prevWeekReports[0]?.entries || []),
    [prevWeekReports]
  );

  const filteredProjects = useMemo(() => {
    const q = projectSearch.trim().toLowerCase();
    if (!q) return teamProjects;
    return teamProjects.filter(
      (p) =>
        (p.projectCode || '').toLowerCase().includes(q)
        || (p.name || '').toLowerCase().includes(q)
        || (p.customer || '').toLowerCase().includes(q)
    );
  }, [teamProjects, projectSearch]);

  const groupedProjects = useMemo(() => {
    const groups = { 프로젝트: [], 제품개발: [], 유지보수: [] };
    for (const p of filteredProjects) {
      const type = ['프로젝트', '제품개발', '유지보수'].includes(p.workType) ? p.workType : '프로젝트';
      groups[type].push(p);
    }
    return groups;
  }, [filteredProjects]);

  const submittedMailText = useMemo(() => {
    if (!myReport?.entries?.length) return '';
    return formatWeeklyReportMail({
      memberName: member?.name,
      weekStartDate: myReport.weekStartDate,
      entries: myReport.entries,
    });
  }, [myReport, member?.name]);

  const draftMailText = useMemo(() => {
    if (!entries.length) return '';
    return formatWeeklyReportMail({
      memberName: member?.name,
      weekStartDate: myReport?.weekStartDate || period?.weekStartDate,
      entries,
    });
  }, [entries, member?.name, myReport?.weekStartDate, period?.weekStartDate]);

  const copyMailText = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setMailCopied(true);
      setTimeout(() => setMailCopied(false), 2000);
    } catch {
      setError('클립보드 복사에 실패했습니다. 메일 문구를 직접 선택해 복사하세요.');
    }
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['weeklyReports'] });
    queryClient.invalidateQueries({ queryKey: ['statistics'] });
    queryClient.invalidateQueries({ queryKey: ['submissionRoster'] });
    queryClient.invalidateQueries({ queryKey: ['projectCodeStats'] });
  };

  const closeModal = () => {
    setModalOpen(false);
    setShowMailPreview(false);
  };

  const buildBody = () => ({
    memberId: Number(memberId),
    reportYear: year,
    reportWeek: week,
    issues,
    jiraCompleted,
    entries: entries.map((e, i) => ({ ...e, sortOrder: i })),
    jiraEntries,
  });

  const saveMutation = useMutation({
    mutationFn: async ({ submitAfterSave }) => {
      const body = buildBody();
      let saved = myReport
        ? await updateWeeklyReport(myReport.id, body)
        : await createWeeklyReport(body);
      if (submitAfterSave) saved = await submitWeeklyReport(saved.id);
      return saved;
    },
    onSuccess: () => {
      invalidate();
      closeModal();
      setError('');
    },
    onError: (e) => setError(e.message),
  });

  const toggleProject = (project) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(project.id)) next.delete(project.id);
      else next.add(project.id);
      return next;
    });
  };

  useEffect(() => {
    if (!modalOpen) return;
    setEntries((prev) => buildEntriesFromSelection(teamProjects, selectedIds, prevMap, prev));
  }, [selectedIds, teamProjects, prevMap, modalOpen]);

  const openWrite = () => {
    setError('');
    setProjectSearch('');
    setShowMailPreview(false);

    if (myReport) {
      const reportEntries = myReport.entries?.map(entryFromReport) || [];
      setSelectedIds(resolveSelectedIds(teamProjects, reportEntries, []));
      setEntries(reportEntries);
      setJiraEntries(myReport.jiraEntries || []);
      setJiraCompleted(!!myReport.jiraCompleted);
      setIssues(myReport.issues || '');
    } else {
      const prevEntries = prevWeekReports[0]?.entries || [];
      setSelectedIds(resolveSelectedIds(teamProjects, [], prevEntries));
      setEntries([]);
      setJiraEntries([]);
      setJiraCompleted(false);
      setIssues('');
    }
    setModalOpen(true);
  };

  const withdrawMutation = useMutation({
    mutationFn: () => withdrawWeeklyReport(myReport.id),
    onSuccess: (withdrawn) => {
      invalidate();
      setError('');
      setShowMailPreview(false);
      setProjectSearch('');
      const reportEntries = withdrawn.entries?.map(entryFromReport) || [];
      setSelectedIds(resolveSelectedIds(teamProjects, reportEntries, []));
      setEntries(reportEntries);
      setJiraEntries(withdrawn.jiraEntries || []);
      setJiraCompleted(!!withdrawn.jiraCompleted);
      setIssues(withdrawn.issues || '');
      setModalOpen(true);
    },
    onError: (e) => setError(e.message),
  });

  const submitOnlyMutation = useMutation({
    mutationFn: () => submitWeeklyReport(myReport.id),
    onSuccess: () => {
      invalidate();
      setError('');
      closeModal();
    },
    onError: (e) => setError(e.message),
  });

  const isSubmitted = myReport?.status === 'SUBMITTED';
  const submitTogglePending = withdrawMutation.isPending || submitOnlyMutation.isPending;

  const handleSubmitToggle = () => {
    if (!myReport?.id) return;
    if (isSubmitted) withdrawMutation.mutate();
    else submitOnlyMutation.mutate();
  };

  const updateEntry = (idx, field, value) => {
    setEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e)));
  };

  const statusLabel = () => {
    if (!myReport) return { text: '미작성', color: 'orange' };
    if (myReport.status === 'SUBMITTED') return { text: '제출 완료', color: 'green' };
    return { text: '임시저장 중', color: 'yellow' };
  };

  const st = statusLabel();
  const partLabel = member?.team || '파트 미지정';
  const solutionsLabel = formatSolutionsLabel(member?.assignedProductLines);

  return (
    <Box w="100%">
      <PageBanner
        icon={FiEdit3}
        title="팀원 주간보고"
        description="담당 솔루션 프로젝트를 선택하고 이번 주 실적을 작성합니다. 매주 화요일까지 제출해 주세요."
      />

      {!modalOpen && (
        <Grid templateColumns={{ base: '1fr', md: 'minmax(220px, 280px) 1fr' }} gap={5} mb={5} alignItems="start">
          <Box>
            <Text fontSize="sm" color={tokens.textMuted} mb={2} fontWeight="500">내 이름</Text>
            <AppSelect
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">선택하세요</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.team})</option>
              ))}
            </AppSelect>
          </Box>
          {memberId && member && (
            <Flex gap={2} flexWrap="wrap" pt={{ md: 7 }}>
              <Badge colorPalette="purple" borderRadius="full" px={3} py={1}>{partLabel}</Badge>
              <Badge colorPalette="cyan" borderRadius="full" px={3} py={1}>{solutionsLabel}</Badge>
              <Badge colorPalette="gray" borderRadius="full" px={3} py={1}>{teamProjects.length}개 프로젝트</Badge>
            </Flex>
          )}
        </Grid>
      )}

      {!memberId && !modalOpen && (
        <EmptyState title="이름을 선택해 주세요" description="선택하면 이번 주 보고를 작성할 수 있습니다." />
      )}

      {memberId && !modalOpen && (
        <Card strong>
          {period && (
            <Text color={tokens.textMuted} fontSize="sm" mb={3}>
              {year}년 {week}주차 · {period.weekStartDate} ~ {period.weekEndDate}
            </Text>
          )}

          {isLoading ? (
            <Flex justify="center" py={8}><Spinner color={tokens.accent} /></Flex>
          ) : (
            <>
              <Flex align="center" gap={3} mb={4} flexWrap="wrap">
                <Text fontSize="xl" fontWeight="700" letterSpacing="-0.02em">{member?.name}님</Text>
                <Badge colorPalette={st.color} size="lg" borderRadius="full" px={3}>{st.text}</Badge>
              </Flex>

              {error && !modalOpen && (
                <Text color="red.300" fontSize="sm" mb={4}>{error}</Text>
              )}

              {myReport?.status === 'SUBMITTED' ? (
                <Box>
                  <Text color={tokens.textMuted} mb={4} fontSize="sm">
                    제출이 완료되었습니다. 수정이 필요하면 제출 취소 후 다시 작성하세요.
                  </Text>

                  {member?.requiresJiraReport && (
                    <Box mb={4}>
                      <JiraIssuesPanel
                        memberId={Number(memberId)}
                        memberName={member?.name}
                        jiraEntries={myReport.jiraEntries || []}
                        readOnly
                      />
                      {myReport.jiraCompleted && (
                        <Flex align="center" gap={2} mt={2}>
                          <Badge colorPalette="green" borderRadius="full" px={3}>JIRA 업데이트 완료</Badge>
                        </Flex>
                      )}
                    </Box>
                  )}

                  <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={4}>
                    {(myReport.entries || []).map((e, i) => (
                      <Box key={i} p={4} className="glass-panel" borderRadius={tokens.radius.lg}>
                        <Flex gap={2} mb={2} flexWrap="wrap" align="center">
                          <Badge colorPalette="purple" borderRadius="full">{e.productLine}</Badge>
                          <Text fontWeight="600" fontSize="sm" color={tokens.text}>{e.projectName}</Text>
                        </Flex>
                        <Text fontSize="sm" color={tokens.text} whiteSpace="pre-wrap" lineHeight="1.7">
                          {e.accomplishments || '-'}
                        </Text>
                      </Box>
                    ))}
                  </Grid>
                  <Flex mt={4} gap={3} flexWrap="wrap">
                    <Button
                      className="app-btn-secondary"
                      size="md"
                      borderRadius="full"
                      onClick={openWrite}
                    >
                      내용 확인
                    </Button>
                    <Button
                      className="app-btn-secondary"
                      size="md"
                      borderRadius="full"
                      onClick={() => setShowMailPreview((v) => !v)}
                      disabled={!submittedMailText}
                    >
                      {showMailPreview ? '메일 문구 숨기기' : '메일 문구 보기'}
                    </Button>
                    <Button
                      className="app-btn-draft"
                      size="md"
                      borderRadius="full"
                      onClick={handleSubmitToggle}
                      loading={submitTogglePending}
                    >
                      제출 취소
                    </Button>
                  </Flex>
                  {showMailPreview && (
                    <MailTextPanel mailText={submittedMailText} onCopy={copyMailText} copied={mailCopied} />
                  )}
                </Box>
              ) : (
                <Flex gap={3} flexWrap="wrap">
                  <Button colorPalette="purple" size="lg" borderRadius="full" onClick={openWrite} boxShadow="0 8px 24px rgba(99,102,241,0.25)">
                    {myReport ? '이어서 작성' : '이번 주 보고 작성'}
                  </Button>
                  {myReport && (
                    <Button
                      colorPalette="green"
                      size="lg"
                      borderRadius="full"
                      onClick={handleSubmitToggle}
                      loading={submitTogglePending}
                      boxShadow="0 4px 16px rgba(74, 222, 128, 0.2)"
                    >
                      제출 완료
                    </Button>
                  )}
                </Flex>
              )}

              {member?.requiresJiraReport && (
                <Text fontSize="sm" color={tokens.textMuted} mt={4} lineHeight="1.6">
                  JIRA 담당 이슈 진행상황도 JIRA에서 업데이트 후, 보고 작성 시 요약을 입력해 주세요.
                </Text>
              )}
            </>
          )}
        </Card>
      )}

      {memberId && modalOpen && (
        <Box
          className="glass-panel-strong"
          borderRadius={tokens.radius['2xl']}
          border="1px solid"
          borderColor={tokens.borderStrong}
          overflow="hidden"
        >
          <Flex
            px={{ base: 4, lg: 6 }}
            py={4}
            borderBottom="1px solid"
            borderColor={tokens.border}
            justify="space-between"
            align="center"
            flexWrap="wrap"
            gap={3}
            bg={tokens.bgElevated}
          >
            <Box>
              <Text fontSize="lg" fontWeight="700" letterSpacing="-0.02em">
                {year}년 {week}주차 — {member?.name}
              </Text>
              <Text fontSize="sm" color={tokens.textMuted} mt={0.5}>
                {partLabel} · 담당 {solutionsLabel}
              </Text>
            </Box>
            <Button
              className="app-btn-secondary"
              size="sm"
              borderRadius="full"
              onClick={closeModal}
            >
              <FiX />
              닫기
            </Button>
          </Flex>

          {error && (
            <Box px={5} py={3} bg="rgba(248, 113, 113, 0.12)" borderBottom="1px solid" borderColor={tokens.border}>
              <Text color="red.300" fontSize="sm">{error}</Text>
            </Box>
          )}

          {member?.requiresJiraReport && (
            <Box
              px={{ base: 4, lg: 6 }}
              py={4}
              borderBottom="1px solid"
              borderColor={tokens.borderStrong}
              bg={tokens.surface}
            >
              <JiraIssuesPanel
                memberId={Number(memberId)}
                memberName={member?.name}
                jiraEntries={jiraEntries}
                onJiraEntriesChange={myReport?.status === 'SUBMITTED' ? undefined : setJiraEntries}
                readOnly={myReport?.status === 'SUBMITTED'}
              />
              {myReport?.status === 'SUBMITTED' ? (
                myReport.jiraCompleted && (
                  <Flex align="center" gap={2} mt={3}>
                    <Badge colorPalette="green" borderRadius="full" px={3}>JIRA 업데이트 완료</Badge>
                  </Flex>
                )
              ) : (
                <Flex align="center" gap={2} mt={3}>
                  <input
                    type="checkbox"
                    checked={jiraCompleted}
                    onChange={(e) => setJiraCompleted(e.target.checked)}
                    id="my-jira-done"
                    style={{ accentColor: tokens.accentStrong }}
                  />
                  <Text as="label" htmlFor="my-jira-done" fontSize="sm" fontWeight="500">
                    JIRA 진행상황 업데이트 완료
                  </Text>
                </Flex>
              )}
            </Box>
          )}

          <Grid
            templateColumns={{ base: '1fr', xl: 'minmax(300px, 380px) 1fr' }}
            minH={{ xl: member?.requiresJiraReport ? 'calc(100vh - 380px)' : 'calc(100vh - 220px)' }}
            maxH={{ xl: member?.requiresJiraReport ? 'calc(100vh - 320px)' : 'calc(100vh - 160px)' }}
          >
            {/* 좌측: 프로젝트 선택 */}
            <Box
              borderRight={{ xl: '1px solid' }}
              borderColor={tokens.border}
              overflowY="auto"
              p={{ base: 4, lg: 5 }}
              bg={tokens.surface}
              maxH={{ base: 'none', xl: 'inherit' }}
            >
              <Text fontWeight="700" color={tokens.accent} mb={1} fontSize="md">프로젝트 선택</Text>
              <Flex justify="space-between" align="center" mb={3} gap={2}>
                <Text fontSize="sm" color={tokens.textMuted}>담당 솔루션 프로젝트</Text>
                <Badge colorPalette="purple" borderRadius="full">{selectedIds.size}건</Badge>
              </Flex>
              <Input
                className="app-input"
                placeholder="코드·프로젝트명 검색"
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                mb={3}
                size="sm"
              />
              {projectsLoading ? (
                <Flex justify="center" py={6}><Spinner size="sm" color={tokens.accent} /></Flex>
              ) : teamProjects.length === 0 ? (
                <Text fontSize="sm" color={tokens.warning}>
                  등록된 프로젝트가 없습니다. 「프로젝트 코드」 또는 「팀원 관리」에서 담당 솔루션을 확인하세요.
                </Text>
              ) : (
                <Box>
                  {['프로젝트', '유지보수', '제품개발'].map((type) => {
                    const list = groupedProjects[type];
                    if (!list?.length) return null;
                    return (
                      <Box key={type} mb={4}>
                        <Text fontSize="xs" color={tokens.textMuted} mb={2} fontWeight="700" textTransform="uppercase" letterSpacing="0.04em">
                          {type} · {list.length}
                        </Text>
                        {list.map((p) => {
                          const selected = selectedIds.has(p.id);
                          return (
                            <Flex
                              key={p.id}
                              align="center"
                              gap={2}
                              py={2}
                              px={2}
                              mb={1}
                              borderRadius="10px"
                              bg={selected ? tokens.accentSoft : 'transparent'}
                              border="1px solid"
                              borderColor={selected ? 'rgba(129, 140, 248, 0.45)' : 'transparent'}
                              _hover={{ bg: tokens.surfaceHover }}
                              cursor="pointer"
                              onClick={() => toggleProject(p)}
                            >
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => toggleProject(p)}
                                onClick={(e) => e.stopPropagation()}
                                style={{ accentColor: tokens.accentStrong, flexShrink: 0 }}
                              />
                              <Box flex="1" minW={0}>
                                <Flex gap={1.5} align="center" mb={0.5} flexWrap="wrap">
                                  <Text fontFamily="mono" fontSize="xs" fontWeight="700" color={tokens.cyan}>{p.projectCode}</Text>
                                  <Badge size="sm" colorPalette="purple" borderRadius="full">{p.productLine}</Badge>
                                </Flex>
                                <Text fontSize="sm" fontWeight="600" color={tokens.text} lineHeight="1.35" lineClamp={2}>
                                  {p.name}
                                </Text>
                              </Box>
                            </Flex>
                          );
                        })}
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>

            {/* 우측: 실적 작성 */}
            <Box overflowY="auto" p={{ base: 4, lg: 6 }} maxH={{ base: 'none', xl: 'inherit' }}>
              <Flex justify="space-between" align="center" mb={4} flexWrap="wrap" gap={2}>
                <Text fontWeight="700" fontSize="md" color={tokens.text}>실적 작성</Text>
                <Badge colorPalette="cyan" borderRadius="full">{entries.length}건 선택</Badge>
              </Flex>

              {entries.length === 0 ? (
                <Box py={12} textAlign="center" className="glass-panel" borderRadius={tokens.radius.lg}>
                  <Text fontSize="sm" color={tokens.textMuted}>
                    프로젝트를 선택하면 실적 작성란이 표시됩니다. 선택 없이 특이사항·JIRA만 저장·제출할 수 있습니다.
                  </Text>
                </Box>
              ) : (
                entries.map((entry, idx) => (
                  <Box key={projectKey(entry)} mb={4} p={4} className="glass-panel" borderRadius={tokens.radius.lg} border="1px solid" borderColor={tokens.border}>
                    <Flex gap={2} mb={3} flexWrap="wrap" align="center" lineHeight="1.35">
                      {entry.projectCode && (
                        <Text fontSize="xs" fontWeight="700" color={tokens.cyan} fontFamily="mono" flexShrink={0}>
                          {entry.projectCode}
                        </Text>
                      )}
                      <Badge colorPalette="purple" borderRadius="full" flexShrink={0}>{entry.productLine}</Badge>
                      <Text fontWeight="700" fontSize="md" color={tokens.text} flex="1" minW={0}>
                        {entry.projectName || '프로젝트'}
                      </Text>
                    </Flex>
                    <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={3} mb={3}>
                      <Box>
                        <Text className="app-label">전주 실적 (참고)</Text>
                        <Textarea className="app-input" value={entry.prevAccomplishments} onChange={(e) => updateEntry(idx, 'prevAccomplishments', e.target.value)} rows={4} fontSize="sm" />
                      </Box>
                      <Box>
                        <Text className="app-label">차주 계획</Text>
                        <Textarea className="app-input" value={entry.nextPlan} onChange={(e) => updateEntry(idx, 'nextPlan', e.target.value)} rows={4} fontSize="sm" />
                      </Box>
                    </Grid>
                    <Text className="app-label">금주 실적 *</Text>
                    <Textarea className="app-input" value={entry.accomplishments} onChange={(e) => updateEntry(idx, 'accomplishments', e.target.value)} rows={6} fontFamily="inherit" fontSize="sm" lineHeight="1.6" />
                  </Box>
                ))
              )}

              <Box mt={4} p={4} className="glass-panel" borderRadius={tokens.radius.lg}>
                <Text className="app-label">특이사항</Text>
                <Textarea className="app-input" value={issues} onChange={(e) => setIssues(e.target.value)} rows={2} />
              </Box>
            </Box>
          </Grid>

          {showMailPreview && (
            <Box px={{ base: 4, lg: 6 }} pb={2}>
              <MailTextPanel mailText={draftMailText} onCopy={copyMailText} copied={mailCopied} />
            </Box>
          )}

          <Flex
            px={{ base: 4, lg: 6 }}
            py={4}
            borderTop="1px solid"
            borderColor={tokens.borderStrong}
            justify="space-between"
            align="center"
            gap={3}
            flexWrap="wrap"
            bg={tokens.bgElevated}
            position="sticky"
            bottom={0}
            zIndex={10}
            boxShadow="0 -10px 28px rgba(0, 0, 0, 0.45)"
          >
            <Button
              className="app-btn-secondary"
              size="md"
              borderRadius="full"
              onClick={() => setShowMailPreview((v) => !v)}
              disabled={!draftMailText}
            >
              {showMailPreview ? '메일 문구 숨기기' : '메일 문구 보기'}
            </Button>
            <Flex gap={3} flexWrap="wrap" justify="flex-end">
            <Button className="app-btn-secondary" size="md" borderRadius="full" minW="88px" onClick={closeModal}>
              닫기
            </Button>
            <Button
              className="app-btn-draft"
              size="md"
              borderRadius="full"
              minW="100px"
              onClick={() => saveMutation.mutate({ submitAfterSave: false })}
              loading={saveMutation.isPending}
            >
              임시저장
            </Button>
            <Button
              colorPalette="purple"
              size="md"
              borderRadius="full"
              minW="100px"
              fontWeight="700"
              onClick={() => saveMutation.mutate({ submitAfterSave: true })}
              loading={saveMutation.isPending}
              boxShadow="0 4px 16px rgba(99,102,241,0.35)"
            >
              제출 완료
            </Button>
            </Flex>
          </Flex>
        </Box>
      )}
    </Box>
  );
}
