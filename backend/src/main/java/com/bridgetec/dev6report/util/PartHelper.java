package com.bridgetec.dev6report.util;

import java.util.List;

public final class PartHelper {

    private PartHelper() {
    }

    /** 파트에서 선택 가능한 솔루션 전체 */
    public static List<String> productLinesForTeam(String team) {
        return ProductLineHelper.optionsForTeam(team);
    }

    public static String partLabel(String team) {
        if (team == null) return "-";
        if (team.contains("1파트")) {
            return "1파트 (SWAT / IPRON CTI)";
        }
        if (team.contains("2파트")) {
            return "2파트 (ARGO / RSM)";
        }
        return team;
    }
}
