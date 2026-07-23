package com.mef.parkauto.repository;

import com.mef.parkauto.entity.Role;
import com.mef.parkauto.entity.RoleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByNom(RoleType nom);
}
