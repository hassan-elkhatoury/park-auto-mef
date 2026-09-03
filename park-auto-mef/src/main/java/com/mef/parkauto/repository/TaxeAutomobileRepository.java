package com.mef.parkauto.repository;
import com.mef.parkauto.entity.StatutTaxe;
import com.mef.parkauto.entity.TaxeAutomobile;
import com.mef.parkauto.entity.TypeTaxe;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface TaxeAutomobileRepository extends JpaRepository<TaxeAutomobile, Long> {
    List<TaxeAutomobile> findByVehiculeIdOrderByAnneeDesc(Long vehiculeId);
    List<TaxeAutomobile> findByAnneeOrderByVehiculeImmatriculationAsc(Integer annee);
    boolean existsByVehiculeIdAndAnneeAndType(Long vehiculeId, Integer annee, TypeTaxe type);
    List<TaxeAutomobile> findByStatutAndDateEcheanceBefore(StatutTaxe statut, LocalDate date);
    List<TaxeAutomobile> findByStatutIn(List<StatutTaxe> statuts);
}
