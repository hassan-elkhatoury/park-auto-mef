package com.mef.parkauto.repository;

import com.mef.parkauto.entity.PleinCarburant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PleinCarburantRepository extends JpaRepository<PleinCarburant, Long> {
    
    List<PleinCarburant> findAllByOrderByDatePleinDesc();
    
    List<PleinCarburant> findByVehiculeIdOrderByDatePleinDesc(Long vehiculeId);

    @Query("SELECT p FROM PleinCarburant p WHERE p.vehicule.id = :vehiculeId ORDER BY p.datePlein DESC")
    List<PleinCarburant> findLatestByVehiculeId(@Param("vehiculeId") Long vehiculeId);

    @Query("SELECT p FROM PleinCarburant p WHERE p.anomalieSurconsommation = true ORDER BY p.datePlein DESC")
    List<PleinCarburant> findAnomaliesOrderByDatePleinDesc();

    @Query("SELECT COALESCE(SUM(p.montantTTC), 0) FROM PleinCarburant p WHERE p.vehicule.id = :vehiculeId")
    BigDecimal sumMontantByVehiculeId(@Param("vehiculeId") Long vehiculeId);

    @Query("SELECT COALESCE(SUM(p.montantTTC), 0) FROM PleinCarburant p WHERE p.vehicule.direction = :direction")
    BigDecimal sumMontantByDirection(@Param("direction") String direction);

    @Query("SELECT COALESCE(SUM(p.montantTTC), 0) FROM PleinCarburant p WHERE p.datePlein >= :start AND p.datePlein <= :end")
    BigDecimal sumMontantBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COALESCE(SUM(p.quantiteLitres), 0) FROM PleinCarburant p")
    Double sumTotalLitres();
}
