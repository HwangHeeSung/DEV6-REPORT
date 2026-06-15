package com.bridgetec.dev6report.util;

import com.bridgetec.dev6report.entity.MemberEntity;

import java.util.Comparator;

public final class MemberSortHelper {

    private MemberSortHelper() {
    }

    public static int partOrder(String team) {
        if (team == null) {
            return 99;
        }
        if (team.contains("1파트")) {
            return 1;
        }
        if (team.contains("2파트")) {
            return 2;
        }
        return 99;
    }

    public static int roleOrder(String role) {
        if ("LEADER".equals(role)) {
            return 0;
        }
        if ("SUB_LEADER".equals(role)) {
            return 1;
        }
        return 2;
    }

    public static Comparator<MemberEntity> comparator() {
        return (a, b) -> {
            boolean leaderA = "LEADER".equals(a.getRole());
            boolean leaderB = "LEADER".equals(b.getRole());
            if (leaderA && !leaderB) {
                return -1;
            }
            if (!leaderA && leaderB) {
                return 1;
            }
            if (leaderA) {
                return compareSortOrderAndName(a, b);
            }

            int partCmp = Integer.compare(partOrder(a.getTeam()), partOrder(b.getTeam()));
            if (partCmp != 0) {
                return partCmp;
            }

            return compareSortOrderAndName(a, b);
        };
    }

    private static int compareSortOrderAndName(MemberEntity a, MemberEntity b) {
        int sortCmp = Integer.compare(
                a.getSortOrder() != null ? a.getSortOrder() : 9999,
                b.getSortOrder() != null ? b.getSortOrder() : 9999
        );
        if (sortCmp != 0) {
            return sortCmp;
        }
        String nameA = a.getName() != null ? a.getName() : "";
        String nameB = b.getName() != null ? b.getName() : "";
        return nameA.compareTo(nameB);
    }
}
