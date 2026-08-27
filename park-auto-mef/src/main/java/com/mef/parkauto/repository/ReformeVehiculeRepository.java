package com.mef.parkauto.repository;
import com.mef.parkauto.entity.ReformeVehicule;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReformeVehiculeRepository extends JpaRepository<ReformeVehicule, Long> {
    List<ReformeVehicule> findByVehiculeIdOrderByDateCreationDesc(Long vehiculeId);
    List<ReformeVehicule> findAllByOrderByDateCreationDesc();
}
