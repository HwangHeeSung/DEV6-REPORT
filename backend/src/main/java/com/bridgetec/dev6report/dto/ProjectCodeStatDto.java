package com.bridgetec.dev6report.dto;

import java.util.List;

public record ProjectCodeStatDto(
        String projectCode,
        String projectName,
        String workType,
        String productLine,
        int entryCount,
        int memberCount,
        List<String> memberNames
) {
}
