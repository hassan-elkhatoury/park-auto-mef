package com.mef.parkauto.repository;

import com.mef.parkauto.entity.GarageAgree;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GarageAgreeRepository extends JpaRepository<GarageAgree, Long> {
    List<GarageAgree> findByActifTrueOrderByNomGarageAsc();
    List<GarageAgree> findByVilleIgnoreCase(String ville);
    List<GarageAgree> findByAgreeMEFTrue();
}
