package com.bridgetec.dev6report.repo;

import com.bridgetec.dev6report.entity.MemberEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MemberRepository extends JpaRepository<MemberEntity, Long> {

    List<MemberEntity> findByActiveTrue();

    List<MemberEntity> findAll();
}
