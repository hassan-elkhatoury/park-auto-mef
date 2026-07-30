package com.mef.parkauto.repository;

import com.mef.parkauto.entity.Conducteur;
import com.mef.parkauto.entity.StatutConducteur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ConducteurRepository extends JpaRepository<Conducteur, Long> {

    Optional<Conducteur> findByMatricule(String matricule);

    Optional<Conducteur> findByCin(String cin);

    Optional<Conducteur> findByNumeroPermis(String numeroPermis);

    List<Conducteur> findByStatut(StatutConducteur statut);

    @Query("SELECT c FROM Conducteur c WHERE c.statut = 'ACTIF' AND c.dateExpirationPermis > :dateCourante")
    List<Conducteur> findConducteursHabilitesDisponibles(@Param("dateCourante") LocalDate dateCourante);

    @Query("SELECT c FROM Conducteur c WHERE c.dateExpirationPermis <= :dateThreshold")
    List<Conducteur> findPermisExpirantProchainement(@Param("dateThreshold") LocalDate dateThreshold);

    @Query("SELECT c FROM Conducteur c WHERE " +
           "(:query IS NULL OR " +
           "LOWER(c.nom) LIKE :query OR " +
           "LOWER(c.prenom) LIKE :query OR " +
           "LOWER(c.matricule) LIKE :query OR " +
           "LOWER(c.cin) LIKE :query OR " +
           "LOWER(c.numeroPermis) LIKE :query)")
    List<Conducteur> searchConducteurs(@Param("query") String query);
}
