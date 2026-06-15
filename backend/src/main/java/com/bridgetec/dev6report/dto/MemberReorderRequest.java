package com.bridgetec.dev6report.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record MemberReorderRequest(
        @NotEmpty List<Long> memberIds
) {
}
