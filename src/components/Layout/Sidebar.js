import { Box, Flex, Text, Image } from '@chakra-ui/react';
import {
  FiEdit3, FiUsers, FiGrid, FiBarChart2, FiFileText, FiCalendar,
  FiSettings,
} from 'react-icons/fi';
import { APP_LOGO_SRC, APP_NAME } from '../ui/AppBanner';
import { tokens } from '../../theme/tokens';

const NAV = [
  { id: 'my-report', label: '내 주간보고', hint: '팀원', icon: FiEdit3 },
  { id: 'monthly', label: '월간 보고', icon: FiCalendar },
  { id: 'team-summary', label: '팀 취합', hint: '팀장', icon: FiUsers },
  { id: 'dev6-sheet', label: '개발6팀 시트', hint: '필수-팀원', icon: FiGrid },
  { id: 'dashboard', label: '통계', icon: FiBarChart2 },
  { id: 'weekly', label: '전체 보고', icon: FiFileText },
  { id: 'members', label: '설정', icon: FiSettings },
];

export default function Sidebar({ activeTab, onTabChange }) {
  return (
    <Box
      as="header"
      w="100%"
      bg="transparent"
      px={{ base: 3, sm: 4, lg: 8 }}
      py={{ base: 2.5, md: 3 }}
    >
      <Flex
        align="center"
        gap={{ base: 3, lg: 6 }}
        flexWrap={{ base: 'wrap', xl: 'nowrap' }}
      >
        <Flex align="center" gap={2.5} flexShrink={0} minW={0}>
          <Box
            w="40px"
            h="40px"
            borderRadius="12px"
            overflow="hidden"
            flexShrink={0}
            boxShadow="0 6px 20px rgba(99, 102, 241, 0.35)"
          >
            <Image
              src={APP_LOGO_SRC}
              alt={APP_NAME}
              w="100%"
              h="100%"
              objectFit="cover"
            />
          </Box>
          <Box display={{ base: 'none', sm: 'block' }} minW={0}>
            <Text
              fontWeight="800"
              fontSize={{ base: 'sm', md: 'md' }}
              letterSpacing="-0.03em"
              lineHeight="1.2"
              whiteSpace="nowrap"
            >
              {APP_NAME}
            </Text>
          </Box>
        </Flex>

        <Flex
          flex={1}
          gap={1}
          minW={0}
          w={{ base: '100%', xl: 'auto' }}
          overflowX="auto"
          flexWrap={{ base: 'nowrap', xl: 'wrap' }}
          py={0.5}
          mx={{ base: -1, sm: 0 }}
          px={{ base: 1, sm: 0 }}
          className="app-scroll-x"
          css={{
            scrollSnapType: 'x proximity',
            '&::-webkit-scrollbar': { height: '4px' },
            '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.16)', borderRadius: '999px' },
          }}
        >
          {NAV.map((item) => {
            const active = activeTab === item.id;
            const Icon = item.icon;
            return (
              <Box
                key={item.id}
                as="button"
                type="button"
                onClick={() => onTabChange(item.id)}
                display="flex"
                alignItems="center"
                gap={2}
                flexShrink={0}
                px={{ base: 2.5, md: 3 }}
                py={{ base: 1.5, md: 2 }}
                borderRadius="10px"
                scrollSnapAlign="start"
                cursor="pointer"
                transition="all 0.15s ease"
                bg={active ? 'rgba(99, 102, 241, 0.18)' : 'transparent'}
                border="1px solid"
                borderColor={active ? 'rgba(99, 102, 241, 0.35)' : 'transparent'}
                color={active ? tokens.text : tokens.textMuted}
                _hover={{
                  bg: active ? 'rgba(99, 102, 241, 0.18)' : tokens.surfaceHover,
                  color: tokens.text,
                }}
              >
                <Icon size={16} style={{ flexShrink: 0, opacity: active ? 1 : 0.85 }} />
                <Text fontSize={{ base: 'xs', sm: 'sm' }} fontWeight={active ? '600' : '500'} whiteSpace="nowrap">
                  {item.label}
                </Text>
                {item.hint && (
                  <Text
                    as="span"
                    fontSize="xs"
                    color={active ? tokens.accent : tokens.textFaint}
                    display={{ base: 'none', lg: 'inline' }}
                  >
                    ({item.hint})
                  </Text>
                )}
              </Box>
            );
          })}
        </Flex>
      </Flex>
    </Box>
  );
}
