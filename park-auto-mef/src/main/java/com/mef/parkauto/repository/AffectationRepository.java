package com.mef.parkauto.repository;

import com.mef.parkauto.entity.Affectation;
import com.mef.parkauto.entity.StatutAffectation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AffectationRepository extends JpaRepository<Affectation, Long> {

    Optional<Affectation> findByReference(String reference);

    Optional<Affectation> findByDemandeDeplacementId(Long demandeId);

    List<Affectation> findByVehiculeIdOrderByDateCreationDesc(Long vehiculeId);

    List<Affectation> findByConducteurIdOrderByDateCreationDesc(Long conducteurId);

    List<Affectation> findByStatutOrderByDateCreationDesc(StatutAffectation statut);

    @Query("SELECT a FROM Affectation a ORDER BY a.dateCreation DESC")
    List<Affectation> findAllCustom();

    @Query("SELECT COUNT(a) FROM Affectation a WHERE a.statut = 'EN_COURS'")
    long countActiveAffectations();
}
