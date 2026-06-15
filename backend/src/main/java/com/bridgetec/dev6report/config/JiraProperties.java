package com.bridgetec.dev6report.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "jira")
public class JiraProperties {
    private String baseUrl = "http://qa.bridgetec.co.kr/jira";
    private String username = "";
    private String password = "";
    /** BT Dashboard 개발6팀 탭(inProgress)과 동일한 JQL (ORDER BY 제외) */
    private String dev6TeamIssuesJql =
            "project = SS AND (처리부서 = 개발6팀 OR assignee in membersOf(개발6팀)) AND status != Closed AND duedate > 2026-01-01";
}
