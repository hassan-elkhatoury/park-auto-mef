package com.mef.parkauto.repository;
import com.mef.parkauto.entity.Infraction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InfractionRepository extends JpaRepository<Infraction, Long> {
    List<Infraction> findByVehiculeIdOrderByDateInfractionDesc(Long vehiculeId);
    List<Infraction> findAllByOrderByDateInfractionDesc();
}
