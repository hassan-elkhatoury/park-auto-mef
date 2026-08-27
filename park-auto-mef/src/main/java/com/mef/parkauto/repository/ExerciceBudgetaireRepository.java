package com.mef.parkauto.repository;

import com.mef.parkauto.entity.ExerciceBudgetaire;
import com.mef.parkauto.entity.StatutExercice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExerciceBudgetaireRepository extends JpaRepository<ExerciceBudgetaire, Long> {
    Optional<ExerciceBudgetaire> findByAnnee(Integer annee);
    List<ExerciceBudgetaire> findAllByOrderByAnneeDesc();
    boolean existsByAnnee(Integer annee);
    List<ExerciceBudgetaire> findByStatut(StatutExercice statut);
}
