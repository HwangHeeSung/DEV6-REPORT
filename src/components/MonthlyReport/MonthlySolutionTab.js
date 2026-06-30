import {
  Box, Text, Flex, Button, Input, Textarea,
} from '@chakra-ui/react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { AppSelect } from '../ui/FilterBar';
import { tokens } from '../../theme/tokens';
import {
  MONTHLY_WORK_TYPES,
  MONTHLY_MAINTENANCE_TYPES,
  MONTHLY_PROGRESS_STATUSES,
  monthWeeksFromCalendar,
  calendarDayMap,
  dayHeaderClass,
  dayHeaderTitle,
  dateKey,
  effortSymbol,
  sumDailyEfforts,
  nextEffortIfAllowed,
  formatEffortLimitMessage,
  workItemKey,
  emptyWorkItem,
} from '../../utils/monthlyWorkUtils';

function EffortCell({ effort, disabled, onClick }) {
  const symbol = effortSymbol(effort);
  return (
    <Box
      as="button"
      type="button"
      className={`monthly-effort-cell${symbol ? ' has-effort' : ''}`}
      disabled={disabled}
      onClick={onClick}
      title="클릭: 0 → ○(0.5) → ●(1.0) → 0 · 합계 1.0 초과 시 ○에서 다시 클릭하면 취소"
    >
      {symbol}
    </Box>
  );
}

