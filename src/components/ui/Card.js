import { Box } from '@chakra-ui/react';
import { tokens } from '../../theme/tokens';

export function Card({ children, hover = false, strong = false, ...props }) {
  return (
    <Box
      className={strong ? 'glass-panel-strong' : 'glass-panel'}
      borderRadius={tokens.radius.xl}
      p={{ base: 4, md: 5 }}
      transition="border-color 0.2s ease"
      _hover={hover ? { borderColor: tokens.borderStrong } : undefined}
      {...props}
    >
      {children}
    </Box>
  );
}

export function StatCard({ label, value, sub, accent = tokens.accent }) {
  return (
    <Card strong>
      <Box fontSize="sm" fontWeight="600" color={tokens.textMuted} mb={1}>{label}</Box>
      <Box fontSize="2xl" fontWeight="700" letterSpacing="-0.02em" color={accent}>{value}</Box>
      {sub && <Box fontSize="sm" color={tokens.textMuted} mt={2} lineHeight="1.5">{sub}</Box>}
    </Card>
  );
}
