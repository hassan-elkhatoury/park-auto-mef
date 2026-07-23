package com.mef.parkauto.service;

import com.mef.parkauto.dto.vehicule.HistoriqueStatutResponse;
import com.mef.parkauto.dto.vehicule.StatutChangeRequest;
import com.mef.parkauto.dto.vehicule.VehiculeRequest;
import com.mef.parkauto.dto.vehicule.VehiculeResponse;
import com.mef.parkauto.entity.StatutAdministratif;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * Service pour la gestion CRUD des véhicules, de leurs statuts et de l'historique.
 */
public interface VehiculeService {

    Page<VehiculeResponse> findAll(String search, String direction, StatutAdministratif statut, Pageable pageable);

    VehiculeResponse findById(Long id);

    VehiculeResponse create(VehiculeRequest request);

    VehiculeResponse update(Long id, VehiculeRequest request);

    void archive(Long id);

    VehiculeResponse changeStatus(Long id, StatutChangeRequest request);

    List<HistoriqueStatutResponse> getHistory(Long vehiculeId);
}
