package com.bridgetec.dev6report.service;

import com.bridgetec.dev6report.dto.MemberDto;
import com.bridgetec.dev6report.dto.MemberRequest;
import com.bridgetec.dev6report.entity.MemberEntity;
import com.bridgetec.dev6report.repo.MemberRepository;
import com.bridgetec.dev6report.util.MemberSortHelper;
import com.bridgetec.dev6report.util.ProductLineHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;
    private final ProjectService projectService;

    @Transactional(readOnly = true)
    public List<MemberDto> list(boolean includeInactive) {
        List<MemberEntity> members = includeInactive
                ? memberRepository.findAll()
                : memberRepository.findByActiveTrue();
        List<MemberEntity> sorted = new ArrayList<>(members);
        sorted.sort(MemberSortHelper.comparator());
        return sorted.stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public MemberEntity requireActiveMember(Long memberId) {
        MemberEntity member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "멤버를 찾을 수 없습니다."));
        if (!Boolean.TRUE.equals(member.getActive())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "비활성 멤버입니다.");
        }
        return member;
    }

    @Transactional
    public MemberDto create(MemberRequest request) {
        Instant now = Instant.now();
        MemberEntity entity = new MemberEntity();
        applyRequest(entity, request);
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        MemberEntity saved = memberRepository.save(entity);
        projectService.assignProjectsToMember(saved.getId(), request.projectIds());
        return toDto(saved);
    }

    @Transactional
    public MemberDto update(Long id, MemberRequest request) {
        MemberEntity entity = memberRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "멤버를 찾을 수 없습니다."));
        applyRequest(entity, request);
        entity.setUpdatedAt(Instant.now());
        MemberEntity saved = memberRepository.save(entity);
        if (request.projectIds() != null) {
            projectService.assignProjectsToMember(saved.getId(), request.projectIds());
        }
        return toDto(saved);
    }

    @Transactional
    public void delete(Long id) {
        MemberEntity entity = memberRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "멤버를 찾을 수 없습니다."));
        entity.setActive(false);
        entity.setUpdatedAt(Instant.now());
    }

    @Transactional
    public void reorder(List<Long> memberIds) {
        Instant now = Instant.now();
        for (int i = 0; i < memberIds.size(); i++) {
            Long id = memberIds.get(i);
            MemberEntity entity = memberRepository.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "멤버를 찾을 수 없습니다: " + id));
            entity.setSortOrder(i + 1);
            entity.setUpdatedAt(now);
        }
    }

    private void applyRequest(MemberEntity entity, MemberRequest request) {
        entity.setName(request.name().trim());
        entity.setTeam(trimOrNull(request.team()));
        entity.setRole(request.role() != null && !request.role().isBlank() ? request.role().trim() : "MEMBER");
        if (request.sortOrder() != null) {
            entity.setSortOrder(request.sortOrder());
        } else if (entity.getSortOrder() == null) {
            entity.setSortOrder(nextSortOrder(entity));
        }
        entity.setEmail(trimOrNull(request.email()));
        entity.setJiraUsername(trimOrNull(request.jiraUsername()));
        List<String> assigned = ProductLineHelper.normalizeAssigned(request.assignedProductLines(), entity.getTeam());
        entity.setAssignedProductLines(ProductLineHelper.joinAssigned(assigned));
        if (request.requiresDev6Report() != null) {
            entity.setRequiresDev6Report(request.requiresDev6Report());
        }
        if (request.requiresJiraReport() != null) {
            entity.setRequiresJiraReport(request.requiresJiraReport());
        }
        if (request.active() != null) {
            entity.setActive(request.active());
        }
    }

    private MemberDto toDto(MemberEntity entity) {
        return new MemberDto(
                entity.getId(),
                entity.getName(),
                entity.getTeam(),
                entity.getRole(),
                entity.getSortOrder(),
                entity.getEmail(),
                entity.getJiraUsername(),
                ProductLineHelper.resolveForMember(entity),
                Boolean.TRUE.equals(entity.getRequiresDev6Report()),
                Boolean.TRUE.equals(entity.getRequiresJiraReport()),
                Boolean.TRUE.equals(entity.getActive()),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private String trimOrNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private int nextSortOrder(MemberEntity entity) {
        List<MemberEntity> all = memberRepository.findAll();
        int max = 0;
        boolean leader = "LEADER".equals(entity.getRole());
        for (MemberEntity m : all) {
            if (leader) {
                if (!"LEADER".equals(m.getRole())) continue;
            } else if ("LEADER".equals(m.getRole())) {
                continue;
            } else if (MemberSortHelper.partOrder(m.getTeam()) != MemberSortHelper.partOrder(entity.getTeam())) {
                continue;
            }
            if (m.getSortOrder() != null && m.getSortOrder() > max) {
                max = m.getSortOrder();
            }
        }
        return max + 1;
    }
}
