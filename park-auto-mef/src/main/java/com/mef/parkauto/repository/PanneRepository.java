package com.mef.parkauto.repository;

import com.mef.parkauto.entity.PanneVehicule;
import com.mef.parkauto.entity.StatutPanne;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PanneRepository extends JpaRepository<PanneVehicule, Long> {
    List<PanneVehicule> findAllByOrderByDateDeclarationDesc();
    List<PanneVehicule> findByVehiculeIdOrderByDateDeclarationDesc(Long vehiculeId);
    List<PanneVehicule> findByConducteurIdOrderByDateDeclarationDesc(Long conducteurId);
    List<PanneVehicule> findByStatutOrderByDateDeclarationDesc(StatutPanne statut);
    long countByStatut(StatutPanne statut);
}
