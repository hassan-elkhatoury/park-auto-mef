package com.mef.parkauto.repository;

import com.mef.parkauto.entity.InterventionMaintenance;
import com.mef.parkauto.entity.StatutMaintenance;
import com.mef.parkauto.entity.TypeMaintenance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface InterventionMaintenanceRepository extends JpaRepository<InterventionMaintenance, Long> {

    List<InterventionMaintenance> findAllByOrderByDatePrevisionnelleDesc();

    List<InterventionMaintenance> findByVehiculeIdOrderByDatePrevisionnelleDesc(Long vehiculeId);

    List<InterventionMaintenance> findByStatutOrderByDatePrevisionnelleDesc(StatutMaintenance statut);

    List<InterventionMaintenance> findByTypeMaintenanceOrderByDatePrevisionnelleDesc(TypeMaintenance typeMaintenance);

    @Query("SELECT COALESCE(SUM(i.montantTotal), 0) FROM InterventionMaintenance i WHERE i.vehicule.id = :vehiculeId")
    BigDecimal sumMontantByVehiculeId(@Param("vehiculeId") Long vehiculeId);

    @Query("SELECT COALESCE(SUM(i.montantTotal), 0) FROM InterventionMaintenance i WHERE i.vehicule.direction = :direction")
    BigDecimal sumMontantByDirection(@Param("direction") String direction);

    @Query("SELECT COALESCE(SUM(i.montantTotal), 0) FROM InterventionMaintenance i WHERE (i.dateRealisation BETWEEN :start AND :end) OR (i.datePrevisionnelle BETWEEN :start AND :end)")
    BigDecimal sumMontantBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);
}
