package com.mef.parkauto.repository;
import com.mef.parkauto.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findAllByOrderByDateActionDesc(Pageable pageable);
    List<AuditLog> findByEntiteAndEntiteIdOrderByDateActionDesc(String entite, Long entiteId);
    List<AuditLog> findByUtilisateurIdOrderByDateActionDesc(Long utilisateurId);
}
