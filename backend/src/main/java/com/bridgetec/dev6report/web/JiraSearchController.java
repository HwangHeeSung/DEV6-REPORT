package com.bridgetec.dev6report.web;

import com.bridgetec.dev6report.service.JiraMemberIssueService;
import com.bridgetec.dev6report.service.JiraProxyService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/jira")
@RequiredArgsConstructor
public class JiraSearchController {

    private final JiraProxyService jiraProxyService;
    private final JiraMemberIssueService jiraMemberIssueService;

    @PostMapping(value = "/search", produces = MediaType.APPLICATION_JSON_VALUE)
    public JsonNode search(@RequestBody JsonNode body) {
        String jql = body.path("jql").asText(null);
        if (jql == null || jql.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "jql is required");
        }
        int maxResults = body.has("maxResults") && body.get("maxResults").canConvertToInt()
                ? body.get("maxResults").asInt()
                : 200;
        String fields = body.has("fields") && body.get("fields").isTextual()
                ? body.get("fields").asText()
                : null;
        if (body.path("rawResponse").asBoolean(false)) {
            return jiraProxyService.searchRaw(jql, maxResults, fields);
        }
        return jiraProxyService.search(jql, maxResults, fields);
    }

    /** 개발6팀 JIRA — BT Dashboard 개발6팀 탭(inProgress) JQL 전체 이슈 */
    @GetMapping("/dev6-team/issues")
    public ObjectNode dev6TeamIssues() {
        return jiraMemberIssueService.getDev6TeamIssues();
    }

    /** 멤버 Assignee 이슈 — BT Dashboard 개발6팀 탭(inProgress) 기준 + assignee 일치 필터 */
    @GetMapping("/member/{memberId}/issues")
    public ObjectNode memberIssues(@PathVariable Long memberId) {
        return jiraMemberIssueService.getMemberIssues(memberId);
    }
}
