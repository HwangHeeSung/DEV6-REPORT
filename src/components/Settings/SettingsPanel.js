import { useState } from 'react';
import { Box } from '@chakra-ui/react';
import { SegmentedControl } from '../ui/FilterBar';
import MemberPanel from '../Member/MemberPanel';
import ProjectPanel from '../Project/ProjectPanel';

const SETTINGS_TABS = [
  { value: 'members', label: '팀원 관리' },
  { value: 'projects', label: '프로젝트 코드' },
];

export default function SettingsPanel() {
  const [tab, setTab] = useState('members');

  return (
    <Box w="100%">
      <Box mb={5} w="100%">
        <SegmentedControl
          options={SETTINGS_TABS}
          value={tab}
          onChange={setTab}
          size="lg"
          fullWidth
        />
      </Box>

      {tab === 'members' ? <MemberPanel embedded /> : <ProjectPanel embedded />}
    </Box>
  );
}
