import { Box, Text } from '@chakra-ui/react';
import { tokens } from '../../theme/tokens';

export default function EmptyState({ title, description }) {
  return (
    <Box
      className="glass-panel"
      borderRadius={tokens.radius.xl}
      py={16}
      px={6}
      textAlign="center"
    >
      <Text color={tokens.text} fontWeight="600" fontSize="md" mb={2}>{title}</Text>
      {description && <Text color={tokens.textMuted} fontSize="sm" lineHeight="1.6">{description}</Text>}
    </Box>
  );
}
