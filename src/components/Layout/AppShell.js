import { Box, Flex, Text } from '@chakra-ui/react';
import Sidebar from './Sidebar';
import { tokens } from '../../theme/tokens';
import { AppSelect } from '../ui/FilterBar';

export default function AppShell({
  activeTab,
  onTabChange,
  year,
  onYearChange,
  period,
  showPeriodBar,
  contentMaxW = '1440px',
  contentPx,
  children,
}) {
  return (
    <Box minH="100vh" className="app-mesh-bg" display="flex" flexDirection="column">
      <Box
        position="sticky"
        top={0}
        zIndex={20}
        bg={tokens.bgElevated}
        borderBottom="1px solid"
        borderColor={tokens.border}
      >
        <Sidebar activeTab={activeTab} onTabChange={onTabChange} />

        {showPeriodBar && (
          <Flex
            px={{ base: 3, sm: 4, lg: 8 }}
            py={{ base: 2.5, md: 3 }}
            gap={{ base: 2, md: 4 }}
            align={{ base: 'flex-start', sm: 'center' }}
            flexDirection={{ base: 'column', sm: 'row' }}
            flexWrap="wrap"
            borderTop="1px solid"
            borderColor={tokens.border}
            bg={tokens.bgElevated}
          >
            <AppSelect
              value={year}
              onChange={(e) => onYearChange(Number(e.target.value))}
              minW="120px"
              w={{ base: '100%', sm: 'auto' }}
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}년</option>
              ))}
            </AppSelect>
            {period && (
              <Flex align="center" gap={2} minW={0} flexWrap="wrap">
                <Box w="6px" h="6px" borderRadius="full" bg={tokens.success} boxShadow={`0 0 8px ${tokens.success}`} flexShrink={0} />
                <Text fontSize={{ base: 'xs', sm: 'sm' }} fontWeight="500" color={tokens.textMuted} lineHeight="1.5">
                  {period.week}주차 · {period.weekStartDate} ~ {period.weekEndDate}
                </Text>
              </Flex>
            )}
          </Flex>
        )}
      </Box>

      <Box
        flex={1}
        px={contentPx ?? { base: 3, sm: 4, lg: 8 }}
        py={contentPx ? { base: 3, lg: 4 } : { base: 4, sm: 5, lg: 8 }}
        maxW={contentMaxW}
        w="100%"
        minW={0}
        mx={contentMaxW === '100%' ? 0 : 'auto'}
      >
        {children}
      </Box>
    </Box>
  );
}
