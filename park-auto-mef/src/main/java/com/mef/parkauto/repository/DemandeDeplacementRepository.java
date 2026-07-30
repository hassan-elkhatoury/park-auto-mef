package com.mef.parkauto.repository;

import com.mef.parkauto.entity.DemandeDeplacement;
import com.mef.parkauto.entity.StatutDemande;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DemandeDeplacementRepository extends JpaRepository<DemandeDeplacement, Long> {

    Optional<DemandeDeplacement> findByReference(String reference);

    List<DemandeDeplacement> findByDemandeurIdOrderByDateCreationDesc(Long demandeurId);

    List<DemandeDeplacement> findByStatutOrderByDateCreationDesc(StatutDemande statut);

    @Query("SELECT d FROM DemandeDeplacement d ORDER BY d.dateCreation DESC")
    List<DemandeDeplacement> findAllCustom();

    @Query("SELECT d FROM DemandeDeplacement d WHERE d.demandeur.direction = :direction ORDER BY d.dateCreation DESC")
    List<DemandeDeplacement> findByDirection(@Param("direction") String direction);

    @Query("SELECT COUNT(d) FROM DemandeDeplacement d WHERE d.statut = :statut")
    long countByStatut(@Param("statut") StatutDemande statut);
}
