import { useState } from 'react';
import AppShell from '../components/Layout/AppShell';
import StatisticsPanel from '../components/Statistics/StatisticsPanel';
import MyWeeklyReportPanel from '../components/WeeklyReport/MyWeeklyReportPanel';
import TeamWeeklySummaryPanel from '../components/WeeklyReport/TeamWeeklySummaryPanel';
import Dev6SheetPanel from '../components/WeeklyReport/Dev6SheetPanel';
import WeeklyReportPanel from '../components/WeeklyReport/WeeklyReportPanel';
import MonthlyReportPanel from '../components/MonthlyReport/MonthlyReportPanel';
import SettingsPanel from '../components/Settings/SettingsPanel';
import { useCurrentPeriod } from '../hooks/useReports';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('my-report');
  const { data: period } = useCurrentPeriod();
  const [year, setYear] = useState(new Date().getFullYear());

  const showPeriodBar = !['members', 'my-report'].includes(activeTab);
  const wideLayout = ['dev6-sheet', 'monthly'].includes(activeTab);

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      year={year}
      onYearChange={setYear}
      period={period}
      showPeriodBar={showPeriodBar}
      contentMaxW={wideLayout ? '100%' : '1440px'}
      contentPx={wideLayout ? { base: 2, lg: 4 } : undefined}
    >
      {activeTab === 'my-report' && <MyWeeklyReportPanel year={year} />}
      {activeTab === 'team-summary' && <TeamWeeklySummaryPanel year={year} />}
      {activeTab === 'dev6-sheet' && <Dev6SheetPanel year={year} />}
      {activeTab === 'dashboard' && <StatisticsPanel year={year} />}
      {activeTab === 'weekly' && <WeeklyReportPanel year={year} />}
      {activeTab === 'monthly' && <MonthlyReportPanel year={year} />}
      {activeTab === 'members' && <SettingsPanel />}
    </AppShell>
  );
}
