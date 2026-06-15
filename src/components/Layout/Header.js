import { Box, Flex, Heading, Text, Button } from '@chakra-ui/react';
import { APP_NAME } from '../ui/AppBanner';

const TABS = [
  { id: 'my-report', label: '내 주간보고', hint: '팀원' },
  { id: 'monthly', label: '월간 보고' },
  { id: 'team-summary', label: '팀 취합', hint: '팀장' },
  { id: 'dashboard', label: '통계' },
  { id: 'weekly', label: '전체 보고' },
  { id: 'members', label: '설정' },
];

export default function Header({ activeTab, onTabChange }) {
  return (
    <Box bg="gray.800" borderBottom="1px solid" borderColor="gray.700" px={6} py={4}>
      <Flex align="center" justify="space-between" mb={4}>
        <Box>
          <Heading size="lg" color="teal.300">{APP_NAME}</Heading>
          <Text color="gray.400" fontSize="sm" mt={1}>
            주간·월간 보고 등록 · 팀장 취합
          </Text>
        </Box>
      </Flex>
      <Flex gap={2} flexWrap="wrap">
        {TABS.map((tab) => (
          <Button
            key={tab.id}
            size="sm"
            variant={activeTab === tab.id ? 'solid' : 'outline'}
            colorPalette={activeTab === tab.id ? 'teal' : 'gray'}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.hint ? `${tab.label} (${tab.hint})` : tab.label}
          </Button>
        ))}
      </Flex>
    </Box>
  );
}
