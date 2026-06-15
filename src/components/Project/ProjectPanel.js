import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Text, Flex, Button, Input, Table,
  DialogRoot, DialogBackdrop, DialogPositioner, DialogContent,
  DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogCloseTrigger,
} from '@chakra-ui/react';
import { createProject, updateProject, deleteProject, restoreProject } from '../../services/reportApi';
import { useProjectList } from '../../hooks/useProjects';
import PageBanner from '../ui/PageBanner';
import EmptyState from '../ui/EmptyState';
import { FilterBar, SegmentedControl } from '../ui/FilterBar';
import { tokens } from '../../theme/tokens';
import { FiFolder } from 'react-icons/fi';

const PRODUCT_LINES = ['SWAT', 'ARGO', 'RSM', 'IPRON CTI'];
const WORK_TYPES = ['프로젝트', '제품개발', '유지보수'];

const emptyForm = {
  name: '',
  projectCode: '',
  productLine: '',
  workType: '프로젝트',
  customer: '',
  solution: '',
  sortOrder: 0,
};

const MAPPING_FILTERS = [
  { value: '', label: '전체' },
  { value: 'mapped', label: '매핑됨' },
  { value: 'unmapped', label: '미매핑' },
];

const selectStyle = {
  width: '100%',
  background: tokens.surfaceStrong,
  color: tokens.text,
  padding: '10px 14px',
  borderRadius: '10px',
  border: `1px solid ${tokens.border}`,
  fontSize: '14px',
};

const btnEditProps = {
  size: 'sm',
  variant: 'outline',
  borderRadius: '10px',
  px: 3,
  fontWeight: '600',
  borderColor: tokens.borderStrong,
  color: tokens.text,
  bg: tokens.surfaceStrong,
  _hover: { bg: tokens.surfaceHover, borderColor: tokens.accent },
};

const btnDeleteProps = {
  size: 'sm',
  variant: 'outline',
  borderRadius: '10px',
  px: 3,
  fontWeight: '600',
  borderColor: 'rgba(252, 165, 165, 0.55)',
  color: '#fecaca',
  bg: 'rgba(248, 113, 113, 0.12)',
  _hover: { bg: 'rgba(248, 113, 113, 0.22)', borderColor: '#fca5a5' },
};

const btnRestoreProps = {
  size: 'sm',
  variant: 'outline',
  borderRadius: '10px',
  px: 3,
  fontWeight: '600',
  borderColor: 'rgba(74, 222, 128, 0.5)',
  color: '#bbf7d0',
  bg: 'rgba(74, 222, 128, 0.1)',
  _hover: { bg: 'rgba(74, 222, 128, 0.18)', borderColor: '#4ade80' },
};

function CountPill({ label, value, accent = tokens.accent, border = 'rgba(129, 140, 248, 0.5)', bg = tokens.accentSoft }) {
  return (
    <Flex align="center" gap={2}>
      <Text fontSize="sm" color={tokens.textMuted}>{label}</Text>
      <Flex
        px={3}
        py={1}
        borderRadius="full"
        bg={bg}
        border="1px solid"
        borderColor={border}
      >
        <Text fontSize="sm" fontWeight="700" color={accent}>{value}</Text>
      </Flex>
    </Flex>
  );
}

function Tag({ children, color = tokens.text, bg = tokens.surfaceStrong, border = tokens.borderStrong }) {
  return (
    <Box
      as="span"
      display="inline-block"
      px={2.5}
      py={1}
      borderRadius="full"
      fontSize="xs"
      fontWeight="600"
      color={color}
      bg={bg}
      border="1px solid"
      borderColor={border}
      whiteSpace="nowrap"
    >
      {children}
    </Box>
  );
}

function extractCustomerFromName(name, workType) {
  if (workType === '유지보수') {
    return name.trim();
  }
  const m = name.match(/^\[([^\]]+)\]/);
  return m ? m[1] : '';
}

