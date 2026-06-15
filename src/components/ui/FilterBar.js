import { Flex, Text, Box } from '@chakra-ui/react';
import { tokens } from '../../theme/tokens';

export function FilterBar({ children, label }) {
  return (
    <Flex
      gap={4}
      mb={5}
      flexWrap="wrap"
      align="center"
      p={4}
      className="glass-panel-strong"
      borderRadius={tokens.radius.lg}
    >
      {label && <Text fontSize="sm" color={tokens.textMuted} fontWeight="600">{label}</Text>}
      {children}
    </Flex>
  );
}

export function AppSelect({ value, onChange, children, minW, ...props }) {
  return (
    <Box as="select" className="app-select" value={value} onChange={onChange} minW={minW} {...props}>
      {children}
    </Box>
  );
}

export function SegmentedControl({ options, value, onChange, size = 'md', fullWidth = false }) {
  const isLg = size === 'lg';
  return (
    <Flex
      p={isLg ? 1.5 : 1}
      gap={isLg ? 2 : 1}
      w={fullWidth ? '100%' : undefined}
      borderRadius={isLg ? '14px' : '12px'}
      bg={tokens.bgElevated}
      border="1px solid"
      borderColor={tokens.border}
      className="glass-panel-strong"
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <Box
            key={opt.value}
            as="button"
            type="button"
            flex={fullWidth ? 1 : undefined}
            px={isLg ? 6 : 3}
            py={isLg ? 3.5 : 2}
            fontSize={isLg ? 'md' : 'sm'}
            fontWeight={active ? '700' : '500'}
            borderRadius={isLg ? '10px' : '8px'}
            color={active ? tokens.text : tokens.textMuted}
            bg={active ? tokens.accentSoft : 'transparent'}
            border={active ? `1px solid ${tokens.borderStrong}` : '1px solid transparent'}
            cursor="pointer"
            transition="all 0.15s"
            onClick={() => onChange(opt.value)}
            _hover={{ color: tokens.text, bg: active ? tokens.accentSoft : tokens.surfaceHover }}
          >
            {opt.label}
          </Box>
        );
      })}
    </Flex>
  );
}
