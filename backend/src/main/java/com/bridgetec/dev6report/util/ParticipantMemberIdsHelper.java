package com.bridgetec.dev6report.util;

import com.bridgetec.dev6report.entity.MemberEntity;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public final class ParticipantMemberIdsHelper {

    private ParticipantMemberIdsHelper() {
    }

    public static String serialize(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return null;
        }
        String joined = ids.stream()
                .filter(id -> id != null && id > 0)
                .distinct()
                .map(String::valueOf)
                .collect(Collectors.joining(","));
        return joined.isEmpty() ? null : joined;
    }

    public static List<Long> parse(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        List<Long> ids = new ArrayList<>();
        for (String part : raw.split(",")) {
            String trimmed = part.trim();
            if (trimmed.isEmpty()) {
                continue;
            }
            try {
                ids.add(Long.parseLong(trimmed));
            } catch (NumberFormatException ignored) {
                // skip invalid token
            }
        }
        return ids;
    }

    public static List<String> resolveNames(String raw, Map<Long, MemberEntity> members) {
        if (members == null || members.isEmpty()) {
            return List.of();
        }
        LinkedHashSet<String> names = new LinkedHashSet<>();
        for (Long id : parse(raw)) {
            MemberEntity member = members.get(id);
            if (member != null && member.getName() != null && !member.getName().isBlank()) {
                names.add(member.getName().trim());
            }
        }
        return List.copyOf(names);
    }

    public static List<String> resolveNames(List<Long> ids, Map<Long, MemberEntity> members) {
        return resolveNames(serialize(ids), members);
    }
}
