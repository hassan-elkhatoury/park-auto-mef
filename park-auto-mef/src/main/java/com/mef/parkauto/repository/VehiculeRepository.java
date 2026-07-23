package com.mef.parkauto.repository;

import com.mef.parkauto.entity.EtatTechnique;
import com.mef.parkauto.entity.StatutAdministratif;
import com.mef.parkauto.entity.Vehicule;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VehiculeRepository extends JpaRepository<Vehicule, Long> {

    Optional<Vehicule> findByImmatriculation(String immatriculation);

    Optional<Vehicule> findByNumeroChassis(String numeroChassis);

    Optional<Vehicule> findByNumeroInventaire(String numeroInventaire);

    boolean existsByImmatriculation(String immatriculation);

    boolean existsByNumeroChassis(String numeroChassis);

    boolean existsByNumeroInventaire(String numeroInventaire);

    Page<Vehicule> findByStatutAdministratif(StatutAdministratif statutAdministratif, Pageable pageable);

    Page<Vehicule> findByEtatTechnique(EtatTechnique etatTechnique, Pageable pageable);

    @Query("SELECT v FROM Vehicule v WHERE " +
           "(:search IS NULL OR LOWER(v.immatriculation) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(v.numeroInventaire) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(v.marque) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(v.modele) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:direction IS NULL OR v.direction = :direction) " +
           "AND (:statut IS NULL OR v.statutAdministratif = :statut)")
    Page<Vehicule> searchVehicules(
            @Param("search") String search,
            @Param("direction") String direction,
            @Param("statut") StatutAdministratif statut,
            Pageable pageable
    );
}
