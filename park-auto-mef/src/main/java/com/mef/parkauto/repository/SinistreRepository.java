package com.mef.parkauto.repository;
import com.mef.parkauto.entity.Sinistre;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SinistreRepository extends JpaRepository<Sinistre, Long> {
    List<Sinistre> findByVehiculeIdOrderByDateAccidentDesc(Long vehiculeId);
    List<Sinistre> findAllByOrderByDateAccidentDesc();
}