export default function MonthlySolutionTab({
  productLine,
  year,
  month,
  items,
  allWorkItems = items,
  readOnly,
  onItemsChange,
  onValidationError,
  calendarDays = [],
}) {
  const weeks = monthWeeksFromCalendar(calendarDays, year, month);
  const dayMap = calendarDayMap(calendarDays);
  const hasCalendar = calendarDays.length > 0;

  const updateItem = (key, patch) => {
    onItemsChange(items.map((item) => (workItemKey(item) === key ? { ...item, ...patch } : item)));
  };

  const toggleEffort = (key, dk) => {
    const item = items.find((i) => workItemKey(i) === key);
    if (!item) return;
    const current = item.dailyEfforts?.[dk] || 0;
    const cycled = nextEffortIfAllowed(allWorkItems, key, dk, current);
    if (cycled == null) {
      onValidationError?.(formatEffortLimitMessage(dk));
      return;
    }
    onValidationError?.('');
    const next = { ...(item.dailyEfforts || {}) };
    if (cycled === 0) delete next[dk];
    else next[dk] = cycled;
    updateItem(key, { dailyEfforts: next });
  };

  const addRow = () => {
    onItemsChange([...items, emptyWorkItem(productLine)]);
  };

  const removeRow = (key) => {
    onItemsChange(items.filter((item) => workItemKey(item) !== key));
  };

  return (
    <Box w="100%" maxW="100%">
      <Flex justify="space-between" align="center" mb={2} px={{ base: 3, lg: 4 }} gap={2} flexWrap="wrap">
        <Flex gap={2} flexWrap="wrap" align="center" fontSize="sm" color={tokens.textMuted} minW={0}>
          <Text display={{ base: 'none', md: 'inline' }}>
            ○ 0.5 M/D · ● 1.0 M/D · 같은 날 합계 1.0 이하 · ○에서 더 올릴 수 없으면 클릭 시 취소
          </Text>
          <Text display={{ base: 'inline', md: 'none' }} fontSize="xs">
            ○ 0.5 · ● 1.0 · 일일 합계 1.0 이하
          </Text>
          {hasCalendar && (
            <>
              <Text as="span" className="calendar-legend weekend">주말</Text>
              <Text as="span" className="calendar-legend holiday">휴일·공휴일</Text>
            </>
          )}
        </Flex>
        {!readOnly && (
          <Button size="sm" colorPalette="purple" borderRadius="full" onClick={addRow}>
            <FiPlus />
            업무 추가
          </Button>
        )}
      </Flex>

      <Box
        overflowX="auto"
        w="100%"
        borderTop="1px solid"
        borderBottom="1px solid"
        borderColor={tokens.border}
        className="monthly-work-scroll app-scroll-x"
      >
        <Box as="table" className="monthly-work-table">
          <thead>
            <tr>
              <th rowSpan={2} className="col-client">고객사</th>
              <th rowSpan={2} className="col-work-type">업무유형</th>
              <th rowSpan={2} className="col-maint-type">유지보수유형</th>
              <th rowSpan={2} className="col-date">접수일</th>
              <th rowSpan={2} className="col-date">완료일</th>
              <th rowSpan={2} className="col-status">진행상태</th>
              <th rowSpan={2} className="col-desc">업무명</th>
              <th rowSpan={2} className="col-total">공수(M/D)</th>
              {weeks.map((w) => (
                <th key={w.label} colSpan={w.days.length} className="week-header">{w.label}</th>
              ))}
              {!readOnly && <th rowSpan={2} className="col-action" />}
            </tr>
            <tr>
              {weeks.flatMap((w) => w.days.map((d) => {
                const dk = dateKey(year, month, d);
                const info = dayMap[dk];
                const cls = ['day-header', dayHeaderClass(info)].filter(Boolean).join(' ');
                return (
                  <th key={dk} className={cls} title={dayHeaderTitle(d, info)}>
                    <span className="day-num">{d}</span>
                    {info?.weekdayNm && <span className="day-dow">{info.weekdayNm}</span>}
                  </th>
                );
              }))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={8 + weeks.reduce((n, w) => n + w.days.length, 0) + (readOnly ? 0 : 1)} className="empty-row">
                  등록된 업무가 없습니다. {readOnly ? '' : '「업무 추가」로 프로젝트·유지보수 내역을 등록하세요.'}
                </td>
              </tr>
            ) : items.map((item) => {
              const key = workItemKey(item);
              const total = sumDailyEfforts(item.dailyEfforts);
              return (
                <tr key={key}>
                  <td className="col-client">
                    <Input
                      className="app-input table-input"
                      size="sm"
                      value={item.clientName}
                      readOnly={readOnly}
                      onChange={(e) => updateItem(key, { clientName: e.target.value })}
                      placeholder="고객사"
                    />
                  </td>
                  <td className="col-work-type">
                    <AppSelect
                      className="app-select table-select"
                      value={item.workType}
                      disabled={readOnly}
                      onChange={(e) => updateItem(key, { workType: e.target.value })}
                    >
                      {MONTHLY_WORK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </AppSelect>
                  </td>
                  <td className="col-maint-type">
                    <AppSelect
                      className="app-select table-select"
                      value={item.maintenanceType}
                      disabled={readOnly}
                      onChange={(e) => updateItem(key, { maintenanceType: e.target.value })}
                    >
                      {MONTHLY_MAINTENANCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </AppSelect>
                  </td>
                  <td className="col-date">
                    <Input
                      className="app-input table-input"
                      type="date"
                      size="sm"
                      value={item.receivedDate}
                      readOnly={readOnly}
                      onChange={(e) => updateItem(key, { receivedDate: e.target.value })}
                    />
                  </td>
                  <td className="col-date">
                    <Input
                      className="app-input table-input"
                      type="date"
                      size="sm"
                      value={item.completedDate}
                      readOnly={readOnly}
                      onChange={(e) => updateItem(key, { completedDate: e.target.value })}
                    />
                  </td>
                  <td className="col-status">
                    <AppSelect
                      className="app-select table-select"
                      value={item.progressStatus}
                      disabled={readOnly}
                      onChange={(e) => updateItem(key, { progressStatus: e.target.value })}
                    >
                      {MONTHLY_PROGRESS_STATUSES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </AppSelect>
                  </td>
                  <td className="col-desc">
                    <Textarea
                      className="app-input table-textarea"
                      rows={2}
                      value={item.description}
                      readOnly={readOnly}
                      onChange={(e) => updateItem(key, { description: e.target.value })}
                      placeholder="업무 내용"
                    />
                  </td>
                  <td className="col-total total-cell">{total ? total.toFixed(1) : ''}</td>
                  {weeks.flatMap((w) => w.days.map((d) => {
                    const dk = dateKey(year, month, d);
                    const effort = item.dailyEfforts?.[dk] || 0;
                    const info = dayMap[dk];
                    const effortCls = ['effort-td', dayHeaderClass(info)].filter(Boolean).join(' ');
                    return (
                      <td key={dk} className={effortCls}>
                        <EffortCell
                          effort={effort}
                          disabled={readOnly}
                          onClick={() => toggleEffort(key, dk)}
                        />
                      </td>
                    );
                  }))}
                  {!readOnly && (
                    <td className="col-action">
                      <Button
                        size="xs"
                        variant="ghost"
                        colorPalette="red"
                        borderRadius="full"
                        onClick={() => removeRow(key)}
                        aria-label="삭제"
                      >
                        <FiTrash2 />
                      </Button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </Box>
      </Box>
    </Box>
  );
}
