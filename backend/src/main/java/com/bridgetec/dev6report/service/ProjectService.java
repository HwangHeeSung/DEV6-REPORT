package com.bridgetec.dev6report.service;

import com.bridgetec.dev6report.dto.ProjectDto;
import com.bridgetec.dev6report.dto.ProjectRequest;
import com.bridgetec.dev6report.entity.MemberEntity;
import com.bridgetec.dev6report.entity.MemberProjectEntity;
import com.bridgetec.dev6report.entity.ProjectEntity;
import com.bridgetec.dev6report.repo.MemberProjectRepository;
import com.bridgetec.dev6report.repo.MemberRepository;
import com.bridgetec.dev6report.repo.ProjectRepository;
import com.bridgetec.dev6report.util.PartHelper;
import com.bridgetec.dev6report.util.ProductLineHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final MemberProjectRepository memberProjectRepository;
    private final MemberRepository memberRepository;

    @Transactional(readOnly = true)
    public List<ProjectDto> list(String productLine, String workType, String q, String mapping, Long memberId, boolean includeInactive) {
        List<ProjectEntity> projects;
        if (memberId != null) {
            projects = projectRepository.findByMemberId(memberId);
        } else if (hasSearchFilter(productLine, workType, q, mapping, includeInactive)) {
            projects = projectRepository.search(
                    trimOrNull(q),
                    trimOrNull(productLine),
                    trimOrNull(workType),
                    trimOrNull(mapping),
                    includeInactive
            );
        } else if (includeInactive) {
            projects = projectRepository.findAllByOrderBySortOrderAscNameAsc();
        } else {
            projects = projectRepository.findByActiveTrueOrderBySortOrderAscNameAsc();
        }
        Map<Long, List<Long>> memberIdsByProject = loadMemberIdsByProject(projects);
        return projects.stream().map(p -> toDto(p, memberIdsByProject.getOrDefault(p.getId(), List.of()))).toList();
    }

    @Transactional(readOnly = true)
    public List<ProjectDto> listForTeam(String team) {
        List<String> lines = PartHelper.productLinesForTeam(team);
        if (lines.isEmpty()) {
            return list(null, null, null, null, null, false);
        }
        return projectRepository.findByProductLineInAndActiveTrueOrderBySortOrderAscNameAsc(lines).stream()
                .map(p -> toDto(p, List.of()))
                .toList();
    }

    /** 멤버 담당 솔루션 기준 활성 프로젝트 (주간보고 선택용) */
    @Transactional(readOnly = true)
    public List<ProjectDto> listForMemberSolutions(Long memberId) {
        MemberEntity member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "멤버를 찾을 수 없습니다."));
        List<String> lines = ProductLineHelper.resolveForMember(member);
        if (lines.isEmpty()) {
            return List.of();
        }
        return projectRepository.findByProductLineInAndActiveTrueOrderBySortOrderAscNameAsc(lines).stream()
                .map(p -> toDto(p, List.of()))
                .toList();
    }

    @Transactional
    public ProjectDto create(ProjectRequest request) {
        validateRequest(request, null);
        Instant now = Instant.now();
        ProjectEntity entity = new ProjectEntity();
        applyRequest(entity, request);
        if (entity.getSortOrder() == null || entity.getSortOrder() == 0) {
            entity.setSortOrder(nextSortOrder());
        }
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        ProjectEntity saved = projectRepository.save(entity);
        replaceMemberAssignments(saved.getId(), request.memberIds());
        return toDto(saved, request.memberIds() != null ? request.memberIds() : List.of());
    }

    @Transactional
    public ProjectDto update(Long id, ProjectRequest request) {
        ProjectEntity entity = projectRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "프로젝트를 찾을 수 없습니다."));
        validateRequest(request, id);
        applyRequest(entity, request);
        entity.setUpdatedAt(Instant.now());
        ProjectEntity saved = projectRepository.save(entity);
        if (request.memberIds() != null) {
            replaceMemberAssignments(saved.getId(), request.memberIds());
        }
        List<Long> memberIds = memberProjectRepository.findByProjectId(saved.getId()).stream()
                .map(MemberProjectEntity::getMemberId)
                .toList();
        return toDto(saved, memberIds);
    }

    @Transactional
    public void delete(Long id) {
        ProjectEntity entity = projectRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "프로젝트를 찾을 수 없습니다."));
        entity.setActive(false);
        entity.setUpdatedAt(Instant.now());
        memberProjectRepository.deleteByProjectId(id);
    }

    @Transactional
    public ProjectDto restore(Long id) {
        ProjectEntity entity = projectRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "프로젝트를 찾을 수 없습니다."));
        validateDuplicate(entity.getProjectCode(), entity.getProductLine(), id);
        entity.setActive(true);
        entity.setUpdatedAt(Instant.now());
        ProjectEntity saved = projectRepository.save(entity);
        List<Long> memberIds = memberProjectRepository.findByProjectId(saved.getId()).stream()
                .map(MemberProjectEntity::getMemberId)
                .toList();
        return toDto(saved, memberIds);
    }

    @Transactional
    public void assignProjectsToMember(Long memberId, List<Long> projectIds) {
        memberProjectRepository.deleteByMemberId(memberId);
        if (projectIds == null) return;
        for (Long projectId : projectIds) {
            MemberProjectEntity link = new MemberProjectEntity();
            link.setMemberId(memberId);
            link.setProjectId(projectId);
            memberProjectRepository.save(link);
        }
    }

    private void validateRequest(ProjectRequest request, Long excludeId) {
        if (request.name() == null || request.name().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "프로젝트명은 필수입니다.");
        }
        if (request.projectCode() == null || request.projectCode().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "프로젝트코드는 필수입니다.");
        }
        validateDuplicate(request.projectCode().trim(), normalizeProductLine(request.productLine()), excludeId);
    }

    private void validateDuplicate(String projectCode, String productLine, Long excludeId) {
        if (projectCode == null || projectCode.isBlank()) {
            return;
        }
        if (projectRepository.existsActiveByCodeAndProductLine(projectCode.trim(), productLine, excludeId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "동일한 프로젝트코드·솔루션 조합이 이미 등록되어 있습니다: " + projectCode + " / " + (productLine != null ? productLine : "-"));
        }
    }

    private int nextSortOrder() {
        return projectRepository.findAllByOrderBySortOrderAscNameAsc().stream()
                .mapToInt(ProjectEntity::getSortOrder)
                .max()
                .orElse(0) + 1;
    }

    private boolean hasSearchFilter(String productLine, String workType, String q, String mapping, boolean includeInactive) {
        return (productLine != null && !productLine.isBlank())
                || (workType != null && !workType.isBlank())
                || (q != null && !q.isBlank())
                || (mapping != null && !mapping.isBlank() && !"all".equalsIgnoreCase(mapping.trim()))
                || includeInactive;
    }

    private void replaceMemberAssignments(Long projectId, List<Long> memberIds) {
        memberProjectRepository.deleteByProjectId(projectId);
        if (memberIds == null) return;
        for (Long memberId : memberIds) {
            MemberProjectEntity link = new MemberProjectEntity();
            link.setMemberId(memberId);
            link.setProjectId(projectId);
            memberProjectRepository.save(link);
        }
    }

    private Map<Long, List<Long>> loadMemberIdsByProject(List<ProjectEntity> projects) {
        List<Long> projectIds = projects.stream().map(ProjectEntity::getId).toList();
        return memberProjectRepository.findAll().stream()
                .filter(mp -> projectIds.contains(mp.getProjectId()))
                .collect(Collectors.groupingBy(
                        MemberProjectEntity::getProjectId,
                        Collectors.mapping(MemberProjectEntity::getMemberId, Collectors.toList())
                ));
    }

    private void applyRequest(ProjectEntity entity, ProjectRequest request) {
        entity.setName(request.name().trim());
        entity.setProjectCode(trimOrNull(request.projectCode()));
        entity.setProductLine(normalizeProductLine(request.productLine()));
        if (request.workType() != null && !request.workType().isBlank()) {
            entity.setWorkType(request.workType().trim());
        }
        entity.setCustomer(trimOrNull(request.customer()));
        entity.setSolution(trimOrNull(request.solution()));
        if (request.active() != null) {
            entity.setActive(request.active());
        }
        if (request.sortOrder() != null) {
            entity.setSortOrder(request.sortOrder());
        }
    }

    private String normalizeProductLine(String productLine) {
        if (productLine == null || productLine.isBlank()) {
            return null;
        }
        return productLine.trim().toUpperCase();
    }

    private ProjectDto toDto(ProjectEntity entity, List<Long> memberIds) {
        return new ProjectDto(
                entity.getId(),
                entity.getName(),
                entity.getProjectCode(),
                entity.getProductLine(),
                entity.getWorkType(),
                entity.getCustomer(),
                entity.getSolution(),
                Boolean.TRUE.equals(entity.getActive()),
                entity.getSortOrder(),
                memberIds,
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private String trimOrNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
