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
            px={{ base: 4, lg: 8 }}
            py={3}
            gap={4}
            align="center"
            flexWrap="wrap"
            borderTop="1px solid"
            borderColor={tokens.border}
            bg={tokens.bgElevated}
          >
            <AppSelect value={year} onChange={(e) => onYearChange(Number(e.target.value))} minW="120px">
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}년</option>
              ))}
            </AppSelect>
            {period && (
              <Flex align="center" gap={2}>
                <Box w="6px" h="6px" borderRadius="full" bg={tokens.success} boxShadow={`0 0 8px ${tokens.success}`} />
                <Text fontSize="sm" fontWeight="500" color={tokens.textMuted}>
                  {period.week}주차 · {period.weekStartDate} ~ {period.weekEndDate}
                </Text>
              </Flex>
            )}
          </Flex>
        )}
      </Box>

      <Box
        flex={1}
        px={contentPx ?? { base: 4, lg: 8 }}
        py={contentPx ? { base: 3, lg: 4 } : { base: 5, lg: 8 }}
        maxW={contentMaxW}
        w="100%"
        mx={contentMaxW === '100%' ? 0 : 'auto'}
      >
        {children}
      </Box>
    </Box>
  );
}
