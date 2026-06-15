/** 제목/요약에 [고객사] 접두어가 있거나 고객사명이 포함된 경우 별도 표시 생략 */
export function shouldShowCustomer(title, customer) {
  const c = (customer || '').trim();
  if (!c || c === '미분류' || c === '-') return false;
  const t = (title || '').trim();
  if (!t) return true;
  if (t.includes(c)) return false;
  if (/^\[[^\]]+\]/.test(t)) return false;
  return true;
}
