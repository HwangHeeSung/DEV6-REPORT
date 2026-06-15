package com.bridgetec.dev6report.util;

public final class CustomerNameHelper {

    private CustomerNameHelper() {
    }

    /** 프로젝트명 `[고객사] …` 또는 유지보수명에서 고객사 추출 */
    public static String extractFromProjectName(String name, String workType) {
        if (name == null || name.isBlank()) {
            return "";
        }
        String trimmed = name.trim();
        if ("유지보수".equals(workType)) {
            return trimmed;
        }
        if (trimmed.startsWith("[") && trimmed.contains("]")) {
            int end = trimmed.indexOf(']');
            return trimmed.substring(1, end).trim();
        }
        return "";
    }

    public static String resolveClientName(String projectCustomer, String projectName, String workType) {
        if (projectCustomer != null && !projectCustomer.isBlank()) {
            return projectCustomer.trim();
        }
        return extractFromProjectName(projectName, workType);
    }
}