export default function ProjectPanel({ embedded = false }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [productLineFilter, setProductLineFilter] = useState('');
  const [workTypeFilter, setWorkTypeFilter] = useState('');
  const [mappingFilter, setMappingFilter] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);

  const filters = useMemo(() => ({
    q: search.trim() || undefined,
    productLine: productLineFilter || undefined,
    workType: workTypeFilter || undefined,
    mapping: mappingFilter || undefined,
    includeInactive,
  }), [search, productLineFilter, workTypeFilter, mappingFilter, includeInactive]);

  const { data: projects = [], isLoading } = useProjectList(filters);
  const { data: statsProjects = [] } = useProjectList({ includeInactive });

  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetDelete, setTargetDelete] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['projects'] });

  const saveMutation = useMutation({
    mutationFn: () => (editing ? updateProject(editing.id, form) : createProject(form)),
    onSuccess: () => {
      invalidate();
      setModalOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setError('');
    },
    onError: (e) => setError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      invalidate();
      setConfirmOpen(false);
      setTargetDelete(null);
    },
    onError: (e) => setError(e.message),
  });

  const restoreMutation = useMutation({
    mutationFn: restoreProject,
    onSuccess: invalidate,
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      productLine: productLineFilter || '',
      workType: workTypeFilter || '프로젝트',
    });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name,
      projectCode: p.projectCode || '',
      productLine: p.productLine || '',
      workType: p.workType || '프로젝트',
      customer: p.customer || '',
      solution: p.solution || '',
      sortOrder: p.sortOrder || 0,
    });
    setError('');
    setModalOpen(true);
  };

  const handleNameChange = (name) => {
    const customer = form.customer || extractCustomerFromName(name, form.workType);
    setForm({ ...form, name, customer: form.customer ? form.customer : customer });
  };

  const handleWorkTypeChange = (workType) => {
    const customer = extractCustomerFromName(form.name, workType);
    setForm({ ...form, workType, customer: form.customer || customer });
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      setError('프로젝트명을 입력하세요.');
      return;
    }
    if (!form.projectCode.trim()) {
      setError('프로젝트코드를 입력하세요.');
      return;
    }
    saveMutation.mutate();
  };

  const activeCount = statsProjects.filter((p) => p.active).length;
  const mappedCount = statsProjects.filter((p) => p.productLine).length;
  const unmappedCount = statsProjects.length - mappedCount;

  return (
    <Box>
      {!embedded && (
        <Flex justify="space-between" align="flex-start" mb={2} gap={4} flexWrap="wrap">
          <PageBanner
            icon={FiFolder}
            title="프로젝트 코드 관리"
            description="코드·솔루션(SWAT/ARGO/RSM) 매핑을 등록합니다. 개발6팀 솔루션이 없는 코드(미매핑)도 목록에 표시됩니다."
          />
        </Flex>
      )}
      <Flex justify="space-between" align="center" mb={4} flexWrap="wrap" gap={3}>
        {!isLoading && statsProjects.length > 0 && (
          <Flex align="center" gap={4} flexWrap="wrap">
            <CountPill label="활성" value={`${activeCount}건`} />
            <CountPill
              label="매핑"
              value={`${mappedCount}건`}
              accent="#a5b4fc"
              border="rgba(129, 140, 248, 0.45)"
              bg={tokens.accentSoft}
            />
            <CountPill
              label="미매핑"
              value={`${unmappedCount}건`}
              accent="#fcd34d"
              border="rgba(251, 191, 36, 0.45)"
              bg="rgba(251, 191, 36, 0.12)"
            />
            <CountPill
              label="전체"
              value={`${statsProjects.length}건`}
              accent={tokens.cyan}
              border="rgba(34, 211, 238, 0.45)"
              bg="rgba(34, 211, 238, 0.12)"
            />
          </Flex>
        )}
        <Button colorPalette="purple" borderRadius="full" onClick={openCreate} boxShadow="0 4px 16px rgba(99,102,241,0.25)" ml="auto">
          + 프로젝트 추가
        </Button>
      </Flex>

      <FilterBar>
        <Input
          className="app-input"
          placeholder="코드·프로젝트명·고객사 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          maxW="260px"
          size="sm"
        />
        <select value={workTypeFilter} onChange={(e) => setWorkTypeFilter(e.target.value)} className="app-select" style={{ width: 'auto', minWidth: '120px' }}>
          <option value="">업무 전체</option>
          {WORK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <SegmentedControl
          options={MAPPING_FILTERS}
          value={mappingFilter}
          onChange={setMappingFilter}
        />
        <SegmentedControl
          options={[{ value: '', label: '솔루션 전체' }, ...PRODUCT_LINES.map((l) => ({ value: l, label: l }))]}
          value={productLineFilter}
          onChange={setProductLineFilter}
        />
        <Flex align="center" gap={2}>
          <input type="checkbox" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} style={{ accentColor: tokens.accentStrong }} />
          <Text fontSize="sm" color={tokens.textMuted} fontWeight="500">비활성 포함</Text>
        </Flex>
      </FilterBar>

      {isLoading ? (
        <Text color={tokens.textMuted}>불러오는 중...</Text>
      ) : projects.length === 0 ? (
        <EmptyState title="등록된 프로젝트가 없습니다" description="추가하거나 code-management-insert.sql을 실행하세요." />
      ) : (
        <Box overflowX="auto" className="glass-panel-strong" borderRadius={tokens.radius.xl} border="1px solid" borderColor={tokens.borderStrong}>
          <Table.Root size="md">
            <Table.Header>
              <Table.Row bg={tokens.surfaceStrong}>
                <Table.ColumnHeader color={tokens.text} fontWeight="700" fontSize="sm" py={3.5} px={3} borderColor={tokens.borderStrong} whiteSpace="nowrap">코드</Table.ColumnHeader>
                <Table.ColumnHeader color={tokens.text} fontWeight="700" fontSize="sm" py={3.5} px={3} borderColor={tokens.borderStrong} whiteSpace="nowrap">업무</Table.ColumnHeader>
                <Table.ColumnHeader color={tokens.text} fontWeight="700" fontSize="sm" py={3.5} px={3} borderColor={tokens.borderStrong} whiteSpace="nowrap">솔루션</Table.ColumnHeader>
                <Table.ColumnHeader color={tokens.text} fontWeight="700" fontSize="sm" py={3.5} px={3} borderColor={tokens.borderStrong} minW="240px">프로젝트명</Table.ColumnHeader>
                <Table.ColumnHeader color={tokens.text} fontWeight="700" fontSize="sm" py={3.5} px={3} borderColor={tokens.borderStrong} whiteSpace="nowrap">고객사</Table.ColumnHeader>
                <Table.ColumnHeader color={tokens.text} fontWeight="700" fontSize="sm" py={3.5} px={3} borderColor={tokens.borderStrong} minW="120px">회사 솔루션</Table.ColumnHeader>
                <Table.ColumnHeader color={tokens.text} fontWeight="700" fontSize="sm" py={3.5} px={3} borderColor={tokens.borderStrong} w="160px" whiteSpace="nowrap">관리</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {projects.map((p, idx) => (
                <Table.Row
                  key={p.id}
                  opacity={p.active ? 1 : 0.65}
                  bg={idx % 2 === 1 ? 'rgba(255,255,255,0.02)' : 'transparent'}
                  _hover={{ bg: tokens.surfaceHover }}
                >
                  <Table.Cell fontFamily="mono" fontSize="md" fontWeight="700" color={tokens.cyan} py={3.5} px={3} borderColor={tokens.border} whiteSpace="nowrap">
                    {p.projectCode}
                  </Table.Cell>
                  <Table.Cell py={3.5} px={3} borderColor={tokens.border}>
                    <Tag bg={tokens.bgElevated}>{p.workType || '프로젝트'}</Tag>
                  </Table.Cell>
                  <Table.Cell py={3.5} px={3} borderColor={tokens.border}>
                    {p.productLine ? (
                      <Tag color={tokens.accent} bg={tokens.accentSoft} border="rgba(129, 140, 248, 0.45)">{p.productLine}</Tag>
                    ) : (
                      <Tag color="#fcd34d" bg="rgba(251, 191, 36, 0.12)" border="rgba(251, 191, 36, 0.45)">미매핑</Tag>
                    )}
                  </Table.Cell>
                  <Table.Cell maxW="360px" whiteSpace="normal" fontSize="sm" fontWeight="500" color={tokens.text} lineHeight="1.6" py={3.5} px={3} borderColor={tokens.border}>
                    {p.name}
                  </Table.Cell>
                  <Table.Cell color={tokens.textMuted} fontSize="sm" py={3.5} px={3} borderColor={tokens.border} whiteSpace="nowrap">
                    {p.customer || '-'}
                  </Table.Cell>
                  <Table.Cell color={tokens.textMuted} fontSize="sm" py={3.5} px={3} borderColor={tokens.border}>
                    {p.solution || '-'}
                  </Table.Cell>
                  <Table.Cell py={3.5} px={3} borderColor={tokens.border}>
                    <Flex gap={2} flexShrink={0}>
                      <Button {...btnEditProps} onClick={() => openEdit(p)}>수정</Button>
                      {p.active ? (
                        <Button {...btnDeleteProps} onClick={() => { setTargetDelete(p); setConfirmOpen(true); }}>삭제</Button>
                      ) : (
                        <Button {...btnRestoreProps} onClick={() => restoreMutation.mutate(p.id)} loading={restoreMutation.isPending}>복구</Button>
                      )}
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      )}

      <DialogRoot open={modalOpen} onOpenChange={(e) => !e.open && setModalOpen(false)}>
        <DialogBackdrop bg="rgba(0,0,0,0.7)" backdropFilter="blur(4px)" />
        <DialogPositioner>
          <DialogContent className="glass-panel-strong" color={tokens.text} maxW="520px" borderRadius={tokens.radius.xl}>
            <DialogHeader>
              <DialogTitle>{editing ? '프로젝트 수정' : '프로젝트 추가'}</DialogTitle>
              <DialogCloseTrigger />
            </DialogHeader>
            <DialogBody>
              {error && <Text color="red.300" mb={3}>{error}</Text>}
              <Box mb={3}>
                <Text className="app-label">업무 구분 *</Text>
                <select value={form.workType} onChange={(e) => handleWorkTypeChange(e.target.value)} style={selectStyle}>
                  {WORK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Box>
              <Box mb={3}>
                <Text className="app-label">프로젝트코드 *</Text>
                <Input className="app-input" value={form.projectCode} onChange={(e) => setForm({ ...form, projectCode: e.target.value.toUpperCase() })} placeholder="SO20250701, SL00005" />
              </Box>
              <Box mb={3}>
                <Text className="app-label">솔루션 (개발6팀)</Text>
                <select value={form.productLine} onChange={(e) => setForm({ ...form, productLine: e.target.value })} style={selectStyle}>
                  <option value="">미매핑 (개발6팀 솔루션 없음)</option>
                  {PRODUCT_LINES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </Box>
              <Box mb={3}>
                <Text className="app-label">프로젝트명 *</Text>
                <Input className="app-input" value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="[고객사] 프로젝트명" />
              </Box>
              <Box mb={3}>
                <Text className="app-label">고객사</Text>
                <Input className="app-input" value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} />
              </Box>
              <Box mb={3}>
                <Text className="app-label">회사 솔루션 (코드관리)</Text>
                <Input className="app-input" value={form.solution} onChange={(e) => setForm({ ...form, solution: e.target.value })} placeholder="CatchALL-STT, IPRON CTI..." />
              </Box>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" mr={2} borderRadius="full" onClick={() => setModalOpen(false)}>취소</Button>
              <Button colorPalette="purple" borderRadius="full" onClick={handleSave} loading={saveMutation.isPending}>저장</Button>
            </DialogFooter>
          </DialogContent>
        </DialogPositioner>
      </DialogRoot>

      {/* 삭제 확인 */}
      <DialogRoot open={confirmOpen} onOpenChange={(e) => !e.open && setConfirmOpen(false)}>
        <DialogBackdrop bg="rgba(0,0,0,0.7)" />
        <DialogPositioner>
          <DialogContent className="glass-panel-strong" color={tokens.text} maxW="420px" borderRadius={tokens.radius.xl}>
            <DialogHeader><DialogTitle>프로젝트 삭제</DialogTitle></DialogHeader>
            <DialogBody>
              <Text>
                <Text as="span" fontWeight="bold" color="blue.300">{targetDelete?.projectCode}</Text>
                {' / '}
                <Text as="span" color="purple.300">{targetDelete?.productLine || '미매핑'}</Text>
                {' '}항목을 삭제(비활성)하시겠습니까?
              </Text>
              <Text fontSize="sm" color="gray.500" mt={2}>{targetDelete?.name}</Text>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" mr={2} onClick={() => setConfirmOpen(false)}>취소</Button>
              <Button colorPalette="red" onClick={() => deleteMutation.mutate(targetDelete.id)} loading={deleteMutation.isPending}>삭제</Button>
            </DialogFooter>
          </DialogContent>
        </DialogPositioner>
      </DialogRoot>
    </Box>
  );
}
