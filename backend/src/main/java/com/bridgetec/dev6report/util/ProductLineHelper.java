package com.bridgetec.dev6report.util;

import com.bridgetec.dev6report.entity.MemberEntity;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public final class ProductLineHelper {

    public static final List<String> PART1_OPTIONS = List.of("SWAT", "IPRON CTI");
    public static final List<String> PART2_OPTIONS = List.of("ARGO", "RSM");

    private ProductLineHelper() {
    }

    public static List<String> optionsForTeam(String team) {
        if (team == null || team.isBlank()) {
            return List.of();
        }
        if (team.contains("1파트")) {
            return PART1_OPTIONS;
        }
        if (team.contains("2파트")) {
            return PART2_OPTIONS;
        }
        return List.of();
    }

    public static List<String> parseAssigned(String stored) {
        if (stored == null || stored.isBlank()) {
            return List.of();
        }
        return Arrays.stream(stored.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    public static String joinAssigned(List<String> lines) {
        if (lines == null || lines.isEmpty()) {
            return null;
        }
        return String.join(",", lines);
    }

    public static List<String> resolveForMember(MemberEntity member) {
        if (member == null) {
            return List.of();
        }
        List<String> allowed = optionsForTeam(member.getTeam());
        if (allowed.isEmpty()) {
            return List.of();
        }
        List<String> assigned = parseAssigned(member.getAssignedProductLines());
        if (!assigned.isEmpty()) {
            List<String> filtered = new ArrayList<>();
            for (String line : assigned) {
                String canonical = canonicalLine(line);
                if (allowed.contains(canonical) && !filtered.contains(canonical)) {
                    filtered.add(canonical);
                }
            }
            if (!filtered.isEmpty()) {
                return filtered;
            }
        }
        return defaultForTeam(member.getTeam());
    }

    public static List<String> defaultForTeam(String team) {
        if (team != null && team.contains("1파트")) {
            return List.of("SWAT");
        }
        if (team != null && team.contains("2파트")) {
            return List.of("ARGO", "RSM");
        }
        return List.of();
    }

    public static List<String> normalizeAssigned(List<String> requested, String team) {
        List<String> allowed = optionsForTeam(team);
        if (allowed.isEmpty()) {
            return List.of();
        }
        if (requested == null || requested.isEmpty()) {
            return defaultForTeam(team);
        }
        List<String> normalized = new ArrayList<>();
        for (String line : requested) {
            if (line == null || line.isBlank()) {
                continue;
            }
            String canonical = canonicalLine(line.trim());
            if (allowed.contains(canonical) && !normalized.contains(canonical)) {
                normalized.add(canonical);
            }
        }
        return normalized.isEmpty() ? defaultForTeam(team) : normalized;
    }

    private static String canonicalLine(String line) {
        if ("IPRON CTI".equalsIgnoreCase(line)) {
            return "IPRON CTI";
        }
        return line.toUpperCase();
    }
}
