package com.bridgetec.dev6report.repo;

import com.bridgetec.dev6report.entity.ProjectEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProjectRepository extends JpaRepository<ProjectEntity, Long> {

    List<ProjectEntity> findByActiveTrueOrderBySortOrderAscNameAsc();

    List<ProjectEntity> findAllByOrderBySortOrderAscNameAsc();

    @Query("""
            SELECT p FROM ProjectEntity p
            JOIN MemberProjectEntity mp ON mp.projectId = p.id
            WHERE mp.memberId = :memberId AND p.active = true
            ORDER BY p.sortOrder ASC, p.name ASC
            """)
    List<ProjectEntity> findByMemberId(@Param("memberId") Long memberId);

    @Query("""
            SELECT p FROM ProjectEntity p
            WHERE p.active = true
              AND p.productLine IN :lines
            ORDER BY p.sortOrder ASC, p.name ASC
            """)
    List<ProjectEntity> findByProductLineInAndActiveTrueOrderBySortOrderAscNameAsc(@Param("lines") List<String> lines);

    @Query("""
            SELECT p FROM ProjectEntity p
            WHERE (:includeInactive = true OR p.active = true)
              AND (:productLine IS NULL OR p.productLine = :productLine)
              AND (:workType IS NULL OR p.workType = :workType)
              AND (:mapping IS NULL OR :mapping = '' OR :mapping = 'all'
                   OR (:mapping = 'mapped' AND p.productLine IS NOT NULL)
                   OR (:mapping = 'unmapped' AND p.productLine IS NULL))
              AND (:q IS NULL OR :q = ''
                   OR LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(p.projectCode) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(COALESCE(p.customer, '')) LIKE LOWER(CONCAT('%', :q, '%'))
                   OR LOWER(COALESCE(p.solution, '')) LIKE LOWER(CONCAT('%', :q, '%')))
            ORDER BY CASE WHEN p.productLine IS NULL THEN 1 ELSE 0 END,
                     p.sortOrder ASC, p.projectCode ASC, p.productLine ASC, p.name ASC
            """)
    List<ProjectEntity> search(
            @Param("q") String q,
            @Param("productLine") String productLine,
            @Param("workType") String workType,
            @Param("mapping") String mapping,
            @Param("includeInactive") boolean includeInactive
    );

    @Query("""
            SELECT COUNT(p) > 0 FROM ProjectEntity p
            WHERE p.active = true
              AND p.projectCode = :projectCode
              AND ((:productLine IS NULL AND p.productLine IS NULL) OR p.productLine = :productLine)
              AND (:excludeId IS NULL OR p.id <> :excludeId)
            """)
    boolean existsActiveByCodeAndProductLine(
            @Param("projectCode") String projectCode,
            @Param("productLine") String productLine,
            @Param("excludeId") Long excludeId
    );
}
