package com.mef.parkauto.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

/**
 * Entité représentant un utilisateur du système.
 * Implémente UserDetails pour l'intégration avec Spring Security.
 * <p>
 * Les champs direction, service et region sont prévus pour le
 * contrôle d'accès par structure organisationnelle (sprints futurs).
 */
@Entity
@Table(name = "utilisateurs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Utilisateur extends BaseEntity implements UserDetails {

    @Column(unique = true, nullable = false, length = 50)
    private String matricule;

    @Column(nullable = false, length = 100)
    private String nom;

    @Column(nullable = false, length = 100)
    private String prenom;

    @Column(unique = true, nullable = false, length = 150)
    private String email;

    @Column(nullable = false)
    private String motDePasse;

    @Column(nullable = false, length = 64)
    private String sel;

    @Column(nullable = false)
    private boolean doitChangerMotDePasse = true;

    @Column(length = 20)
    private String telephone;

    // --- Champs prévus pour l'autorisation par structure (sprints futurs) ---

    @Column(length = 100)
    private String direction;

    @Column(length = 100)
    private String service;

    @Column(length = 100)
    private String region;

    // --- Statut du compte ---

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserStatus statut = UserStatus.ACTIVE;

    // --- Relations ---

    @ManyToOne(fetch = jakarta.persistence.FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    // ========================================================================
    // UserDetails implementation
    // ========================================================================

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role.getNom().name()));
    }

    @Override
    public String getPassword() {
        return motDePasse;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return statut != UserStatus.ARCHIVED;
    }

    @Override
    public boolean isAccountNonLocked() {
        return statut != UserStatus.LOCKED;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return statut == UserStatus.ACTIVE;
    }
}
