import { Box, Text, Flex, Badge } from '@chakra-ui/react';
import { tokens } from '../../theme/tokens';

export function isProjectWorkType(workType) {
  return (workType || '프로젝트') === '프로젝트';
}

export function formatParticipantNames(names = []) {
  if (!names?.length) return '';
  return names.join(', ');
}

export default function ProjectParticipantPicker({
  members = [],
  excludeMemberId,
  selectedIds = [],
  onChange,
  readOnly = false,
}) {
  if (readOnly) {
    const names = members
      .filter((m) => selectedIds.includes(m.id))
      .map((m) => m.name);
    if (!names.length) return null;
    return (
      <Box mt={2}>
        <Text className="app-label">함께 진행하는 인원</Text>
        <Text fontSize="sm" color={tokens.textMuted}>{names.join(', ')}</Text>
      </Box>
    );
  }

  const candidates = members.filter(
    (m) => m.active !== false && String(m.id) !== String(excludeMemberId)
  );

  if (!candidates.length) return null;

  const toggle = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  };

  return (
    <Box mt={3}>
      <Text className="app-label">함께 진행하는 인원 (프로젝트)</Text>
      <Text fontSize="xs" color={tokens.textMuted} mb={2} lineHeight="1.5">
        본인 외 같은 프로젝트를 진행 중인 팀원을 선택하세요.
      </Text>
      <Flex gap={2} flexWrap="wrap">
        {candidates.map((m) => {
          const selected = selectedIds.includes(m.id);
          return (
            <Badge
              key={m.id}
              as="button"
              type="button"
              colorPalette={selected ? 'cyan' : 'gray'}
              borderRadius="full"
              px={3}
              py={1}
              fontSize="sm"
              fontWeight="600"
              cursor="pointer"
              border="1px solid"
              borderColor={selected ? 'rgba(34, 211, 238, 0.5)' : tokens.border}
              onClick={() => toggle(m.id)}
            >
              {m.name}
            </Badge>
          );
        })}
      </Flex>
    </Box>
  );
}
