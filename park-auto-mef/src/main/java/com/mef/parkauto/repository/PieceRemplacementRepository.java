package com.mef.parkauto.repository;

import com.mef.parkauto.entity.PieceRemplacement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PieceRemplacementRepository extends JpaRepository<PieceRemplacement, Long> {
    List<PieceRemplacement> findByInterventionId(Long interventionId);
    List<PieceRemplacement> findByPanneId(Long panneId);
    List<PieceRemplacement> findByGarageId(Long garageId);
}
