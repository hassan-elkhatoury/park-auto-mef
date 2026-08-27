package com.mef.parkauto.repository;
import com.mef.parkauto.entity.VisiteTechnique;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface VisiteTechniqueRepository extends JpaRepository<VisiteTechnique, Long> {
    List<VisiteTechnique> findByVehiculeIdOrderByDateVisiteDesc(Long vehiculeId);
    List<VisiteTechnique> findAllByOrderByDateVisiteDesc();
    List<VisiteTechnique> findByDateProchaineBeforeAndDateProchaineIsNotNull(LocalDate date);
}
