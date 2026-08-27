package com.mef.parkauto.repository;
import com.mef.parkauto.entity.DocumentGED;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DocumentGEDRepository extends JpaRepository<DocumentGED, Long> {
    List<DocumentGED> findByEntiteAndEntiteIdOrderByDateUploadDesc(String entite, Long entiteId);
}
