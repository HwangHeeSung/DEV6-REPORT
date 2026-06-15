package com.bridgetec.dev6report.service;

import com.bridgetec.dev6report.config.JiraProperties;
import com.bridgetec.dev6report.entity.MemberEntity;
import com.bridgetec.dev6report.jira.JiraIssueMapper;
import com.bridgetec.dev6report.repo.MemberRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * BT Dashboard 개발6팀 탭(inProgress)과 동일한 JQL로 이슈를 조회한 뒤,
 * assignee가 멤버에 등록된 Jira 계정/이름과 일치하는 항목만 반환합니다.
 */
@Service
@RequiredArgsConstructor
public class JiraMemberIssueService {

    private static final int MAX_RESULTS = 200;

    private final JiraProxyService jiraProxyService;
    private final JiraProperties jiraProperties;
    private final MemberRepository memberRepository;
    private final ObjectMapper objectMapper;

    /** BT Dashboard 개발6팀 탭(inProgress) JQL — 팀 전체 이슈 */
    public ObjectNode getDev6TeamIssues() {
        String baseJql = jiraProperties.getDev6TeamIssuesJql();
        if (baseJql == null || baseJql.isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "jira.dev6-team-issues-jql 설정이 비어 있습니다.");
        }
        String jql = baseJql.trim() + " ORDER BY createdDate ASC";
        JsonNode raw = jiraProxyService.searchRaw(jql, MAX_RESULTS, null);

        List<ObjectNode> issues = new ArrayList<>();
        JsonNode issuesNode = raw.path("issues");
        if (issuesNode.isArray()) {
            for (JsonNode issue : issuesNode) {
                issues.add(JiraIssueMapper.mapIssue(objectMapper, issue));
            }
        }

        issues.sort(Comparator
                .comparing((ObjectNode row) -> !row.path("isDelayed").asBoolean(false))
                .thenComparing(row -> row.path("createdDate").asText("")));

        ArrayNode issuesOut = objectMapper.createArrayNode();
        issues.forEach(issuesOut::add);

        ObjectNode out = objectMapper.createObjectNode();
        out.put("total", issues.size());
        out.set("issues", issuesOut);
        return out;
    }

    public ObjectNode getMemberIssues(Long memberId) {
        MemberEntity member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "멤버를 찾을 수 없습니다."));
        if (trimToNull(member.getName()) == null && trimToNull(member.getJiraUsername()) == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "멤버 이름 또는 Jira 계정(assignee)이 필요합니다.");
        }

        String baseJql = jiraProperties.getDev6TeamIssuesJql();
        if (baseJql == null || baseJql.isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "jira.dev6-team-issues-jql 설정이 비어 있습니다.");
        }
        String jql = baseJql.trim() + " ORDER BY createdDate ASC";
        JsonNode raw = jiraProxyService.searchRaw(jql, MAX_RESULTS, null);

        List<ObjectNode> matched = new ArrayList<>();
        JsonNode issues = raw.path("issues");
        if (issues.isArray()) {
            for (JsonNode issue : issues) {
                if (!matchesMember(issue.path("fields"), member)) {
                    continue;
                }
                matched.add(JiraIssueMapper.mapIssue(objectMapper, issue));
            }
        }

        matched.sort(Comparator
                .comparing((ObjectNode row) -> !row.path("isDelayed").asBoolean(false))
                .thenComparing(row -> row.path("createdDate").asText("")));

        ArrayNode issuesOut = objectMapper.createArrayNode();
        matched.forEach(issuesOut::add);

        ObjectNode out = objectMapper.createObjectNode();
        out.put("total", matched.size());
        out.set("issues", issuesOut);
        return out;
    }

    private boolean matchesMember(JsonNode fields, MemberEntity member) {
        JsonNode assignee = fields.path("assignee");
        if (assignee.isMissingNode() || assignee.isNull()) {
            return false;
        }
        String displayName = assignee.path("displayName").asText("").trim();
        String accountId = assignee.path("name").asText("").trim();
        String registered = trimToNull(member.getJiraUsername());
        String memberName = trimToNull(member.getName());
        if (registered == null && memberName == null) {
            return false;
        }
        return equalsIgnoreCase(displayName, registered)
                || equalsIgnoreCase(accountId, registered)
                || equalsIgnoreCase(displayName, memberName)
                || equalsIgnoreCase(accountId, memberName);
    }

    private boolean equalsIgnoreCase(String a, String b) {
        if (a == null || b == null || a.isBlank() || b.isBlank()) {
            return false;
        }
        return a.equalsIgnoreCase(b.trim());
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
