package com.mef.parkauto.repository;
import com.mef.parkauto.entity.PrevisionCarburant;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PrevisionCarburantRepository extends JpaRepository<PrevisionCarburant, Long> {
    List<PrevisionCarburant> findByAnneeOrderByMoisAscDirectionAsc(Integer annee);
    List<PrevisionCarburant> findByDirectionAndAnneeOrderByMoisAsc(String direction, Integer annee);
    List<PrevisionCarburant> findByVehiculeIdOrderByAnneeDescMoisDesc(Long vehiculeId);
}
