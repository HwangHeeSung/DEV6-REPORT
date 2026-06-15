package com.bridgetec.dev6report.web;

import com.bridgetec.dev6report.dto.MemberDto;
import com.bridgetec.dev6report.dto.MemberReorderRequest;
import com.bridgetec.dev6report.dto.MemberRequest;
import com.bridgetec.dev6report.service.MemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    @GetMapping("/members")
    public List<MemberDto> list(@RequestParam(defaultValue = "false") boolean includeInactive) {
        return memberService.list(includeInactive);
    }

    @PostMapping("/members")
    public MemberDto create(@Valid @RequestBody MemberRequest request) {
        return memberService.create(request);
    }

    @PutMapping("/members/reorder")
    public void reorder(@Valid @RequestBody MemberReorderRequest request) {
        memberService.reorder(request.memberIds());
    }

    @PutMapping("/members/{id}")
    public MemberDto update(@PathVariable Long id, @Valid @RequestBody MemberRequest request) {
        return memberService.update(id, request);
    }

    @DeleteMapping("/members/{id}")
    public void delete(@PathVariable Long id) {
        memberService.delete(id);
    }
}
