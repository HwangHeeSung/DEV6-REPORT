/** 프로젝트·유지보수에 등록된 솔루션(productLine) 기준 금주 실적 기본 양식 */
export function accomplishmentsTemplateForProductLine(productLine) {
  const line = (productLine || '').trim();
  if (!line) return '';
  return `○ ${line}\n -\n  .`;
}

/** 저장된 값이 없을 때 해당 솔루션 양식 적용 */
export function accomplishmentsOrDefault(value, productLine) {
  const trimmed = (value || '').trim();
  if (trimmed) return trimmed;
  return accomplishmentsTemplateForProductLine(productLine);
}
