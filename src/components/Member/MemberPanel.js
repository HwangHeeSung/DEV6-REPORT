import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Text, Flex, Button, Badge, Input, Grid,
  DialogRoot, DialogBackdrop, DialogPositioner, DialogContent,
  DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogCloseTrigger,
} from '@chakra-ui/react';
import { FiUsers, FiMenu } from 'react-icons/fi';
import { createMember, updateMember, deleteMember, reorderMembers } from '../../services/reportApi';
import { useMembers } from '../../hooks/useReports';
import PageBanner from '../ui/PageBanner';
import { Card } from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import { AppSelect } from '../ui/FilterBar';
import { tokens } from '../../theme/tokens';
import { groupMembersByPart, PART_SECTIONS } from '../../utils/memberGroup';
import {
  solutionOptionsForTeam,
  normalizeMemberSolutions,
  formatSolutionsLabel,
} from '../../utils/memberSolutions';

const TEAM_OPTIONS = [
  { value: '1파트 (SWAT)', label: '1파트 (SWAT / IPRON CTI)' },
  { value: '2파트 (ARGO/RSM)', label: '2파트 (ARGO / RSM)' },
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

const emptyForm = {
  name: '', team: '1파트 (SWAT)', role: 'MEMBER', email: '', jiraUsername: '',
  assignedProductLines: ['SWAT'],
  requiresDev6Report: true, requiresJiraReport: true, active: true,
};

function roleLabel(role) {
  if (role === 'LEADER') return '팀장';
  if (role === 'SUB_LEADER') return '부팀장';
  return null;
}

function reorderArray(list, fromId, toId) {
  const fromIndex = list.findIndex((m) => m.id === fromId);
  const toIndex = list.findIndex((m) => m.id === toId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return list;
  const next = [...list];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

function MemberRow({
  member, draggable, isDragging, isOver, onDragStart, onDragOver, onDrop, onDragEnd, onEdit, onDeactivate,
}) {
  const role = roleLabel(member.role);

  return (
    <Flex
      align="center"
      gap={4}
      py={4}
      px={4}
      borderRadius={tokens.radius.lg}
      bg={isOver ? tokens.surfaceHover : undefined}
      opacity={isDragging ? 0.45 : 1}
      border={isOver ? '1px dashed' : '1px solid transparent'}
      borderColor={isOver ? tokens.accent : 'transparent'}
      flexWrap="wrap"
      onDragOver={draggable ? (e) => { e.preventDefault(); onDragOver?.(); } : undefined}
      onDrop={draggable ? (e) => { e.preventDefault(); onDrop?.(); } : undefined}
    >
      {draggable ? (
        <Box
          as="span"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', String(member.id));
            onDragStart?.();
          }}
          onDragEnd={onDragEnd}
          color={tokens.textMuted}
          cursor="grab"
          px={1.5}
          py={2.5}
          borderRadius="10px"
          bg={tokens.surfaceStrong}
          border="1px solid"
          borderColor={tokens.border}
          _hover={{ color: tokens.text, borderColor: tokens.borderStrong }}
          _active={{ cursor: 'grabbing' }}
          aria-label="순서 변경"
        >
          <FiMenu size={18} />
        </Box>
      ) : (
        <Box w="28px" />
      )}
      <Box flex={1} minW="220px">
        <Flex align="center" gap={2} mb={1} flexWrap="wrap">
          <Text fontWeight="800" fontSize="lg" color={tokens.text} letterSpacing="-0.02em">
            {member.name}
          </Text>
          {!member.active && <Badge colorPalette="gray" borderRadius="full" fontSize="sm">비활성</Badge>}
          {role && (
            <Badge colorPalette={member.role === 'LEADER' ? 'blue' : 'purple'} borderRadius="full" fontSize="sm">
              {role}
            </Badge>
          )}
        </Flex>
        <Text fontSize="md" color={tokens.textMuted} lineHeight="1.5">
          담당: {formatSolutionsLabel(member.assignedProductLines)} · Jira: {member.jiraUsername || '미등록'}
        </Text>
      </Box>
      <Flex gap={2} flexShrink={0}>
        <Button
          size="md"
          variant="outline"
          borderRadius="10px"
          px={4}
          fontWeight="600"
          fontSize="sm"
          borderColor={tokens.borderStrong}
          color={tokens.text}
          bg={tokens.surfaceStrong}
          _hover={{ bg: tokens.surfaceHover, borderColor: tokens.accent, color: tokens.text }}
          onClick={() => onEdit(member)}
        >
          수정
        </Button>
        {member.active && (
          <Button
            size="md"
            variant="outline"
            borderRadius="10px"
            px={4}
            fontWeight="600"
            fontSize="sm"
            borderColor="rgba(252, 165, 165, 0.55)"
            color="#fecaca"
            bg="rgba(248, 113, 113, 0.12)"
            _hover={{ bg: 'rgba(248, 113, 113, 0.22)', borderColor: '#fca5a5' }}
            onClick={() => onDeactivate(member.id)}
          >
            비활성화
          </Button>
        )}
      </Flex>
    </Flex>
  );
}

function MemberSection({
  title, subtitle, members, sortable, onReorder, onEdit, onDeactivate,
}) {
  const [items, setItems] = useState(members);
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);

  useEffect(() => {
    setItems(members);
  }, [members]);

  const handleDrop = (targetId) => {
    if (!dragId || dragId === targetId) return;
    const next = reorderArray(items, dragId, targetId);
    setItems(next);
    setDragId(null);
    setOverId(null);
    onReorder(next.map((m) => m.id));
  };

  return (
    <Card strong p={0} overflow="hidden" h="100%">
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
        <Box flex={1}>
          <Flex align="center" gap={3} flexWrap="wrap" mb={1}>
            <Text fontWeight="800" fontSize="xl" color={tokens.text} letterSpacing="-0.02em">
              {title}
            </Text>
            <Badge colorPalette="purple" borderRadius="full" px={3} py={1} fontSize="sm" fontWeight="700">
              {items.length}명
            </Badge>
          </Flex>
          <Text fontSize="md" color={tokens.textMuted} fontWeight="500">
            {subtitle}{sortable && items.length > 1 ? ' · ⋮⋮ 드래그로 순서 변경' : ''}
          </Text>
        </Box>
      </Flex>
      <Box px={3} py={2}>
        {items.length === 0 ? (
          <Text fontSize="md" color={tokens.textFaint} py={10} textAlign="center">
            등록된 팀원 없음
          </Text>
        ) : (
          items.map((member, i) => (
            <Box key={member.id} borderBottom={i < items.length - 1 ? '1px solid' : undefined} borderColor={tokens.border}>
              <MemberRow
                member={member}
                draggable={sortable && items.length > 1}
                isDragging={dragId === member.id}
                isOver={overId === member.id && dragId !== member.id}
                onDragStart={() => setDragId(member.id)}
                onDragOver={() => setOverId(member.id)}
                onDrop={() => handleDrop(member.id)}
                onDragEnd={() => { setDragId(null); setOverId(null); }}
                onEdit={onEdit}
                onDeactivate={onDeactivate}
              />
            </Box>
          ))
        )}
      </Box>
    </Card>
  );
}

