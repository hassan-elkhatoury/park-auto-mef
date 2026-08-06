package com.mef.parkauto.repository;

import com.mef.parkauto.entity.CarteCarburant;
import com.mef.parkauto.entity.CarteCarburantStatut;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CarteCarburantRepository extends JpaRepository<CarteCarburant, Long> {
    Optional<CarteCarburant> findByNumeroCarte(String numeroCarte);
    boolean existsByNumeroCarte(String numeroCarte);
    boolean existsByNumeroCarteAndIdNot(String numeroCarte, Long id);
    List<CarteCarburant> findByStatut(CarteCarburantStatut statut);
    List<CarteCarburant> findByVehiculeId(Long vehiculeId);
}
