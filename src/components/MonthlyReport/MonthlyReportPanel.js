import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Text, Flex, Button, Spinner, Badge,
} from '@chakra-ui/react';
import { FiCalendar } from 'react-icons/fi';
import {
  getMonthlyReports, createMonthlyReport, updateMonthlyReport,
  submitMonthlyReport, withdrawMonthlyReport, getMonthlyWorkItemSuggestions,
} from '../../services/reportApi';
import { useMembers, useCurrentPeriod } from '../../hooks/useReports';
import { getCalendarDays } from '../../services/calendarApi';
import PageBanner from '../ui/PageBanner';
import { Card } from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import { AppSelect, SegmentedControl } from '../ui/FilterBar';
import { tokens } from '../../theme/tokens';
import { formatSolutionsLabel, normalizeMemberSolutions } from '../../utils/memberSolutions';
import { solutionTabLabel, workItemFromApi, serializeWorkItems, validateDailyEffortLimits } from '../../utils/monthlyWorkUtils';
import MonthlySolutionTab from './MonthlySolutionTab';

const STORAGE_KEY = 'dev6_report_member_id';

export default function MonthlyReportPanel({ year }) {
  const queryClient = useQueryClient();
  const { data: period } = useCurrentPeriod();
  const { data: members = [] } = useMembers();
  const [month, setMonth] = useState(null);
  const [memberId, setMemberId] = useState(() => localStorage.getItem(STORAGE_KEY) || '');
  const [activeTab, setActiveTab] = useState('');
  const [workItems, setWorkItems] = useState([]);
  const [error, setError] = useState('');

  const effectiveMonth = month ?? period?.month;
  const member = members.find((m) => String(m.id) === String(memberId));
  const solutionTabs = useMemo(
    () => normalizeMemberSolutions(member?.assignedProductLines, member?.team),
    [member]
  );

  useEffect(() => {
    if (memberId) localStorage.setItem(STORAGE_KEY, memberId);
  }, [memberId]);

  useEffect(() => {
    if (solutionTabs.length && !solutionTabs.includes(activeTab)) {
      setActiveTab(solutionTabs[0]);
    }
  }, [solutionTabs, activeTab]);

  const { data: calendarDays = [] } = useQuery({
    queryKey: ['calendarDays', year, effectiveMonth],
    queryFn: () => getCalendarDays({ year, month: effectiveMonth }),
    enabled: !!effectiveMonth,
  });

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['monthlyReports', year, effectiveMonth, memberId],
    queryFn: () => getMonthlyReports({
      year,
      month: effectiveMonth,
      memberId: memberId || undefined,
    }),
    enabled: !!effectiveMonth && !!memberId,
  });

  const myReport = reports[0] || null;
  const isSubmitted = myReport?.status === 'SUBMITTED';
  const readOnly = isSubmitted;

  const { data: weeklySuggestions = [], isLoading: suggestionsLoading } = useQuery({
    queryKey: ['monthlyWorkSuggestions', year, effectiveMonth, memberId],
    queryFn: () => getMonthlyWorkItemSuggestions({
      year,
      month: effectiveMonth,
      memberId,
    }),
    enabled: !!effectiveMonth && !!memberId && !readOnly,
  });

  useEffect(() => {
    if (!memberId) {
      setWorkItems([]);
      return;
    }
    if (myReport?.workItems?.length) {
      setWorkItems(myReport.workItems.map(workItemFromApi));
      return;
    }
    if (isLoading || suggestionsLoading) {
      return;
    }
    if (weeklySuggestions.length) {
      setWorkItems(weeklySuggestions.map(workItemFromApi));
    } else {
      setWorkItems([]);
    }
  }, [
    myReport?.id,
    myReport?.updatedAt,
    myReport?.workItems,
    memberId,
    isLoading,
    suggestionsLoading,
    weeklySuggestions,
  ]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['monthlyReports'] });
    queryClient.invalidateQueries({ queryKey: ['statistics'] });
  };

  const saveMutation = useMutation({
    mutationFn: async ({ submitAfterSave }) => {
      const limitError = validateDailyEffortLimits(workItems);
      if (limitError) throw new Error(limitError);
      const body = {
        memberId: Number(memberId),
        reportYear: year,
        reportMonth: effectiveMonth,
        workItems: serializeWorkItems(workItems),
      };
      let saved = myReport
        ? await updateMonthlyReport(myReport.id, body)
        : await createMonthlyReport(body);
      if (submitAfterSave) saved = await submitMonthlyReport(saved.id);
      return saved;
    },
    onSuccess: () => {
      invalidate();
      setError('');
    },
    onError: (e) => setError(e.message),
  });

  const withdrawMutation = useMutation({
    mutationFn: () => withdrawMonthlyReport(myReport.id),
    onSuccess: () => {
      invalidate();
      setError('');
    },
    onError: (e) => setError(e.message),
  });

  const togglePending = withdrawMutation.isPending || saveMutation.isPending;

  const handleSubmitToggle = () => {
    if (isSubmitted) withdrawMutation.mutate();
    else saveMutation.mutate({ submitAfterSave: true });
  };

  const tabItems = workItems.filter((i) => i.productLine === activeTab);
  const otherItems = workItems.filter((i) => i.productLine !== activeTab);

  const handleReloadFromWeekly = () => {
    if (readOnly) return;
    setWorkItems(weeklySuggestions.map(workItemFromApi));
    setError('');
  };

  const handleTabItemsChange = (newTabItems) => {
    setWorkItems([...otherItems, ...newTabItems]);
  };

  const statusLabel = () => {
    if (!myReport) return { text: '미작성', color: 'orange' };
    if (isSubmitted) return { text: '제출 완료', color: 'green' };
    return { text: '임시저장 중', color: 'yellow' };
  };
  const st = statusLabel();

  const tabOptions = solutionTabs.map((line) => ({
    value: line,
    label: solutionTabLabel(line),
  }));

  return (
    <Box w="100%" maxW="100%">
      <PageBanner
        icon={FiCalendar}
        title="월간 보고"
        description="담당 솔루션 탭에서 이번 달 실적을 등록합니다. 업무 목록은 해당 월 주간보고에 등록한 고객사 기준으로 자동 생성됩니다."
      />

      <Flex gap={4} mb={5} flexWrap="wrap" align="flex-end">
        <Box flex={{ base: '1 1 100%', sm: '0 0 auto' }}>
          <Text className="app-label">내 이름</Text>
          <AppSelect
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            minW="180px"
            w={{ base: '100%', sm: 'auto' }}
          >
            <option value="">선택하세요</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name} ({m.team})</option>
            ))}
          </AppSelect>
        </Box>
        <Box flex={{ base: '1 1 100%', sm: '0 0 auto' }}>
          <Text className="app-label">월</Text>
          <AppSelect
            value={effectiveMonth ?? ''}
            onChange={(e) => setMonth(Number(e.target.value))}
            minW="100px"
            w={{ base: '100%', sm: 'auto' }}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{m}월</option>
            ))}
          </AppSelect>
        </Box>
        {member && (
          <Badge colorPalette="cyan" borderRadius="full" mb={1} px={3} py={1}>
            {formatSolutionsLabel(solutionTabs)}
          </Badge>
        )}
      </Flex>

      {!memberId && (
        <EmptyState title="이름을 선택해 주세요" description="선택하면 이번 달 솔루션별 실적을 등록할 수 있습니다." />
      )}

      {memberId && (
        <Card strong mb={0} p={0} overflow="hidden">
          <Box px={{ base: 3, lg: 4 }} pt={{ base: 3, lg: 4 }} pb={2}>
            <Flex justify="space-between" align="center" mb={3} flexWrap="wrap" gap={2}>
              <Box>
                <Text fontWeight="700" fontSize="lg">{member?.name}</Text>
                <Text fontSize="sm" color={tokens.textMuted}>{year}년 {effectiveMonth}월</Text>
              </Box>
              <Badge colorPalette={st.color} borderRadius="full" px={3} py={1}>{st.text}</Badge>
            </Flex>

            {error && <Text color="red.300" fontSize="sm" mb={3}>{error}</Text>}

            {!isLoading && solutionTabs.length > 0 && (
              <Box mb={1} overflowX="auto" className="app-scroll-x">
                <SegmentedControl options={tabOptions} value={activeTab} onChange={setActiveTab} fullWidth />
              </Box>
            )}
          </Box>

          {isLoading ? (
            <Flex justify="center" py={8}><Spinner color={tokens.accent} /></Flex>
          ) : (
            <>
              {solutionTabs.length === 0 ? (
                <Box px={{ base: 3, lg: 4 }} pb={4}>
                  <EmptyState title="담당 솔루션이 없습니다" description="멤버 관리에서 담당 솔루션을 지정해 주세요." />
                </Box>
              ) : activeTab && (
                <MonthlySolutionTab
                  productLine={activeTab}
                  year={year}
                  month={effectiveMonth}
                  items={tabItems}
                  allWorkItems={workItems}
                  readOnly={readOnly}
                  onItemsChange={handleTabItemsChange}
                  onValidationError={setError}
                  calendarDays={calendarDays}
                />
              )}

              <Flex gap={3} px={{ base: 3, lg: 4 }} py={3} flexWrap="wrap" justify="flex-end" borderTop="1px solid" borderColor={tokens.border}>
                {!readOnly && weeklySuggestions.length > 0 && (
                  <Button
                    className="app-btn-draft"
                    borderRadius="full"
                    onClick={handleReloadFromWeekly}
                    disabled={suggestionsLoading}
                  >
                    주간보고에서 다시 불러오기
                  </Button>
                )}
                {!readOnly && (
                  <Button
                    className="app-btn-draft"
                    borderRadius="full"
                    onClick={() => saveMutation.mutate({ submitAfterSave: false })}
                    loading={saveMutation.isPending}
                  >
                    임시저장
                  </Button>
                )}
                <Button
                  colorPalette={isSubmitted ? undefined : 'green'}
                  className={isSubmitted ? 'app-btn-draft' : undefined}
                  borderRadius="full"
                  onClick={handleSubmitToggle}
                  loading={togglePending}
                >
                  {isSubmitted ? '제출 취소' : '제출 완료'}
                </Button>
              </Flex>
            </>
          )}
        </Card>
      )}
    </Box>
  );
}
