import { Box, Text } from '@chakra-ui/react';
import { gradients, tokens } from '../../theme/tokens';

export default function PageBanner({ title, description, icon: Icon }) {
  return (
    <Box
      mb={6}
      p={5}
      borderRadius={tokens.radius.xl}
      border="1px solid"
      borderColor={tokens.borderStrong}
      background={gradients.banner}
    >
      <Box display="flex" gap={3} alignItems="flex-start">
        {Icon && (
          <Box
            mt={0.5}
            p={2.5}
            borderRadius="12px"
            bg={tokens.accentSoft}
            color={tokens.accent}
            flexShrink={0}
          >
            <Icon size={20} />
          </Box>
        )}
        <Box>
          <Text fontWeight="700" fontSize="xl" letterSpacing="-0.02em" color={tokens.text} lineHeight="1.3">
            {title}
          </Text>
          {description && (
            <Text fontSize="md" color={tokens.textMuted} mt={2} lineHeight="1.65">
              {description}
            </Text>
          )}
        </Box>
      </Box>
    </Box>
  );
}
