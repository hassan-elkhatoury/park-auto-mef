package com.mef.parkauto.repository;

import com.mef.parkauto.entity.EngagementBudgetaire;
import com.mef.parkauto.entity.NatureDepense;
import com.mef.parkauto.entity.StatutEngagement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface EngagementBudgetaireRepository extends JpaRepository<EngagementBudgetaire, Long> {
    Optional<EngagementBudgetaire> findByNumeroEngagement(String numeroEngagement);
    List<EngagementBudgetaire> findByAnneeOrderByDateEngagementDesc(Integer annee);
    List<EngagementBudgetaire> findByAnneeAndDirectionOrderByDateEngagementDesc(Integer annee, String direction);
    List<EngagementBudgetaire> findByDirectionOrderByDateEngagementDesc(String direction);
    List<EngagementBudgetaire> findByStatutEngagement(StatutEngagement statut);
    
    @Query("SELECT COALESCE(SUM(e.montantEngage), 0) FROM EngagementBudgetaire e WHERE e.annee = :annee AND e.direction = :direction AND e.natureDepense = :natureDepense AND e.statutEngagement = 'ENGAGE'")
    BigDecimal sumMontantEngageActif(@Param("annee") Integer annee, @Param("direction") String direction, @Param("natureDepense") NatureDepense natureDepense);

    @Query("SELECT COALESCE(SUM(e.montantLiquide), 0) FROM EngagementBudgetaire e WHERE e.annee = :annee AND e.direction = :direction AND e.natureDepense = :natureDepense AND e.statutEngagement = 'LIQUIDE'")
    BigDecimal sumMontantLiquide(@Param("annee") Integer annee, @Param("direction") String direction, @Param("natureDepense") NatureDepense natureDepense);
}
