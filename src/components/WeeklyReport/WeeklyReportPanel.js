import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Text, Flex, Button, Spinner, Badge, Textarea, Input, Grid,
  DialogRoot, DialogBackdrop, DialogPositioner, DialogContent,
  DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogCloseTrigger,
} from '@chakra-ui/react';
import { FiFileText } from 'react-icons/fi';
import {
  getWeeklyReports, createWeeklyReport, updateWeeklyReport, submitWeeklyReport, withdrawWeeklyReport, deleteWeeklyReport,
} from '../../services/reportApi';
import { useMembers, useCurrentPeriod } from '../../hooks/useReports';
import { useMemberProjects } from '../../hooks/useProjects';
import JiraIssuesPanel from '../Jira/JiraIssuesPanel';
import ProjectParticipantPicker, { isProjectWorkType } from './ProjectParticipantPicker';
import PageBanner from '../ui/PageBanner';
import { Card } from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import { FilterBar, AppSelect, SegmentedControl } from '../ui/FilterBar';
import { tokens } from '../../theme/tokens';
import { accomplishmentsOrDefault, accomplishmentsTemplateForProductLine } from '../../utils/weeklyReportTemplate';

const PART_FILTERS = [
  { value: '', label: '전체' },
  { value: 'SWAT', label: '1파트 SWAT' },
  { value: 'ARGO', label: '2파트 ARGO' },
  { value: 'RSM', label: '2파트 RSM' },
  { value: 'IPRON CTI', label: 'IPRON CTI' },
];

const PRODUCT_LINES = ['SWAT', 'ARGO', 'RSM', 'IPRON CTI'];
const WORK_TYPES = ['프로젝트', '유지보수'];

const selectStyle = {
  background: tokens.surfaceStrong,
  color: tokens.text,
  padding: '10px 14px',
  borderRadius: '10px',
  border: `1px solid ${tokens.border}`,
  fontSize: '14px',
};

function StatusBadge({ status }) {
  return (
    <Badge colorPalette={status === 'SUBMITTED' ? 'green' : 'yellow'} borderRadius="full">
      {status === 'SUBMITTED' ? '제출완료' : '임시저장'}
    </Badge>
  );
}

function emptyEntry(project) {
  const productLine = project?.productLine || '';
  return {
    projectId: project?.id || null,
    projectName: project?.name || '',
    projectCode: project?.projectCode || '',
    workType: project?.workType || '프로젝트',
    productLine,
    prevAccomplishments: '',
    accomplishments: accomplishmentsTemplateForProductLine(productLine),
    nextPlan: '',
    participantMemberIds: [],
  };
}

function buildEntriesFromProjects(projects) {
  if (!projects?.length) return [emptyEntry()];
  return projects.map((p) => emptyEntry(p));
}

