package com.mef.parkauto.repository;
import com.mef.parkauto.entity.BudgetDirection;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BudgetDirectionRepository extends JpaRepository<BudgetDirection, Long> {
    List<BudgetDirection> findByAnneeOrderByDirectionAscNatureDepenseAsc(Integer annee);
    List<BudgetDirection> findByAnneeAndDirectionOrderByNatureDepenseAsc(Integer annee, String direction);
}
