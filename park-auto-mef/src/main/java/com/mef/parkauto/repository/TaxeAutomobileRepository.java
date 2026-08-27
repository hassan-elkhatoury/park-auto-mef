package com.mef.parkauto.repository;
import com.mef.parkauto.entity.TaxeAutomobile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaxeAutomobileRepository extends JpaRepository<TaxeAutomobile, Long> {
    List<TaxeAutomobile> findByVehiculeIdOrderByAnneeDesc(Long vehiculeId);
    List<TaxeAutomobile> findByAnneeOrderByVehiculeImmatriculationAsc(Integer annee);
}
