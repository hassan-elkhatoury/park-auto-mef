package com.mef.parkauto.repository;
import com.mef.parkauto.entity.Assurance;
import com.mef.parkauto.entity.StatutAssurance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface AssuranceRepository extends JpaRepository<Assurance, Long> {
    List<Assurance> findByVehiculeIdOrderByDateFinDesc(Long vehiculeId);
    List<Assurance> findByStatut(StatutAssurance statut);
    @Query("SELECT a FROM Assurance a WHERE a.dateFin BETWEEN :debut AND :fin AND a.statut = 'ACTIVE' ORDER BY a.dateFin ASC")
    List<Assurance> findExpirantEntre(@Param("debut") LocalDate debut, @Param("fin") LocalDate fin);
    @Query("SELECT a FROM Assurance a WHERE a.vehicule.id = :vehiculeId AND a.statut = 'ACTIVE' AND a.dateFin >= :today ORDER BY a.dateFin DESC")
    List<Assurance> findAssurancesActivesParVehicule(@Param("vehiculeId") Long vehiculeId, @Param("today") LocalDate today);
}
