package com.bridgetec.dev6report.web;

import com.bridgetec.dev6report.dto.ProjectDto;
import com.bridgetec.dev6report.dto.ProjectRequest;
import com.bridgetec.dev6report.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping("/projects")
    public List<ProjectDto> list(
            @RequestParam(required = false) String productLine,
            @RequestParam(required = false) String workType,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String mapping,
            @RequestParam(required = false) Long memberId,
            @RequestParam(required = false) String team,
            @RequestParam(defaultValue = "false") boolean memberSolutions,
            @RequestParam(defaultValue = "false") boolean includeInactive) {
        if (memberId != null && memberSolutions) {
            return projectService.listForMemberSolutions(memberId);
        }
        if (team != null && !team.isBlank()) {
            return projectService.listForTeam(team);
        }
        return projectService.list(productLine, workType, q, mapping, memberId, includeInactive);
    }

    @PostMapping("/projects")
    public ProjectDto create(@Valid @RequestBody ProjectRequest request) {
        return projectService.create(request);
    }

    @PutMapping("/projects/{id}")
    public ProjectDto update(@PathVariable Long id, @Valid @RequestBody ProjectRequest request) {
        return projectService.update(id, request);
    }

    @DeleteMapping("/projects/{id}")
    public void delete(@PathVariable Long id) {
        projectService.delete(id);
    }

    @PostMapping("/projects/{id}/restore")
    public ProjectDto restore(@PathVariable Long id) {
        return projectService.restore(id);
    }
}