export default function MemberPanel({ embedded = false }) {
  const queryClient = useQueryClient();
  const { data: members = [], isLoading } = useMembers(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const grouped = useMemo(() => groupMembersByPart(members), [members]);

  const sectionBlocks = useMemo(
    () => PART_SECTIONS
      .map((section) => ({
        ...section,
        members: grouped[section.key] || [],
      }))
      .filter((section) => section.members.length > 0),
    [grouped]
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['members'] });

  const saveMutation = useMutation({
    mutationFn: () => (editing ? updateMember(editing.id, form) : createMember(form)),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['projects', 'memberSolutions'] });
      setModalOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setError('');
    },
    onError: (e) => setError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMember,
    onSuccess: invalidate,
  });

  const reorderMutation = useMutation({
    mutationFn: reorderMembers,
    onSuccess: invalidate,
    onError: (e) => setError(e.message),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (member) => {
    setEditing(member);
    setForm({
      name: member.name,
      team: member.team || '1파트 (SWAT)',
      role: member.role || 'MEMBER',
      email: member.email || '',
      jiraUsername: member.jiraUsername || '',
      assignedProductLines: normalizeMemberSolutions(member.assignedProductLines, member.team),
      requiresDev6Report: member.requiresDev6Report !== false,
      requiresJiraReport: member.requiresJiraReport !== false,
      active: member.active,
    });
    setError('');
    setModalOpen(true);
  };

  const handleTeamChange = (team) => {
    setForm((prev) => ({
      ...prev,
      team,
      assignedProductLines: normalizeMemberSolutions(prev.assignedProductLines, team),
    }));
  };

  const toggleSolution = (line) => {
    setForm((prev) => {
      const allowed = solutionOptionsForTeam(prev.team);
      const current = (prev.assignedProductLines || []).filter((s) => allowed.includes(s));
      const next = current.includes(line)
        ? current.filter((s) => s !== line)
        : [...current, line];
      return { ...prev, assignedProductLines: next };
    });
  };

  const solutionOptions = solutionOptionsForTeam(form.team);

  const leaderBlock = sectionBlocks.find((s) => s.key === 'leaders');
  const part1Block = { key: 'part1', title: '1파트', subtitle: 'SWAT · IPRON CTI', members: grouped.part1 };
  const part2Block = { key: 'part2', title: '2파트', subtitle: 'ARGO · RSM', members: grouped.part2 };
  const otherBlocks = sectionBlocks.filter((s) => s.key === 'other');

  const renderSection = (block) => (
    <MemberSection
      key={block.key}
      title={block.title}
      subtitle={block.subtitle}
      members={block.members}
      sortable
      onReorder={(memberIds) => reorderMutation.mutate(memberIds)}
      onEdit={openEdit}
      onDeactivate={(id) => deleteMutation.mutate(id)}
    />
  );

  return (
    <Box w="100%">
      {!embedded && (
        <Flex justify="space-between" align="flex-start" mb={2} gap={4} flexWrap="wrap">
          <PageBanner
            icon={FiUsers}
            title="팀원 관리"
            description="팀장 → 1파트 → 2파트 순으로 표시됩니다. 팀원별 담당 솔루션을 지정하고 순서는 ⋮⋮ 드래그로 변경하세요."
          />
        </Flex>
      )}
      {error && !modalOpen && (
        <Text color={tokens.danger} fontSize="sm" mb={3}>{error}</Text>
      )}
      <Flex justify="space-between" align="center" mb={4} flexWrap="wrap" gap={3}>
        {!isLoading && members.length > 0 && (
          <Flex align="center" gap={2}>
            <Text fontSize="md" color={tokens.textMuted}>전체</Text>
            <Flex
              px={3}
              py={1}
              borderRadius="full"
              bg="rgba(34, 211, 238, 0.12)"
              border="1px solid"
              borderColor="rgba(34, 211, 238, 0.45)"
            >
              <Text fontSize="md" fontWeight="700" color={tokens.cyan}>
                {members.filter((m) => m.active).length}명
              </Text>
            </Flex>
            {members.some((m) => !m.active) && (
              <Text fontSize="sm" color={tokens.textFaint}>
                (비활성 {members.filter((m) => !m.active).length}명)
              </Text>
            )}
          </Flex>
        )}
        <Button colorPalette="purple" borderRadius="full" onClick={openCreate} boxShadow="0 4px 16px rgba(99,102,241,0.25)" ml="auto">
          + 멤버 추가
        </Button>
      </Flex>

      {isLoading ? (
        <Text color={tokens.textMuted}>불러오는 중...</Text>
      ) : members.length === 0 ? (
        <EmptyState title="등록된 멤버가 없습니다" description="멤버를 추가하거나 DB 시드 데이터를 확인하세요." />
      ) : (
        <Box>
          {leaderBlock && (
            <Box w="100%" mb={5}>
              {renderSection(leaderBlock)}
            </Box>
          )}

          <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={5} mb={4} w="100%">
            {renderSection(part1Block)}
            {renderSection(part2Block)}
          </Grid>

          {otherBlocks.map((block) => (
            <Box key={block.key} mb={4}>
              {renderSection(block)}
            </Box>
          ))}
        </Box>
      )}

      <DialogRoot open={modalOpen} onOpenChange={(e) => !e.open && setModalOpen(false)}>
        <DialogBackdrop bg="rgba(0,0,0,0.7)" backdropFilter="blur(4px)" />
        <DialogPositioner>
          <DialogContent className="glass-panel-strong" color={tokens.text} maxW="480px" borderRadius={tokens.radius.xl}>
            <DialogHeader>
              <DialogTitle>{editing ? '멤버 수정' : '멤버 추가'}</DialogTitle>
              <DialogCloseTrigger />
            </DialogHeader>
            <DialogBody>
              {error && <Text color="red.300" mb={3}>{error}</Text>}
              <Box mb={3}>
                <Text className="app-label">이름 *</Text>
                <Input className="app-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Box>
              <Box mb={3}>
                <Text className="app-label">파트</Text>
                <AppSelect value={form.team} onChange={(e) => handleTeamChange(e.target.value)} style={{ width: '100%' }}>
                  {TEAM_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </AppSelect>
              </Box>
              {solutionOptions.length > 0 && (
                <Box mb={3}>
                  <Text className="app-label">담당 솔루션 *</Text>
                  <Flex gap={3} flexWrap="wrap" mt={1}>
                    {solutionOptions.map((line) => (
                      <Flex key={line} align="center" gap={2} as="label" cursor="pointer">
                        <input
                          type="checkbox"
                          checked={(form.assignedProductLines || []).includes(line)}
                          onChange={() => toggleSolution(line)}
                          style={{ accentColor: tokens.accentStrong }}
                        />
                        <Text fontSize="sm" fontWeight="600" color={tokens.text}>{line}</Text>
                      </Flex>
                    ))}
                  </Flex>
                  <Text fontSize="xs" color={tokens.textMuted} mt={2}>
                    주간보고 프로젝트 선택·금주 실적 양식에 반영됩니다.
                  </Text>
                </Box>
              )}
              <Box mb={3}>
                <Text className="app-label">역할</Text>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={selectStyle}>
                  <option value="MEMBER">팀원</option>
                  <option value="SUB_LEADER">부팀장</option>
                  <option value="LEADER">팀장</option>
                </select>
              </Box>
              <Box mb={3}>
                <Text className="app-label">Jira 계정 (assignee)</Text>
                <Input className="app-input" value={form.jiraUsername} onChange={(e) => setForm({ ...form, jiraUsername: e.target.value })} placeholder="예: woos798" />
              </Box>
              <Flex gap={4} mb={3} flexWrap="wrap">
                <Flex align="center" gap={2}>
                  <input type="checkbox" checked={form.requiresDev6Report} onChange={(e) => setForm({ ...form, requiresDev6Report: e.target.checked })} style={{ accentColor: tokens.accentStrong }} />
                  <Text fontSize="sm">개발6팀 시트 필수</Text>
                </Flex>
                <Flex align="center" gap={2}>
                  <input type="checkbox" checked={form.requiresJiraReport} onChange={(e) => setForm({ ...form, requiresJiraReport: e.target.checked })} style={{ accentColor: tokens.accentStrong }} />
                  <Text fontSize="sm">JIRA 시트 필수</Text>
                </Flex>
              </Flex>
              <Box mb={3}>
                <Text className="app-label">이메일 (보고 알림용)</Text>
                <Input className="app-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Box>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" mr={2} borderRadius="full" onClick={() => setModalOpen(false)}>취소</Button>
              <Button
                colorPalette="purple"
                borderRadius="full"
                onClick={() => {
                  if (!form.name.trim()) {
                    setError('이름을 입력하세요.');
                    return;
                  }
                  if (solutionOptions.length && !(form.assignedProductLines || []).length) {
                    setError('담당 솔루션을 1개 이상 선택하세요.');
                    return;
                  }
                  saveMutation.mutate();
                }}
                loading={saveMutation.isPending}
              >
                저장
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogPositioner>
      </DialogRoot>
    </Box>
  );
}
