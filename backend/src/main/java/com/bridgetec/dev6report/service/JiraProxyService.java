package com.bridgetec.dev6report.service;

import com.bridgetec.dev6report.config.JiraProperties;
import com.bridgetec.dev6report.jira.JiraIssueMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class JiraProxyService {

    private static final String DEFAULT_FIELDS =
            "summary,priority,assignee,status,issuetype,created,duedate,customfield_11517,customfield_10402,components";

    private final RestClient.Builder restClientBuilder;
    private final JiraProperties jiraProperties;
    private final ObjectMapper objectMapper;

    public ObjectNode search(String jql, int maxResults, String fields) {
        JsonNode root = fetchSearchJson(jql, maxResults, fields);
        ObjectNode out = objectMapper.createObjectNode();
        out.put("total", root.path("total").asInt(0));
        ArrayNode issuesOut = objectMapper.createArrayNode();
        JsonNode issues = root.get("issues");
        if (issues != null && issues.isArray()) {
            for (JsonNode issue : issues) {
                issuesOut.add(JiraIssueMapper.mapIssue(objectMapper, issue));
            }
        }
        out.set("issues", issuesOut);
        return out;
    }

    public JsonNode searchRaw(String jql, int maxResults, String fields) {
        return fetchSearchJson(jql, maxResults, fields);
    }

    private JsonNode fetchSearchJson(String jql, int maxResults, String fields) {
        String user = jiraProperties.getUsername();
        String pass = jiraProperties.getPassword();
        if (user == null || user.isBlank() || pass == null || pass.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "JIRA_USERNAME / JIRA_PASSWORD 가 설정되지 않았습니다.");
        }
        String base = jiraProperties.getBaseUrl().replaceAll("/+$", "");
        String url = base + "/rest/api/2/search";
        String fieldList = (fields == null || fields.isBlank()) ? DEFAULT_FIELDS : fields;
        var uri = UriComponentsBuilder.fromUriString(url)
                .queryParam("jql", jql)
                .queryParam("maxResults", maxResults)
                .queryParam("fields", fieldList)
                .encode(StandardCharsets.UTF_8)
                .build()
                .toUri();
        String auth = Base64.getEncoder().encodeToString((user + ":" + pass).getBytes(StandardCharsets.UTF_8));
        try {
            RestClient client = restClientBuilder.build();
            String body = client.get()
                    .uri(uri)
                    .header(HttpHeaders.AUTHORIZATION, "Basic " + auth)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(String.class);
            return objectMapper.readTree(body);
        } catch (RestClientResponseException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Jira error: " + e.getStatusCode(), e);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Jira request failed", e);
        }
    }
}
