package com.bridgetec.dev6report.repo;

import com.bridgetec.dev6report.entity.MemberProjectEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MemberProjectRepository extends JpaRepository<MemberProjectEntity, MemberProjectEntity.Pk> {

    List<MemberProjectEntity> findByMemberId(Long memberId);

    @Modifying
    @Query("DELETE FROM MemberProjectEntity mp WHERE mp.memberId = :memberId")
    void deleteByMemberId(@Param("memberId") Long memberId);

    List<MemberProjectEntity> findByProjectId(Long projectId);

    @Modifying
    @Query("DELETE FROM MemberProjectEntity mp WHERE mp.projectId = :projectId")
    void deleteByProjectId(@Param("projectId") Long projectId);
}
