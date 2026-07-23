package com.mef.parkauto.repository;

import com.mef.parkauto.entity.HistoriqueStatutVehicule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistoriqueStatutRepository extends JpaRepository<HistoriqueStatutVehicule, Long> {

    List<HistoriqueStatutVehicule> findByVehiculeIdOrderByDateChangementDesc(Long vehiculeId);
}
