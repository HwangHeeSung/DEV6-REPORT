package com.bridgetec.dev6report.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record ProjectRequest(
        @NotBlank String name,
        String projectCode,
        String productLine,
        String workType,
        String customer,
        String solution,
        Boolean active,
        Integer sortOrder,
        List<Long> memberIds
) {
}
