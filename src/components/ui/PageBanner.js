import { Box, Text } from '@chakra-ui/react';
import { gradients, tokens } from '../../theme/tokens';

export default function PageBanner({ title, description, icon: Icon }) {
  return (
    <Box
      mb={{ base: 4, md: 6 }}
      p={{ base: 4, md: 5 }}
      borderRadius={tokens.radius.xl}
      border="1px solid"
      borderColor={tokens.borderStrong}
      background={gradients.banner}
    >
      <Box display="flex" gap={{ base: 2.5, md: 3 }} alignItems="flex-start">
        {Icon && (
          <Box
            mt={0.5}
            p={{ base: 2, md: 2.5 }}
            borderRadius="12px"
            bg={tokens.accentSoft}
            color={tokens.accent}
            flexShrink={0}
          >
            <Icon size={20} />
          </Box>
        )}
        <Box minW={0}>
          <Text
            fontWeight="700"
            fontSize={{ base: 'lg', md: 'xl' }}
            letterSpacing="-0.02em"
            color={tokens.text}
            lineHeight="1.3"
          >
            {title}
          </Text>
          {description && (
            <Text fontSize={{ base: 'sm', md: 'md' }} color={tokens.textMuted} mt={{ base: 1.5, md: 2 }} lineHeight="1.65">
              {description}
            </Text>
          )}
        </Box>
      </Box>
    </Box>
  );
}
