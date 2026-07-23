package com.mef.parkauto.repository;

import com.mef.parkauto.entity.JournalAction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JournalActionRepository extends JpaRepository<JournalAction, Long> {

    Page<JournalAction> findByModule(String module, Pageable pageable);

    Page<JournalAction> findByUsername(String username, Pageable pageable);
}