export default function WeeklyReportPanel({ year }) {
  const queryClient = useQueryClient();
  const [week, setWeek] = useState(null);
  const [memberId, setMemberId] = useState('');
  const [productLine, setProductLine] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formMemberId, setFormMemberId] = useState('');
  const [entries, setEntries] = useState([emptyEntry()]);
  const [jiraEntries, setJiraEntries] = useState([]);
  const [jiraCompleted, setJiraCompleted] = useState(false);
  const [issues, setIssues] = useState('');
  const [error, setError] = useState('');

  const { data: period } = useCurrentPeriod();
  const { data: members = [] } = useMembers();
  const effectiveWeek = week ?? period?.week;
  const formMember = members.find((m) => String(m.id) === formMemberId);
  const { data: memberProjects = [] } = useMemberProjects(formMemberId ? Number(formMemberId) : null);

  useEffect(() => {
    if (modalOpen && !editing && memberProjects.length > 0) {
      setEntries(buildEntriesFromProjects(memberProjects));
    }
  }, [modalOpen, editing, memberProjects]);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['weeklyReports', year, effectiveWeek, memberId, productLine],
    queryFn: () => getWeeklyReports({
      year,
      week: effectiveWeek,
      memberId: memberId || undefined,
      productLine: productLine || undefined,
    }),
    enabled: !!effectiveWeek,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['weeklyReports'] });
    queryClient.invalidateQueries({ queryKey: ['statistics'] });
    queryClient.invalidateQueries({ queryKey: ['submissionRoster'] });
    queryClient.invalidateQueries({ queryKey: ['projectCodeStats'] });
  };

  const buildBody = () => ({
    memberId: Number(formMemberId),
    reportYear: year,
    reportWeek: effectiveWeek,
    issues,
    jiraCompleted,
    entries: entries.map((e, i) => ({
      projectId: e.projectId,
      projectName: e.projectName,
      projectCode: e.projectCode,
      workType: e.workType,
      productLine: e.productLine,
      prevAccomplishments: e.prevAccomplishments,
      accomplishments: e.accomplishments,
      nextPlan: e.nextPlan,
      participantMemberIds: e.participantMemberIds || [],
      sortOrder: i,
    })),
    jiraEntries,
  });

  const saveMutation = useMutation({
    mutationFn: async ({ submitAfterSave }) => {
      const body = buildBody();
      let saved = editing
        ? await updateWeeklyReport(editing.id, body)
        : await createWeeklyReport(body);
      if (submitAfterSave) saved = await submitWeeklyReport(saved.id);
      return saved;
    },
    onSuccess: () => {
      invalidate();
      setModalOpen(false);
      setEditing(null);
      setEntries([emptyEntry()]);
      setJiraEntries([]);
      setJiraCompleted(false);
      setIssues('');
      setError('');
    },
    onError: (e) => setError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWeeklyReport,
    onSuccess: invalidate,
  });

  const openCreate = () => {
    setEditing(null);
    const mid = memberId || members[0]?.id?.toString() || '';
    setFormMemberId(mid);
    setEntries([emptyEntry()]);
    setJiraEntries([]);
    setJiraCompleted(false);
    setIssues('');
    setError('');
    setModalOpen(true);
  };

  const openEdit = (report) => {
    setEditing(report);
    setFormMemberId(String(report.memberId));
    setEntries(
      report.entries?.length
        ? report.entries.map((e) => ({
            projectId: e.projectId,
            projectName: e.projectName,
            projectCode: e.projectCode || '',
            workType: e.workType || '프로젝트',
            productLine: e.productLine,
            prevAccomplishments: e.prevAccomplishments || '',
            accomplishments: accomplishmentsOrDefault(e.accomplishments, e.productLine),
            nextPlan: e.nextPlan || '',
            participantMemberIds: e.participantMemberIds || [],
          }))
        : [emptyEntry()]
    );
    setJiraEntries(report.jiraEntries || []);
    setJiraCompleted(!!report.jiraCompleted);
    setIssues(report.issues || '');
    setError('');
    setModalOpen(true);
  };

  const updateEntry = (idx, field, value) => {
    setEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e)));
  };

  const updateParticipants = (idx, participantMemberIds) => {
    setEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, participantMemberIds } : e)));
  };

  const addEntry = () => setEntries((prev) => [...prev, emptyEntry()]);

  return (
    <Box>
      <PageBanner
        icon={FiFileText}
        title="전체 주간보고"
        description="매주 화요일 — (필수-팀원) 개발6팀 시트: 프로젝트·솔루션별 전주/금주/차주 실적. JIRA 시트: Assignee 이슈 진행상황 업데이트."
      />

      <FilterBar>
        <Box>
          <Text className="app-label">주차</Text>
          <AppSelect value={effectiveWeek ?? ''} onChange={(e) => setWeek(Number(e.target.value))}>
            {Array.from({ length: period?.week || 1 }, (_, i) => i + 1).map((w) => (
              <option key={w} value={w}>{w}주차</option>
            ))}
          </AppSelect>
        </Box>
        <Box>
          <Text className="app-label">멤버</Text>
          <AppSelect value={memberId} onChange={(e) => setMemberId(e.target.value)} minW="160px">
            <option value="">전체</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name} ({m.team})</option>
            ))}
          </AppSelect>
        </Box>
        <Box flex={1} minW="280px">
          <Text className="app-label">솔루션</Text>
          <SegmentedControl options={PART_FILTERS} value={productLine} onChange={setProductLine} />
        </Box>
        <Button colorPalette="purple" borderRadius="full" alignSelf="flex-end" onClick={openCreate} boxShadow="0 4px 16px rgba(99,102,241,0.25)">
          + 주간 보고 작성
        </Button>
      </FilterBar>

      {isLoading ? (
        <Flex justify="center" py={12}><Spinner color={tokens.accent} /></Flex>
      ) : reports.length === 0 ? (
        <EmptyState title={`${year}년 ${effectiveWeek}주차 보고 없음`} description="아직 작성된 주간보고가 없습니다." />
      ) : (
        <Box display="flex" flexDirection="column" gap={3}>
          {reports.map((r) => (
            <Card key={r.id} hover p={5}>
              <Flex justify="space-between" align="start" mb={3}>
                <Box>
                  <Text fontWeight="700" letterSpacing="-0.02em">
                    {r.memberName}
                    <Text as="span" color={tokens.textFaint} fontSize="sm" fontWeight="500"> ({r.memberTeam || '-'})</Text>
                  </Text>
                  <Text fontSize="sm" color={tokens.textMuted}>
                    {r.weekStartDate} ~ {r.weekEndDate} · {r.reportYear}년 {r.reportWeek}주차
                  </Text>
                </Box>
                <StatusBadge status={r.status} />
              </Flex>

              {(r.entries || []).map((e, i) => (
                <Box key={e.id || i} mb={3} pl={4} borderLeft="3px solid" borderColor={tokens.accent}>
                  <Flex gap={2} align="center" mb={1} flexWrap="wrap">
                    <Badge colorPalette="gray" borderRadius="full">{e.workType || '프로젝트'}</Badge>
                    <Badge colorPalette="purple" borderRadius="full">{e.productLine}</Badge>
                    {e.projectCode && <Badge colorPalette="blue" borderRadius="full">{e.projectCode}</Badge>}
                    <Text fontWeight="600" fontSize="sm">{e.projectName}</Text>
                  </Flex>
                  {e.prevAccomplishments && (
                    <Text fontSize="sm" color={tokens.text} whiteSpace="pre-wrap" lineHeight="1.7" mb={1}>
                      <Text as="span" fontWeight="600" color={tokens.textMuted}>전주: </Text>{e.prevAccomplishments}
                    </Text>
                  )}
                  <Text fontSize="sm" color={tokens.text} whiteSpace="pre-wrap" lineHeight="1.7">
                    <Text as="span" fontWeight="600" color={tokens.textMuted}>금주 실적: </Text>{e.accomplishments || '-'}
                  </Text>
                  {e.nextPlan && (
                    <Text fontSize="sm" color={tokens.text} whiteSpace="pre-wrap" lineHeight="1.7" mt={1}>
                      <Text as="span" fontWeight="600" color={tokens.textMuted}>차주 계획: </Text>{e.nextPlan}
                    </Text>
                  )}
                </Box>
              ))}

              {r.issues && (
                <Text fontSize="sm" color={tokens.text} whiteSpace="pre-wrap" lineHeight="1.7" mt={2}>
                  <Text as="span" fontWeight="600" color={tokens.textMuted}>특이사항: </Text>{r.issues}
                </Text>
              )}

              <Flex gap={2} mt={4} flexWrap="wrap">
                {r.status !== 'SUBMITTED' ? (
                  <>
                    <Button size="sm" variant="outline" borderRadius="full" onClick={() => openEdit(r)}>수정</Button>
                    <Button size="sm" colorPalette="purple" borderRadius="full" onClick={() => submitWeeklyReport(r.id).then(invalidate)}>제출</Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    className="app-btn-draft"
                    borderRadius="full"
                    onClick={() => withdrawWeeklyReport(r.id).then(invalidate)}
                  >
                    제출 취소
                  </Button>
                )}
                <Button size="sm" variant="ghost" colorPalette="red" borderRadius="full" onClick={() => deleteMutation.mutate(r.id)}>삭제</Button>
              </Flex>
            </Card>
          ))}
        </Box>
      )}

      <DialogRoot open={modalOpen} onOpenChange={(e) => !e.open && setModalOpen(false)} size="xl">
        <DialogBackdrop bg="rgba(0,0,0,0.7)" backdropFilter="blur(4px)" />
        <DialogPositioner>
          <DialogContent className="glass-panel-strong" color={tokens.text} maxW="900px" borderRadius={tokens.radius.xl}>
            <DialogHeader>
              <DialogTitle>{editing ? '주간 보고 수정' : '주간 보고 작성'}</DialogTitle>
              <DialogCloseTrigger />
            </DialogHeader>
            <DialogBody>
              {error && <Text color="red.300" mb={3}>{error}</Text>}

              <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={4} mb={4}>
                <Box>
                  <Text fontSize="sm" color={tokens.textMuted} mb={1}>작성자 *</Text>
                  <AppSelect value={formMemberId} disabled={!!editing} onChange={(e) => setFormMemberId(e.target.value)} style={{ width: '100%' }}>
                    <option value="">선택</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.team})</option>
                    ))}
                  </AppSelect>
                </Box>
                <Box>
                  <Text fontSize="sm" color={tokens.textMuted} mb={1}>소속 파트</Text>
                  <Text fontSize="sm" color={tokens.text} pt={2}>{formMember?.team || '미지정'}</Text>
                </Box>
              </Grid>

              <JiraIssuesPanel
                memberId={formMemberId ? Number(formMemberId) : null}
                memberName={formMember?.name}
                jiraEntries={jiraEntries}
                onJiraEntriesChange={setJiraEntries}
              />
              <Flex align="center" gap={2} mt={3} mb={2}>
                <input
                  type="checkbox"
                  checked={jiraCompleted}
                  onChange={(e) => setJiraCompleted(e.target.checked)}
                  id="jira-completed"
                  style={{ accentColor: tokens.accentStrong }}
                />
                <Text as="label" htmlFor="jira-completed" fontSize="sm" color={tokens.textMuted}>
                  JIRA 이슈 진행상황 업데이트 완료
                </Text>
              </Flex>

              <Text fontWeight="700" mt={4} mb={3} color={tokens.accent} letterSpacing="-0.02em">(필수-팀원) 개발6팀 — 프로젝트·솔루션별 실적</Text>
              {entries.map((entry, idx) => (
                <Box key={idx} mb={4} p={4} className="glass-panel" borderRadius={tokens.radius.lg}>
                  <Flex gap={2} mb={3} flexWrap="wrap">
                    <select value={entry.workType} onChange={(e) => updateEntry(idx, 'workType', e.target.value)} style={selectStyle}>
                      {WORK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <Input
                      className="app-input"
                      placeholder="프로젝트코드 (SO*, SL*)"
                      value={entry.projectCode}
                      onChange={(e) => updateEntry(idx, 'projectCode', e.target.value)}
                      maxW="160px"
                    />
                    <Input
                      className="app-input"
                      placeholder="프로젝트명"
                      value={entry.projectName}
                      onChange={(e) => updateEntry(idx, 'projectName', e.target.value)}
                      flex={1}
                      minW="120px"
                    />
                    <select value={entry.productLine} onChange={(e) => updateEntry(idx, 'productLine', e.target.value)} style={selectStyle}>
                      {PRODUCT_LINES.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </Flex>
                  <Text fontSize="sm" color={tokens.textMuted} mb={1}>전주 실적</Text>
                  <Textarea className="app-input" value={entry.prevAccomplishments} onChange={(e) => updateEntry(idx, 'prevAccomplishments', e.target.value)} rows={2} mb={2} />
                  <Text fontSize="sm" color={tokens.textMuted} mb={1}>금주 실적</Text>
                  <Textarea className="app-input" value={entry.accomplishments} onChange={(e) => updateEntry(idx, 'accomplishments', e.target.value)} rows={5} mb={2} fontFamily="inherit" fontSize="sm" lineHeight="1.6" />
                  <Text fontSize="sm" color={tokens.textMuted} mb={1}>차주 계획 (선택)</Text>
                  <Textarea className="app-input" value={entry.nextPlan} onChange={(e) => updateEntry(idx, 'nextPlan', e.target.value)} rows={2} />
                  {isProjectWorkType(entry.workType) && (
                    <ProjectParticipantPicker
                      members={members}
                      excludeMemberId={formMemberId}
                      selectedIds={entry.participantMemberIds || []}
                      onChange={(ids) => updateParticipants(idx, ids)}
                    />
                  )}
                </Box>
              ))}
              <Button size="sm" variant="outline" borderRadius="full" onClick={addEntry}>+ 프로젝트 행 추가</Button>

              <Box mt={4}>
                <Text fontSize="sm" color={tokens.textMuted} mb={1}>특이사항 / 공유 사항</Text>
                <Textarea className="app-input" value={issues} onChange={(e) => setIssues(e.target.value)} rows={2} />
              </Box>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" mr={2} borderRadius="full" onClick={() => setModalOpen(false)}>취소</Button>
              <Button variant="outline" mr={2} borderRadius="full" onClick={() => saveMutation.mutate({ submitAfterSave: false })} loading={saveMutation.isPending}>임시저장</Button>
              <Button colorPalette="purple" borderRadius="full" onClick={() => saveMutation.mutate({ submitAfterSave: true })} loading={saveMutation.isPending}>제출</Button>
            </DialogFooter>
          </DialogContent>
        </DialogPositioner>
      </DialogRoot>
    </Box>
  );
}
