package com.bridgetec.dev6report.jira;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;

public final class JiraIssueMapper {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private JiraIssueMapper() {
    }

    public static ObjectNode mapIssue(com.fasterxml.jackson.databind.ObjectMapper mapper, JsonNode issue) {
        JsonNode fields = issue.get("fields");
        ObjectNode row = mapper.createObjectNode();
        row.put("key", issue.path("key").asText());
        row.put("summary", fields.path("summary").asText(""));
        row.put("priority", fields.path("priority").path("name").asText("Major"));
        row.put("assignee", fields.path("assignee").path("displayName").asText("미지정"));
        row.put("status", fields.path("status").path("name").asText("상태없음"));
        row.put("srmStatus", getSrmStatus(fields.get("customfield_11517")));
        row.put("type", fields.path("issuetype").path("name").asText("Task"));
        String created = fields.path("created").asText(null);
        row.put("createdDate", formatDate(created, "-"));
        row.put("updatedDate", formatDate(fields.path("updated").asText(null), "-"));
        row.put("daysFromCreated", calculateDaysFromCreated(created));
        String due = fields.path("duedate").asText(null);
        Delay delay = calculateDelay(due);
        row.put("dueDate", formatDate(due, "미설정"));
        row.put("isDelayed", delay.isDelayed());
        row.put("delayDays", delay.delayDays());
        row.put("customer", getCustomerName(fields));
        return row;
    }

    private static String getSrmStatus(JsonNode customField) {
        if (customField == null || customField.isNull()) return "-";
        if (customField.isObject() && customField.has("value")) return customField.get("value").asText("-");
        if (customField.isTextual()) return customField.asText();
        return "-";
    }

    private static String getCustomerName(JsonNode fields) {
        JsonNode cf = fields.get("customfield_10402");
        if (cf != null && cf.isObject()) {
            if (cf.has("child") && cf.get("child").has("value")) return cf.get("child").get("value").asText();
            if (cf.has("value")) return cf.get("value").asText();
        }
        JsonNode components = fields.get("components");
        if (components != null && components.isArray() && !components.isEmpty()) {
            return components.get(0).path("name").asText();
        }
        String summary = fields.path("summary").asText("");
        if (summary.startsWith("[")) {
            int end = summary.indexOf(']');
            if (end > 1) return summary.substring(1, end);
        }
        return "미분류";
    }

    private static LocalDate toLocalDateKst(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String s = raw.trim();
        if (s.length() == 10 && s.charAt(4) == '-' && s.charAt(7) == '-') {
            try {
                return LocalDate.parse(s, DateTimeFormatter.ISO_LOCAL_DATE);
            } catch (DateTimeParseException ignored) {
                return null;
            }
        }
        try {
            return Instant.parse(s).atZone(KST).toLocalDate();
        } catch (DateTimeParseException ignored) { /* fall through */ }
        try {
            return OffsetDateTime.parse(s, DateTimeFormatter.ISO_OFFSET_DATE_TIME).atZoneSameInstant(KST).toLocalDate();
        } catch (DateTimeParseException ignored) { /* fall through */ }
        if (s.matches(".*[+-]\\d{4}$")) {
            try {
                String norm = s.replaceAll("([+-]\\d{2})(\\d{2})$", "$1:$2");
                return OffsetDateTime.parse(norm, DateTimeFormatter.ISO_OFFSET_DATE_TIME).atZoneSameInstant(KST).toLocalDate();
            } catch (DateTimeParseException ignored) { /* fall through */ }
        }
        return null;
    }

    private static String formatDate(String raw, String emptyText) {
        LocalDate d = toLocalDateKst(raw);
        return d != null ? d.format(DATE_FMT) : emptyText;
    }

    private static int calculateDaysFromCreated(String raw) {
        LocalDate created = toLocalDateKst(raw);
        if (created == null) return 0;
        return (int) Math.abs(ChronoUnit.DAYS.between(created, LocalDate.now(KST)));
    }

    private record Delay(boolean isDelayed, int delayDays) {}

    private static Delay calculateDelay(String dueRaw) {
        LocalDate due = toLocalDateKst(dueRaw);
        if (due == null) return new Delay(false, 0);
        LocalDate now = LocalDate.now(KST);
        if (now.isAfter(due)) {
            int days = (int) ChronoUnit.DAYS.between(due, now);
            return new Delay(true, Math.max(days, 1));
        }
        return new Delay(false, 0);
    }
}
