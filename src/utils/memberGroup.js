export function isPart1(team) {
  return team?.includes('1파트');
}

export function isPart2(team) {
  return team?.includes('2파트');
}

/** API 정렬 순서를 유지하며 파트·팀장 그룹으로 분류 */
export function groupMembersByPart(members = []) {
  const leaders = [];
  const part1 = [];
  const part2 = [];
  const other = [];

  for (const member of members) {
    if (member.role === 'LEADER') {
      leaders.push(member);
    } else if (isPart1(member.team)) {
      part1.push(member);
    } else if (isPart2(member.team)) {
      part2.push(member);
    } else {
      other.push(member);
    }
  }

  return { leaders, part1, part2, other };
}

export const PART_SECTIONS = [
  { key: 'leaders', title: '팀장', subtitle: '팀 전체' },
  { key: 'part1', title: '1파트', subtitle: 'SWAT · IPRON CTI' },
  { key: 'part2', title: '2파트', subtitle: 'ARGO · RSM' },
  { key: 'other', title: '기타', subtitle: '파트 미지정' },
];
