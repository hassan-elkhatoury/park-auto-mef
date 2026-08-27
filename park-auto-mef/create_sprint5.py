import os

base_dir = r"c:\Users\Hassan\Desktop\park auto MEF\park-auto-mef\src\main\java\com\mef\parkauto"
resources_dir = r"c:\Users\Hassan\Desktop\park auto MEF\park-auto-mef\src\main\resources"

files = {
    "entity/StatutAdministratif.java": '''package com.mef.parkauto.entity;
public enum StatutAdministratif {
    DISPONIBLE, AFFECTE, RESERVE, IMMOBILISE,
    EN_ENTRETIEN, EN_REPARATION, EN_MAINTENANCE,
    ACCIDENTE, EN_COURS_REFORME, EN_COURS_DE_REFORME,
    REFORME, VENDU, RESTITUE, ARCHIVE, TRANSFERE
}
''',
    "entity/CompagnieAssurance.java": '''package com.mef.parkauto.entity;
public enum CompagnieAssurance {
    AXA, RMA, WAFA, SAHAM, ATLANTA, AUTRE
}
''',
    "entity/TypeGarantie.java": '''package com.mef.parkauto.entity;
public enum TypeGarantie {
    TOUS_RISQUES, TIERS, VOL, INCENDIE
}
''',
    "entity/StatutAssurance.java": '''package com.mef.parkauto.entity;
public enum StatutAssurance {
    ACTIVE, EXPIREE, SUSPENDUE
}
''',
    "entity/NatureAccident.java": '''package com.mef.parkauto.entity;
public enum NatureAccident {
    COLLISION, INCENDIE, VOL, VANDALISME, AUTRE
}
''',
    "entity/StatutSinistre.java": '''package com.mef.parkauto.entity;
public enum StatutSinistre {
    DECLARE, EN_EXPERTISE, INDEMNISE, CLOS
}
''',
    "entity/StatutInfraction.java": '''package com.mef.parkauto.entity;
public enum StatutInfraction {
    EN_ATTENTE, PAYEE, CONTESTEE
}
''',
    "entity/ResultatVisite.java": '''package com.mef.parkauto.entity;
public enum ResultatVisite {
    FAVORABLE, CONTRE_VISITE_OBLIGATOIRE, REFUSEE
}
''',
    "entity/TypeTaxe.java": '''package com.mef.parkauto.entity;
public enum TypeTaxe {
    VIGNETTE, TAXE_CIRCULATION
}
''',
    "entity/StatutTaxe.java": '''package com.mef.parkauto.entity;
public enum StatutTaxe {
    PAYEE, EN_RETARD, EXONEREE
}
''',
    "entity/StatutReforme.java": '''package com.mef.parkauto.entity;
public enum StatutReforme {
    INITIE, EN_COURS_DE_REFORME, VALIDE, REFORME, VENDU
}
''',
    "entity/NatureDepense.java": '''package com.mef.parkauto.entity;
public enum NatureDepense {
    CARBURANT, ASSURANCE, ENTRETIEN, REPARATION, TAXES, VISITES
}
''',
    "entity/Assurance.java": '''package com.mef.parkauto.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity @Table(name="assurances")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Assurance extends BaseEntity {
    @ManyToOne(fetch=FetchType.LAZY, optional=false)
    @JoinColumn(name="vehicule_id", nullable=false)
    private Vehicule vehicule;
    
    @Column(unique=true, nullable=false, length=100)
    private String numeroPolice;
    
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=30)
    private CompagnieAssurance compagnie;
    
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=30)
    private TypeGarantie typeGarantie;
    
    @Column(nullable=false) private LocalDate dateDebut;
    @Column(nullable=false) private LocalDate dateFin;
    
    @Column(precision=12, scale=2) private BigDecimal montantPrime;
    @Column(precision=12, scale=2) private BigDecimal franchise;
    
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=20)
    private StatutAssurance statut = StatutAssurance.ACTIVE;
    
    @Column(length=500) private String documents;
    @Column(length=500) private String observations;
}
''',
    "entity/Sinistre.java": '''package com.mef.parkauto.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity @Table(name="sinistres")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Sinistre extends BaseEntity {
    @ManyToOne(fetch=FetchType.LAZY, optional=false)
    @JoinColumn(name="vehicule_id", nullable=false)
    private Vehicule vehicule;
    
    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="conducteur_id")
    private Conducteur conducteur;
    
    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="assurance_id")
    private Assurance assurance;
    
    @Column(nullable=false) private LocalDate dateAccident;
    @Column(length=200) private String lieuAccident;
    @Column(length=1000) private String description;
    @Column(length=500) private String tiersImpliques;
    
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=30)
    private NatureAccident natureAccident;
    
    @Column(precision=12, scale=2) private BigDecimal montantDommages;
    
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=30)
    private StatutSinistre statut = StatutSinistre.DECLARE;
    
    @Column(length=100) private String referenceExpertise;
}
''',
    "entity/Infraction.java": '''package com.mef.parkauto.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity @Table(name="infractions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Infraction extends BaseEntity {
    @ManyToOne(fetch=FetchType.LAZY, optional=false)
    @JoinColumn(name="vehicule_id", nullable=false)
    private Vehicule vehicule;
    
    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="conducteur_id")
    private Conducteur conducteur;
    
    @Column(nullable=false) private LocalDate dateInfraction;
    @Column(length=200) private String lieuInfraction;
    @Column(length=100) private String typeInfraction;
    @Column(precision=10, scale=2) private BigDecimal montantAmende;
    
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=30)
    private StatutInfraction statut = StatutInfraction.EN_ATTENTE;
    
    @Column(length=100) private String referenceContravention;
    @Column(length=500) private String observations;
}
''',
    "entity/VisiteTechnique.java": '''package com.mef.parkauto.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity @Table(name="visites_techniques")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class VisiteTechnique extends BaseEntity {
    @ManyToOne(fetch=FetchType.LAZY, optional=false)
    @JoinColumn(name="vehicule_id", nullable=false)
    private Vehicule vehicule;
    
    @Column(nullable=false) private LocalDate dateVisite;
    @Column(length=100) private String centre;
    
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=40)
    private ResultatVisite resultat;
    
    private LocalDate dateProchaine;
    @Column(length=500) private String pvVisite;
    @Column(length=500) private String observations;
}
''',
    "entity/TaxeAutomobile.java": '''package com.mef.parkauto.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity @Table(name="taxes_automobiles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class TaxeAutomobile extends BaseEntity {
    @ManyToOne(fetch=FetchType.LAZY, optional=false)
    @JoinColumn(name="vehicule_id", nullable=false)
    private Vehicule vehicule;
    
    @Column(nullable=false) private Integer annee;
    
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=30)
    private TypeTaxe type;
    
    @Column(precision=10, scale=2) private BigDecimal montant;
    
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=20)
    private StatutTaxe statut = StatutTaxe.EN_RETARD;
    
    private LocalDate dateEcheance;
    @Column(length=100) private String referencePaiement;
}
''',
    "entity/ReformeVehicule.java": '''package com.mef.parkauto.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity @Table(name="reformes_vehicules")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ReformeVehicule extends BaseEntity {
    @ManyToOne(fetch=FetchType.LAZY, optional=false)
    @JoinColumn(name="vehicule_id", nullable=false)
    private Vehicule vehicule;
    
    @Column(length=1000) private String motifReforme;
    private LocalDate dateDecision;
    
    // Obligatoire pour validation finale (RG04)
    @Column(length=500) private String pvCommission;
    
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=30)
    private StatutReforme statut = StatutReforme.INITIE;
    
    @Column(precision=12, scale=2) private BigDecimal prixCession;
}
''',
    "entity/BudgetDirection.java": '''package com.mef.parkauto.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity @Table(name="budgets_direction")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class BudgetDirection extends BaseEntity {
    @Column(nullable=false) private Integer annee;
    @Column(nullable=false, length=100) private String direction;
    
    @Enumerated(EnumType.STRING) @Column(nullable=false, length=30)
    private NatureDepense natureDepense;
    
    @Column(nullable=false, precision=14, scale=2)
    private BigDecimal montantAlloue = BigDecimal.ZERO;
    
    @Column(precision=14, scale=2)
    private BigDecimal montantEngage = BigDecimal.ZERO;
    
    @Column(precision=14, scale=2)
    private BigDecimal montantRealise = BigDecimal.ZERO;
    
    @Transient
    public BigDecimal getMontantRestant() {
        if (montantAlloue == null) return BigDecimal.ZERO;
        BigDecimal realise = montantRealise != null ? montantRealise : BigDecimal.ZERO;
        return montantAlloue.subtract(realise);
    }
}
''',
    "entity/PrevisionCarburant.java": '''package com.mef.parkauto.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity @Table(name="previsions_carburant")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class PrevisionCarburant extends BaseEntity {
    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="vehicule_id")
    private Vehicule vehicule;
    
    @Column(length=100) private String direction;
    
    @Column(nullable=false) private Integer mois;
    @Column(nullable=false) private Integer annee;
    
    private Double kmPrevus;
    private Double consoMoyenne; // L/100km
    
    // AMÉLIORATION: null-safe @Transient getter
    @Transient
    public Double getQuantitePrevueLitres() {
        if (kmPrevus == null || consoMoyenne == null) return 0.0;
        return kmPrevus * consoMoyenne / 100.0;
    }
    
    @Column(precision=10, scale=4) private BigDecimal prixUnitairePrevus;
    
    // AMÉLIORATION: null-safe @Transient getter
    @Transient
    public BigDecimal getMontantPrevu() {
        Double qte = getQuantitePrevueLitres();
        if (prixUnitairePrevus == null || qte == 0.0) return BigDecimal.ZERO;
        return prixUnitairePrevus.multiply(BigDecimal.valueOf(qte));
    }
    
    private Double quantiteReelle;
    @Column(precision=12, scale=2) private BigDecimal montantReel;
}
''',
    "entity/AuditLog.java": '''package com.mef.parkauto.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

// IMMUTABLE - pas de BaseEntity (pas de updatedBy/lastModified)
@Entity @Table(name="audit_logs")
@Getter @NoArgsConstructor @AllArgsConstructor
@Builder
public class AuditLog {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;
    
    private Long utilisateurId;
    @Column(nullable=false, length=100) private String action;
    @Column(nullable=false, length=100) private String entite;
    private Long entiteId;
    @Lob @Column(columnDefinition="TEXT") private String ancienneValeur;
    @Lob @Column(columnDefinition="TEXT") private String nouvelleValeur;
    @Column(nullable=false, updatable=false) private LocalDateTime dateAction;
    @Column(length=50) private String adresseIp;
    @Column(length=150) private String utilisateurNom;
    
    @PrePersist
    public void prePersist() {
        if (dateAction == null) dateAction = LocalDateTime.now();
    }
}
''',
    "entity/DocumentGED.java": '''package com.mef.parkauto.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name="documents_ged")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Builder
public class DocumentGED {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable=false, length=100) private String entite;
    @Column(nullable=false) private Long entiteId;
    @Column(length=100) private String typeDocument;
    @Column(nullable=false, length=255) private String nomFichier;
    @Column(nullable=false, length=500) private String cheminFichier;
    @Column(length=100) private String typeMime;
    private Long taille;
    @Column(length=150) private String uploadePar;
    
    @Column(nullable=false, updatable=false)
    private LocalDateTime dateUpload;
    
    @PrePersist
    public void prePersist() {
        if (dateUpload == null) dateUpload = LocalDateTime.now();
    }
}
''',
    "repository/AssuranceRepository.java": '''package com.mef.parkauto.repository;
import com.mef.parkauto.entity.Assurance;
import com.mef.parkauto.entity.StatutAssurance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface AssuranceRepository extends JpaRepository<Assurance, Long> {
    List<Assurance> findByVehiculeIdOrderByDateFinDesc(Long vehiculeId);
    List<Assurance> findByStatut(StatutAssurance statut);
    @Query("SELECT a FROM Assurance a WHERE a.dateFin BETWEEN :debut AND :fin AND a.statut = 'ACTIVE' ORDER BY a.dateFin ASC")
    List<Assurance> findExpirantEntre(@Param("debut") LocalDate debut, @Param("fin") LocalDate fin);
    @Query("SELECT a FROM Assurance a WHERE a.vehicule.id = :vehiculeId AND a.statut = 'ACTIVE' AND a.dateFin >= :today ORDER BY a.dateFin DESC")
    List<Assurance> findAssurancesActivesParVehicule(@Param("vehiculeId") Long vehiculeId, @Param("today") LocalDate today);
}
''',
    "repository/SinistreRepository.java": '''package com.mef.parkauto.repository;
import com.mef.parkauto.entity.Sinistre;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SinistreRepository extends JpaRepository<Sinistre, Long> {
    List<Sinistre> findByVehiculeIdOrderByDateAccidentDesc(Long vehiculeId);
    List<Sinistre> findAllByOrderByDateAccidentDesc();
}
''',
    "repository/InfractionRepository.java": '''package com.mef.parkauto.repository;
import com.mef.parkauto.entity.Infraction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InfractionRepository extends JpaRepository<Infraction, Long> {
    List<Infraction> findByVehiculeIdOrderByDateInfractionDesc(Long vehiculeId);
    List<Infraction> findAllByOrderByDateInfractionDesc();
}
''',
    "repository/VisiteTechniqueRepository.java": '''package com.mef.parkauto.repository;
import com.mef.parkauto.entity.VisiteTechnique;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface VisiteTechniqueRepository extends JpaRepository<VisiteTechnique, Long> {
    List<VisiteTechnique> findByVehiculeIdOrderByDateVisiteDesc(Long vehiculeId);
    List<VisiteTechnique> findAllByOrderByDateVisiteDesc();
    List<VisiteTechnique> findByDateProchaineBeforeAndDateProchaineIsNotNull(LocalDate date);
}
''',
    "repository/TaxeAutomobileRepository.java": '''package com.mef.parkauto.repository;
import com.mef.parkauto.entity.TaxeAutomobile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaxeAutomobileRepository extends JpaRepository<TaxeAutomobile, Long> {
    List<TaxeAutomobile> findByVehiculeIdOrderByAnneeDesc(Long vehiculeId);
    List<TaxeAutomobile> findByAnneeOrderByVehiculeImmatriculationAsc(Integer annee);
}
''',
    "repository/ReformeVehiculeRepository.java": '''package com.mef.parkauto.repository;
import com.mef.parkauto.entity.ReformeVehicule;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReformeVehiculeRepository extends JpaRepository<ReformeVehicule, Long> {
    List<ReformeVehicule> findByVehiculeIdOrderByDateCreationDesc(Long vehiculeId);
    List<ReformeVehicule> findAllByOrderByDateCreationDesc();
}
''',
    "repository/BudgetDirectionRepository.java": '''package com.mef.parkauto.repository;
import com.mef.parkauto.entity.BudgetDirection;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BudgetDirectionRepository extends JpaRepository<BudgetDirection, Long> {
    List<BudgetDirection> findByAnneeOrderByDirectionAscNatureDepenseAsc(Integer annee);
    List<BudgetDirection> findByAnneeAndDirectionOrderByNatureDepenseAsc(Integer annee, String direction);
}
''',
    "repository/PrevisionCarburantRepository.java": '''package com.mef.parkauto.repository;
import com.mef.parkauto.entity.PrevisionCarburant;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PrevisionCarburantRepository extends JpaRepository<PrevisionCarburant, Long> {
    List<PrevisionCarburant> findByAnneeOrderByMoisAscDirectionAsc(Integer annee);
    List<PrevisionCarburant> findByDirectionAndAnneeOrderByMoisAsc(String direction, Integer annee);
    List<PrevisionCarburant> findByVehiculeIdOrderByAnneeDescMoisDesc(Long vehiculeId);
}
''',
    "repository/AuditLogRepository.java": '''package com.mef.parkauto.repository;
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
''',
    "repository/DocumentGEDRepository.java": '''package com.mef.parkauto.repository;
import com.mef.parkauto.entity.DocumentGED;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DocumentGEDRepository extends JpaRepository<DocumentGED, Long> {
    List<DocumentGED> findByEntiteAndEntiteIdOrderByDateUploadDesc(String entite, Long entiteId);
}
''',
    "dto/AssuranceDto.java": '''package com.mef.parkauto.dto;
import com.mef.parkauto.entity.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AssuranceDto {
    private Long id;
    private Long vehiculeId;
    private String immatriculation;
    private String marqueModele;
    private String numeroPolice;
    private CompagnieAssurance compagnie;
    private TypeGarantie typeGarantie;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private BigDecimal montantPrime;
    private BigDecimal franchise;
    private StatutAssurance statut;
    private String documents;
    private String observations;
    private LocalDateTime dateCreation;
    private long joursRestants; // calculé
}
''',
    "dto/AssuranceRequest.java": '''package com.mef.parkauto.dto;
import com.mef.parkauto.entity.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor
public class AssuranceRequest {
    private Long id;
    private Long vehiculeId;
    private String numeroPolice;
    private CompagnieAssurance compagnie;
    private TypeGarantie typeGarantie;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private BigDecimal montantPrime;
    private BigDecimal franchise;
    private StatutAssurance statut;
    private String documents;
    private String observations;
}
''',
    "dto/SinistreDto.java": '''package com.mef.parkauto.dto;
import com.mef.parkauto.entity.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SinistreDto {
    private Long id;
    private Long vehiculeId;
    private String immatriculation;
    private String marqueModele;
    private Long conducteurId;
    private String conducteurNom;
    private Long assuranceId;
    private String numeroPolice;
    private LocalDate dateAccident;
    private String lieuAccident;
    private String description;
    private String tiersImpliques;
    private NatureAccident natureAccident;
    private BigDecimal montantDommages;
    private StatutSinistre statut;
    private String referenceExpertise;
    private LocalDateTime dateCreation;
}
''',
    "dto/SinistreRequest.java": '''package com.mef.parkauto.dto;
import com.mef.parkauto.entity.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor
public class SinistreRequest {
    private Long id;
    private Long vehiculeId;
    private Long conducteurId;
    private Long assuranceId;
    private LocalDate dateAccident;
    private String lieuAccident;
    private String description;
    private String tiersImpliques;
    private NatureAccident natureAccident;
    private BigDecimal montantDommages;
    private StatutSinistre statut;
    private String referenceExpertise;
}
''',
    "dto/InfractionDto.java": '''package com.mef.parkauto.dto;
import com.mef.parkauto.entity.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class InfractionDto {
    private Long id;
    private Long vehiculeId;
    private String immatriculation;
    private String marqueModele;
    private Long conducteurId;
    private String conducteurNom;
    private LocalDate dateInfraction;
    private String lieuInfraction;
    private String typeInfraction;
    private BigDecimal montantAmende;
    private StatutInfraction statut;
    private String referenceContravention;
    private String observations;
    private LocalDateTime dateCreation;
}
''',
    "dto/InfractionRequest.java": '''package com.mef.parkauto.dto;
import com.mef.parkauto.entity.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor
public class InfractionRequest {
    private Long id;
    private Long vehiculeId;
    private Long conducteurId;
    private LocalDate dateInfraction;
    private String lieuInfraction;
    private String typeInfraction;
    private BigDecimal montantAmende;
    private StatutInfraction statut;
    private String referenceContravention;
    private String observations;
}
''',
    "dto/VisiteTechniqueDto.java": '''package com.mef.parkauto.dto;
import com.mef.parkauto.entity.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class VisiteTechniqueDto {
    private Long id;
    private Long vehiculeId;
    private String immatriculation;
    private String marqueModele;
    private String direction;
    private LocalDate dateVisite;
    private String centre;
    private ResultatVisite resultat;
    private LocalDate dateProchaine;
    private String pvVisite;
    private String observations;
    private LocalDateTime dateCreation;
    private Long interventionCreeeId; // si RG03 déclenché
}
''',
    "dto/VisiteTechniqueRequest.java": '''package com.mef.parkauto.dto;
import com.mef.parkauto.entity.*;
import lombok.*;
import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor
public class VisiteTechniqueRequest {
    private Long id;
    private Long vehiculeId;
    private LocalDate dateVisite;
    private String centre;
    private ResultatVisite resultat;
    private LocalDate dateProchaine;
    private String pvVisite;
    private String observations;
}
''',
    "dto/TaxeAutomobileDto.java": '''package com.mef.parkauto.dto;
import com.mef.parkauto.entity.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class TaxeAutomobileDto {
    private Long id;
    private Long vehiculeId;
    private String immatriculation;
    private String marqueModele;
    private Integer annee;
    private TypeTaxe type;
    private BigDecimal montant;
    private StatutTaxe statut;
    private LocalDate dateEcheance;
    private String referencePaiement;
    private LocalDateTime dateCreation;
}
''',
    "dto/TaxeAutomobileRequest.java": '''package com.mef.parkauto.dto;
import com.mef.parkauto.entity.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor
public class TaxeAutomobileRequest {
    private Long id;
    private Long vehiculeId;
    private Integer annee;
    private TypeTaxe type;
    private BigDecimal montant;
    private StatutTaxe statut;
    private LocalDate dateEcheance;
    private String referencePaiement;
}
''',
    "dto/ReformeVehiculeDto.java": '''package com.mef.parkauto.dto;
import com.mef.parkauto.entity.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ReformeVehiculeDto {
    private Long id;
    private Long vehiculeId;
    private String immatriculation;
    private String marqueModele;
    private String direction;
    private String motifReforme;
    private LocalDate dateDecision;
    private String pvCommission;
    private StatutReforme statut;
    private BigDecimal prixCession;
    private LocalDateTime dateCreation;
}
''',
    "dto/ReformeVehiculeRequest.java": '''package com.mef.parkauto.dto;
import com.mef.parkauto.entity.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor
public class ReformeVehiculeRequest {
    private Long id;
    private Long vehiculeId;
    private String motifReforme;
    private LocalDate dateDecision;
    private String pvCommission;
    private StatutReforme statut;
    private BigDecimal prixCession;
}
''',
    "dto/BudgetDirectionDto.java": '''package com.mef.parkauto.dto;
import com.mef.parkauto.entity.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class BudgetDirectionDto {
    private Long id;
    private Integer annee;
    private String direction;
    private NatureDepense natureDepense;
    private BigDecimal montantAlloue;
    private BigDecimal montantEngage;
    private BigDecimal montantRealise;
    private BigDecimal montantRestant;
    private Double tauxConsommation; // montantRealise/montantAlloue * 100
    private LocalDateTime dateCreation;
}
''',
    "dto/BudgetDirectionRequest.java": '''package com.mef.parkauto.dto;
import com.mef.parkauto.entity.*;
import lombok.*;
import java.math.BigDecimal;

@Data @NoArgsConstructor @AllArgsConstructor
public class BudgetDirectionRequest {
    private Long id;
    private Integer annee;
    private String direction;
    private NatureDepense natureDepense;
    private BigDecimal montantAlloue;
    private BigDecimal montantEngage;
    private BigDecimal montantRealise;
}
''',
    "dto/BudgetSyntheseDto.java": '''package com.mef.parkauto.dto;
import com.mef.parkauto.entity.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class BudgetSyntheseDto {
    private Integer annee;
    private BigDecimal totalAlloue;
    private BigDecimal totalRealise;
    private BigDecimal totalRestant;
    private Double tauxConsommationGlobal;
    private List<BudgetDirectionDto> lignes;
}
''',
    "dto/PrevisionCarburantDto.java": '''package com.mef.parkauto.dto;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PrevisionCarburantDto {
    private Long id;
    private Long vehiculeId;
    private String immatriculation;
    private String direction;
    private Integer mois;
    private Integer annee;
    private Double kmPrevus;
    private Double consoMoyenne;
    private Double quantitePrevueLitres;
    private BigDecimal prixUnitairePrevus;
    private BigDecimal montantPrevu;
    private Double quantiteReelle;
    private BigDecimal montantReel;
    private Double ecartQuantite; // quantiteReelle - quantitePrevueLitres
    private LocalDateTime dateCreation;
}
''',
    "dto/PrevisionCarburantRequest.java": '''package com.mef.parkauto.dto;
import lombok.*;
import java.math.BigDecimal;

@Data @NoArgsConstructor @AllArgsConstructor
public class PrevisionCarburantRequest {
    private Long id;
    private Long vehiculeId;
    private String direction;
    private Integer mois;
    private Integer annee;
    private Double kmPrevus;
    private Double consoMoyenne;
    private BigDecimal prixUnitairePrevus;
    private Double quantiteReelle;
    private BigDecimal montantReel;
}
''',
    "dto/AuditLogDto.java": '''package com.mef.parkauto.dto;
import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AuditLogDto {
    private Long id;
    private Long utilisateurId;
    private String utilisateurNom;
    private String action;
    private String entite;
    private Long entiteId;
    private String ancienneValeur;
    private String nouvelleValeur;
    private LocalDateTime dateAction;
    private String adresseIp;
}
''',
    "dto/DocumentGEDDto.java": '''package com.mef.parkauto.dto;
import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DocumentGEDDto {
    private Long id;
    private String entite;
    private Long entiteId;
    private String typeDocument;
    private String nomFichier;
    private String typeMime;
    private Long taille;
    private String uploadePar;
    private LocalDateTime dateUpload;
    private String downloadUrl;
}
''',
    "service/AssuranceService.java": '''package com.mef.parkauto.service;

import com.mef.parkauto.dto.AssuranceDto;
import com.mef.parkauto.dto.AssuranceRequest;
import com.mef.parkauto.entity.*;
import com.mef.parkauto.exception.ResourceNotFoundException;
import com.mef.parkauto.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AssuranceService {

    private final AssuranceRepository assuranceRepository;
    private final VehiculeRepository vehiculeRepository;
    private final EmailService emailService;
    private final UtilisateurRepository utilisateurRepository;

    @Transactional(readOnly = true)
    public List<AssuranceDto> getAllAssurances() {
        return assuranceRepository.findAll().stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AssuranceDto getById(Long id) {
        return assuranceRepository.findById(id)
                .map(this::mapToDto)
                .orElseThrow(() -> new ResourceNotFoundException("Assurance non trouvée : " + id));
    }

    @Transactional(readOnly = true)
    public List<AssuranceDto> getByVehicule(Long vehiculeId) {
        return assuranceRepository.findByVehiculeIdOrderByDateFinDesc(vehiculeId)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AssuranceDto> getAssurancesExpirantBientot() {
        LocalDate today = LocalDate.now();
        LocalDate limit = today.plusDays(30);
        return assuranceRepository.findExpirantEntre(today, limit)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public AssuranceDto creerOuModifier(AssuranceRequest request) {
        Vehicule vehicule = vehiculeRepository.findById(request.getVehiculeId())
                .orElseThrow(() -> new ResourceNotFoundException("Véhicule non trouvé : " + request.getVehiculeId()));

        Assurance assurance = request.getId() != null
                ? assuranceRepository.findById(request.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Assurance non trouvée : " + request.getId()))
                : new Assurance();

        assurance.setVehicule(vehicule);
        assurance.setNumeroPolice(request.getNumeroPolice());
        assurance.setCompagnie(request.getCompagnie());
        assurance.setTypeGarantie(request.getTypeGarantie());
        assurance.setDateDebut(request.getDateDebut());
        assurance.setDateFin(request.getDateFin());
        assurance.setMontantPrime(request.getMontantPrime());
        assurance.setFranchise(request.getFranchise());
        assurance.setStatut(request.getStatut() != null ? request.getStatut() : StatutAssurance.ACTIVE);
        assurance.setDocuments(request.getDocuments());
        assurance.setObservations(request.getObservations());

        // Sync dateFinAssurance on vehicule
        if (assurance.getStatut() == StatutAssurance.ACTIVE) {
            vehicule.setDateFinAssurance(request.getDateFin());
            vehiculeRepository.save(vehicule);
        }

        return mapToDto(assuranceRepository.save(assurance));
    }

    @Transactional
    public void supprimer(Long id) {
        assuranceRepository.deleteById(id);
    }

    /**
     * RG02 : Vérifie si un véhicule a une assurance valide. Lance exception si non.
     */
    public void verifierAssuranceValide(Long vehiculeId) {
        List<Assurance> actives = assuranceRepository.findAssurancesActivesParVehicule(vehiculeId, LocalDate.now());
        if (actives.isEmpty()) {
            throw new IllegalStateException(
                "RG02 — Ce véhicule n'a pas d'assurance valide. L'affectation est bloquée jusqu'à la souscription d'un contrat actif."
            );
        }
    }

    private AssuranceDto mapToDto(Assurance a) {
        Vehicule v = a.getVehicule();
        long joursRestants = a.getDateFin() != null ? ChronoUnit.DAYS.between(LocalDate.now(), a.getDateFin()) : 0;
        return AssuranceDto.builder()
                .id(a.getId())
                .vehiculeId(v != null ? v.getId() : null)
                .immatriculation(v != null ? v.getImmatriculation() : null)
                .marqueModele(v != null ? v.getMarque() + " " + v.getModele() : null)
                .numeroPolice(a.getNumeroPolice())
                .compagnie(a.getCompagnie())
                .typeGarantie(a.getTypeGarantie())
                .dateDebut(a.getDateDebut())
                .dateFin(a.getDateFin())
                .montantPrime(a.getMontantPrime())
                .franchise(a.getFranchise())
                .statut(a.getStatut())
                .documents(a.getDocuments())
                .observations(a.getObservations())
                .joursRestants(joursRestants)
                .dateCreation(a.getDateCreation())
                .build();
    }
}
''',
    "service/SinistreService.java": '''package com.mef.parkauto.service;

import com.mef.parkauto.dto.SinistreDto;
import com.mef.parkauto.dto.SinistreRequest;
import com.mef.parkauto.entity.*;
import com.mef.parkauto.exception.ResourceNotFoundException;
import com.mef.parkauto.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SinistreService {

    private final SinistreRepository sinistreRepository;
    private final VehiculeRepository vehiculeRepository;
    private final ConducteurRepository conducteurRepository;
    private final AssuranceRepository assuranceRepository;
    private final EmailService emailService;
    private final UtilisateurRepository utilisateurRepository;

    @Transactional(readOnly = true)
    public List<SinistreDto> getAllSinistres() {
        return sinistreRepository.findAllByOrderByDateAccidentDesc()
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SinistreDto> getByVehicule(Long vehiculeId) {
        return sinistreRepository.findByVehiculeIdOrderByDateAccidentDesc(vehiculeId)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SinistreDto getById(Long id) {
        return sinistreRepository.findById(id).map(this::mapToDto)
                .orElseThrow(() -> new ResourceNotFoundException("Sinistre non trouvé : " + id));
    }

    /**
     * RG01 : Déclarer un sinistre → véhicule passe à ACCIDENTE + notification email
     */
    @Transactional
    public SinistreDto declarer(SinistreRequest request) {
        Vehicule vehicule = vehiculeRepository.findById(request.getVehiculeId())
                .orElseThrow(() -> new ResourceNotFoundException("Véhicule non trouvé : " + request.getVehiculeId()));

        Sinistre sinistre = new Sinistre();
        sinistre.setVehicule(vehicule);

        if (request.getConducteurId() != null) {
            conducteurRepository.findById(request.getConducteurId())
                    .ifPresent(sinistre::setConducteur);
        }
        if (request.getAssuranceId() != null) {
            assuranceRepository.findById(request.getAssuranceId())
                    .ifPresent(sinistre::setAssurance);
        }

        sinistre.setDateAccident(request.getDateAccident());
        sinistre.setLieuAccident(request.getLieuAccident());
        sinistre.setDescription(request.getDescription());
        sinistre.setTiersImpliques(request.getTiersImpliques());
        sinistre.setNatureAccident(request.getNatureAccident());
        sinistre.setMontantDommages(request.getMontantDommages());
        sinistre.setStatut(StatutSinistre.DECLARE);
        sinistre.setReferenceExpertise(request.getReferenceExpertise());

        // RG01 : Basculer statut véhicule
        vehicule.setStatutAdministratif(StatutAdministratif.ACCIDENTE);
        vehiculeRepository.save(vehicule);
        log.info("RG01 - Véhicule {} passé en statut ACCIDENTE suite à sinistre déclaré", vehicule.getImmatriculation());

        // RG01 : Notification email aux gestionnaires
        try {
            utilisateurRepository.findAll().stream()
                .filter(u -> u.getRole() != null && 
                             (u.getRole().getNom() == RoleType.GESTIONNAIRE_CENTRAL ||
                              u.getRole().getNom() == RoleType.ADMIN))
                .forEach(gestionnaire -> emailService.sendSinistreNotification(
                    gestionnaire.getEmail(),
                    gestionnaire.getNom(), gestionnaire.getPrenom(),
                    vehicule.getImmatriculation(),
                    vehicule.getMarque() + " " + vehicule.getModele(),
                    request.getNatureAccident() != null ? request.getNatureAccident().name() : "N/A",
                    request.getLieuAccident()
                ));
        } catch (Exception e) {
            log.warn("Erreur notification email sinistre : {}", e.getMessage());
        }

        return mapToDto(sinistreRepository.save(sinistre));
    }

    @Transactional
    public SinistreDto modifier(Long id, SinistreRequest request) {
        Sinistre sinistre = sinistreRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sinistre non trouvé : " + id));
        if (request.getStatut() != null) sinistre.setStatut(request.getStatut());
        if (request.getMontantDommages() != null) sinistre.setMontantDommages(request.getMontantDommages());
        if (request.getReferenceExpertise() != null) sinistre.setReferenceExpertise(request.getReferenceExpertise());
        if (request.getDescription() != null) sinistre.setDescription(request.getDescription());
        return mapToDto(sinistreRepository.save(sinistre));
    }

    private SinistreDto mapToDto(Sinistre s) {
        Vehicule v = s.getVehicule();
        Conducteur c = s.getConducteur();
        return SinistreDto.builder()
                .id(s.getId())
                .vehiculeId(v != null ? v.getId() : null)
                .immatriculation(v != null ? v.getImmatriculation() : null)
                .marqueModele(v != null ? v.getMarque() + " " + v.getModele() : null)
                .conducteurId(c != null ? c.getId() : null)
                .conducteurNom(c != null ? c.getNom() + " " + c.getPrenom() : null)
                .assuranceId(s.getAssurance() != null ? s.getAssurance().getId() : null)
                .numeroPolice(s.getAssurance() != null ? s.getAssurance().getNumeroPolice() : null)
                .dateAccident(s.getDateAccident())
                .lieuAccident(s.getLieuAccident())
                .description(s.getDescription())
                .tiersImpliques(s.getTiersImpliques())
                .natureAccident(s.getNatureAccident())
                .montantDommages(s.getMontantDommages())
                .statut(s.getStatut())
                .referenceExpertise(s.getReferenceExpertise())
                .dateCreation(s.getDateCreation())
                .build();
    }
}
''',
    "service/InfractionService.java": '''package com.mef.parkauto.service;

import com.mef.parkauto.dto.InfractionDto;
import com.mef.parkauto.dto.InfractionRequest;
import com.mef.parkauto.entity.*;
import com.mef.parkauto.exception.ResourceNotFoundException;
import com.mef.parkauto.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InfractionService {

    private final InfractionRepository infractionRepository;
    private final VehiculeRepository vehiculeRepository;
    private final ConducteurRepository conducteurRepository;

    @Transactional(readOnly = true)
    public List<InfractionDto> getAll() {
        return infractionRepository.findAllByOrderByDateInfractionDesc()
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InfractionDto getById(Long id) {
        return infractionRepository.findById(id).map(this::mapToDto)
                .orElseThrow(() -> new ResourceNotFoundException("Infraction non trouvée : " + id));
    }

    @Transactional
    public InfractionDto creerOuModifier(InfractionRequest request) {
        Vehicule vehicule = vehiculeRepository.findById(request.getVehiculeId())
                .orElseThrow(() -> new ResourceNotFoundException("Véhicule non trouvé : " + request.getVehiculeId()));

        Infraction infraction = request.getId() != null
                ? infractionRepository.findById(request.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Infraction non trouvée : " + request.getId()))
                : new Infraction();

        infraction.setVehicule(vehicule);
        if (request.getConducteurId() != null) {
            conducteurRepository.findById(request.getConducteurId()).ifPresent(infraction::setConducteur);
        }
        infraction.setDateInfraction(request.getDateInfraction());
        infraction.setLieuInfraction(request.getLieuInfraction());
        infraction.setTypeInfraction(request.getTypeInfraction());
        infraction.setMontantAmende(request.getMontantAmende());
        infraction.setStatut(request.getStatut() != null ? request.getStatut() : StatutInfraction.EN_ATTENTE);
        infraction.setReferenceContravention(request.getReferenceContravention());
        infraction.setObservations(request.getObservations());

        return mapToDto(infractionRepository.save(infraction));
    }

    @Transactional
    public void supprimer(Long id) {
        infractionRepository.deleteById(id);
    }

    private InfractionDto mapToDto(Infraction i) {
        Vehicule v = i.getVehicule();
        Conducteur c = i.getConducteur();
        return InfractionDto.builder()
                .id(i.getId())
                .vehiculeId(v != null ? v.getId() : null)
                .immatriculation(v != null ? v.getImmatriculation() : null)
                .marqueModele(v != null ? v.getMarque() + " " + v.getModele() : null)
                .conducteurId(c != null ? c.getId() : null)
                .conducteurNom(c != null ? c.getNom() + " " + c.getPrenom() : null)
                .dateInfraction(i.getDateInfraction())
                .lieuInfraction(i.getLieuInfraction())
                .typeInfraction(i.getTypeInfraction())
                .montantAmende(i.getMontantAmende())
                .statut(i.getStatut())
                .referenceContravention(i.getReferenceContravention())
                .observations(i.getObservations())
                .dateCreation(i.getDateCreation())
                .build();
    }
}
''',
    "service/VisiteTechniqueService.java": '''package com.mef.parkauto.service;

import com.mef.parkauto.dto.VisiteTechniqueDto;
import com.mef.parkauto.dto.VisiteTechniqueRequest;
import com.mef.parkauto.entity.*;
import com.mef.parkauto.exception.ResourceNotFoundException;
import com.mef.parkauto.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VisiteTechniqueService {

    private final VisiteTechniqueRepository vtRepository;
    private final VehiculeRepository vehiculeRepository;
    private final InterventionMaintenanceRepository maintenanceRepository;

    @Transactional(readOnly = true)
    public List<VisiteTechniqueDto> getAll() {
        return vtRepository.findAllByOrderByDateVisiteDesc()
                .stream().map(vt -> mapToDto(vt, null)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VisiteTechniqueDto> getByVehicule(Long vehiculeId) {
        return vtRepository.findByVehiculeIdOrderByDateVisiteDesc(vehiculeId)
                .stream().map(vt -> mapToDto(vt, null)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VisiteTechniqueDto getById(Long id) {
        return vtRepository.findById(id)
                .map(vt -> mapToDto(vt, null))
                .orElseThrow(() -> new ResourceNotFoundException("Visite technique non trouvée : " + id));
    }

    @Transactional
    public VisiteTechniqueDto creerOuModifier(VisiteTechniqueRequest request) {
        Vehicule vehicule = vehiculeRepository.findById(request.getVehiculeId())
                .orElseThrow(() -> new ResourceNotFoundException("Véhicule non trouvé : " + request.getVehiculeId()));

        VisiteTechnique vt = request.getId() != null
                ? vtRepository.findById(request.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Visite non trouvée : " + request.getId()))
                : new VisiteTechnique();

        vt.setVehicule(vehicule);
        vt.setDateVisite(request.getDateVisite());
        vt.setCentre(request.getCentre());
        vt.setResultat(request.getResultat());
        vt.setDateProchaine(request.getDateProchaine());
        vt.setPvVisite(request.getPvVisite());
        vt.setObservations(request.getObservations());

        // Sync dateVisiteTechnique on vehicule
        if (request.getDateProchaine() != null) {
            vehicule.setDateVisiteTechnique(request.getDateProchaine());
            vehiculeRepository.save(vehicule);
        }

        VisiteTechnique saved = vtRepository.save(vt);
        Long interventionId = null;

        // RG03 : CONTRE_VISITE_OBLIGATOIRE → créer intervention maintenance à J+15
        if (ResultatVisite.CONTRE_VISITE_OBLIGATOIRE.equals(request.getResultat())) {
            InterventionMaintenance intervention = new InterventionMaintenance();
            intervention.setVehicule(vehicule);
            intervention.setTypeMaintenance(TypeMaintenance.CURATIVE);
            intervention.setNatureOperation(NatureMaintenance.REPARATION_CARROSSERIE);
            intervention.setDatePrevisionnelle(LocalDate.now().plusDays(15));
            intervention.setKilometragePrevu(vehicule.getKilometrageActuel());
            intervention.setPrestataire("Centre de Visite Technique");
            intervention.setStatut(StatutMaintenance.PROGRAMMEE);
            intervention.setDescription("[RG03] Contre-visite obligatoire suite à VT du " + request.getDateVisite() +
                    " — Centre : " + request.getCentre());
            intervention.setImmobilisation(false);
            intervention.setCoutMainOeuvre(java.math.BigDecimal.ZERO);
            intervention.setCoutPieces(java.math.BigDecimal.ZERO);
            intervention.setMontantTotal(java.math.BigDecimal.ZERO);
            InterventionMaintenance savedIntervention = maintenanceRepository.save(intervention);
            interventionId = savedIntervention.getId();
            log.info("RG03 - Intervention maintenance créée (id={}) à J+15 suite contre-visite VT pour véhicule {}",
                    interventionId, vehicule.getImmatriculation());
        }

        return mapToDto(saved, interventionId);
    }

    @Transactional
    public void supprimer(Long id) {
        vtRepository.deleteById(id);
    }

    private VisiteTechniqueDto mapToDto(VisiteTechnique vt, Long interventionCreeeId) {
        Vehicule v = vt.getVehicule();
        return VisiteTechniqueDto.builder()
                .id(vt.getId())
                .vehiculeId(v != null ? v.getId() : null)
                .immatriculation(v != null ? v.getImmatriculation() : null)
                .marqueModele(v != null ? v.getMarque() + " " + v.getModele() : null)
                .direction(v != null ? v.getDirection() : null)
                .dateVisite(vt.getDateVisite())
                .centre(vt.getCentre())
                .resultat(vt.getResultat())
                .dateProchaine(vt.getDateProchaine())
                .pvVisite(vt.getPvVisite())
                .observations(vt.getObservations())
                .interventionCreeeId(interventionCreeeId)
                .dateCreation(vt.getDateCreation())
                .build();
    }
}
''',
    "service/TaxeAutomobileService.java": '''package com.mef.parkauto.service;

import com.mef.parkauto.dto.TaxeAutomobileDto;
import com.mef.parkauto.dto.TaxeAutomobileRequest;
import com.mef.parkauto.entity.*;
import com.mef.parkauto.exception.ResourceNotFoundException;
import com.mef.parkauto.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaxeAutomobileService {

    private final TaxeAutomobileRepository taxeRepository;
    private final VehiculeRepository vehiculeRepository;

    @Transactional(readOnly = true)
    public List<TaxeAutomobileDto> getAll() {
        return taxeRepository.findAll().stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TaxeAutomobileDto getById(Long id) {
        return taxeRepository.findById(id).map(this::mapToDto)
                .orElseThrow(() -> new ResourceNotFoundException("Taxe non trouvée : " + id));
    }

    @Transactional
    public TaxeAutomobileDto creerOuModifier(TaxeAutomobileRequest request) {
        Vehicule vehicule = vehiculeRepository.findById(request.getVehiculeId())
                .orElseThrow(() -> new ResourceNotFoundException("Véhicule non trouvé : " + request.getVehiculeId()));
        TaxeAutomobile taxe = request.getId() != null
                ? taxeRepository.findById(request.getId()).orElseThrow(() -> new ResourceNotFoundException("Taxe non trouvée : " + request.getId()))
                : new TaxeAutomobile();
        taxe.setVehicule(vehicule);
        taxe.setAnnee(request.getAnnee());
        taxe.setType(request.getType());
        taxe.setMontant(request.getMontant());
        taxe.setStatut(request.getStatut() != null ? request.getStatut() : StatutTaxe.EN_RETARD);
        taxe.setDateEcheance(request.getDateEcheance());
        taxe.setReferencePaiement(request.getReferencePaiement());
        return mapToDto(taxeRepository.save(taxe));
    }

    @Transactional
    public void supprimer(Long id) { taxeRepository.deleteById(id); }

    private TaxeAutomobileDto mapToDto(TaxeAutomobile t) {
        Vehicule v = t.getVehicule();
        return TaxeAutomobileDto.builder()
                .id(t.getId()).vehiculeId(v != null ? v.getId() : null)
                .immatriculation(v != null ? v.getImmatriculation() : null)
                .marqueModele(v != null ? v.getMarque() + " " + v.getModele() : null)
                .annee(t.getAnnee()).type(t.getType()).montant(t.getMontant())
                .statut(t.getStatut()).dateEcheance(t.getDateEcheance())
                .referencePaiement(t.getReferencePaiement())
                .dateCreation(t.getDateCreation()).build();
    }
}
''',
    "service/ReformeVehiculeService.java": '''package com.mef.parkauto.service;

import com.mef.parkauto.dto.ReformeVehiculeDto;
import com.mef.parkauto.dto.ReformeVehiculeRequest;
import com.mef.parkauto.entity.*;
import com.mef.parkauto.exception.ResourceNotFoundException;
import com.mef.parkauto.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReformeVehiculeService {

    private final ReformeVehiculeRepository reformeRepository;
    private final VehiculeRepository vehiculeRepository;

    @Transactional(readOnly = true)
    public List<ReformeVehiculeDto> getAll() {
        return reformeRepository.findAllByOrderByDateCreationDesc()
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ReformeVehiculeDto getById(Long id) {
        return reformeRepository.findById(id).map(this::mapToDto)
                .orElseThrow(() -> new ResourceNotFoundException("Réforme non trouvée : " + id));
    }

    @Transactional
    public ReformeVehiculeDto creerOuModifier(ReformeVehiculeRequest request) {
        Vehicule vehicule = vehiculeRepository.findById(request.getVehiculeId())
                .orElseThrow(() -> new ResourceNotFoundException("Véhicule non trouvé : " + request.getVehiculeId()));

        ReformeVehicule reforme = request.getId() != null
                ? reformeRepository.findById(request.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Réforme non trouvée : " + request.getId()))
                : new ReformeVehicule();

        reforme.setVehicule(vehicule);
        reforme.setMotifReforme(request.getMotifReforme());
        reforme.setDateDecision(request.getDateDecision());
        reforme.setPvCommission(request.getPvCommission());
        reforme.setStatut(request.getStatut() != null ? request.getStatut() : StatutReforme.INITIE);
        reforme.setPrixCession(request.getPrixCession());

        if (reforme.getStatut() == StatutReforme.EN_COURS_DE_REFORME || reforme.getStatut() == StatutReforme.INITIE) {
            vehicule.setStatutAdministratif(StatutAdministratif.EN_COURS_DE_REFORME);
            vehiculeRepository.save(vehicule);
        }

        return mapToDto(reformeRepository.save(reforme));
    }

    /**
     * RG04 : Valide la réforme — le PV de commission est OBLIGATOIRE
     */
    @Transactional
    public ReformeVehiculeDto valider(Long id) {
        ReformeVehicule reforme = reformeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Réforme non trouvée : " + id));

        // RG04 — Vérification PV obligatoire
        if (reforme.getPvCommission() == null || reforme.getPvCommission().isBlank()) {
            throw new IllegalStateException(
                "RG04 — Le PV de Commission de Réforme est obligatoire avant la validation finale. " +
                "Veuillez uploader le document via l'API GED."
            );
        }

        reforme.setStatut(StatutReforme.VALIDE);
        Vehicule vehicule = reforme.getVehicule();
        vehicule.setStatutAdministratif(StatutAdministratif.REFORME);
        vehiculeRepository.save(vehicule);
        log.info("RG04 - Réforme {} validée pour le véhicule {}", id, vehicule.getImmatriculation());

        return mapToDto(reformeRepository.save(reforme));
    }

    @Transactional
    public void supprimer(Long id) { reformeRepository.deleteById(id); }

    private ReformeVehiculeDto mapToDto(ReformeVehicule r) {
        Vehicule v = r.getVehicule();
        return ReformeVehiculeDto.builder()
                .id(r.getId())
                .vehiculeId(v != null ? v.getId() : null)
                .immatriculation(v != null ? v.getImmatriculation() : null)
                .marqueModele(v != null ? v.getMarque() + " " + v.getModele() : null)
                .direction(v != null ? v.getDirection() : null)
                .motifReforme(r.getMotifReforme())
                .dateDecision(r.getDateDecision())
                .pvCommission(r.getPvCommission())
                .statut(r.getStatut())
                .prixCession(r.getPrixCession())
                .dateCreation(r.getDateCreation())
                .build();
    }
}
''',
    "service/BudgetService.java": '''package com.mef.parkauto.service;

import com.mef.parkauto.dto.*;
import com.mef.parkauto.entity.*;
import com.mef.parkauto.exception.ResourceNotFoundException;
import com.mef.parkauto.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetDirectionRepository budgetRepository;
    private final PrevisionCarburantRepository previsionRepository;
    private final VehiculeRepository vehiculeRepository;

    // --- BUDGETS ---

    @Transactional(readOnly = true)
    public List<BudgetDirectionDto> getAllBudgets() {
        return budgetRepository.findAll().stream().map(this::mapBudgetToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BudgetDirectionDto> getBudgetsByAnnee(Integer annee) {
        return budgetRepository.findByAnneeOrderByDirectionAscNatureDepenseAsc(annee)
                .stream().map(this::mapBudgetToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BudgetSyntheseDto getSynthese(Integer annee) {
        List<BudgetDirectionDto> lignes = getBudgetsByAnnee(annee);
        BigDecimal totalAlloue = lignes.stream().map(BudgetDirectionDto::getMontantAlloue)
                .filter(m -> m != null).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalRealise = lignes.stream().map(BudgetDirectionDto::getMontantRealise)
                .filter(m -> m != null).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalRestant = totalAlloue.subtract(totalRealise);
        double taux = totalAlloue.compareTo(BigDecimal.ZERO) > 0
                ? totalRealise.divide(totalAlloue, 4, RoundingMode.HALF_UP).doubleValue() * 100 : 0.0;
        return BudgetSyntheseDto.builder()
                .annee(annee).totalAlloue(totalAlloue).totalRealise(totalRealise)
                .totalRestant(totalRestant).tauxConsommationGlobal(taux).lignes(lignes).build();
    }

    @Transactional(readOnly = true)
    public BudgetDirectionDto getBudgetById(Long id) {
        return budgetRepository.findById(id).map(this::mapBudgetToDto)
                .orElseThrow(() -> new ResourceNotFoundException("Budget non trouvé : " + id));
    }

    @Transactional
    public BudgetDirectionDto creerOuModifierBudget(BudgetDirectionRequest request) {
        BudgetDirection budget = request.getId() != null
                ? budgetRepository.findById(request.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Budget non trouvé : " + request.getId()))
                : new BudgetDirection();
        budget.setAnnee(request.getAnnee());
        budget.setDirection(request.getDirection());
        budget.setNatureDepense(request.getNatureDepense());
        budget.setMontantAlloue(request.getMontantAlloue() != null ? request.getMontantAlloue() : BigDecimal.ZERO);
        budget.setMontantEngage(request.getMontantEngage() != null ? request.getMontantEngage() : BigDecimal.ZERO);
        budget.setMontantRealise(request.getMontantRealise() != null ? request.getMontantRealise() : BigDecimal.ZERO);
        return mapBudgetToDto(budgetRepository.save(budget));
    }

    @Transactional
    public void supprimerBudget(Long id) { budgetRepository.deleteById(id); }

    // --- PREVISIONS ---

    @Transactional(readOnly = true)
    public List<PrevisionCarburantDto> getAllPrevisions() {
        return previsionRepository.findAll().stream().map(this::mapPrevisionToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PrevisionCarburantDto> getPrevisionsByDirection(String direction, Integer annee) {
        return previsionRepository.findByDirectionAndAnneeOrderByMoisAsc(direction, annee)
                .stream().map(this::mapPrevisionToDto).collect(Collectors.toList());
    }

    @Transactional
    public PrevisionCarburantDto creerOuModifierPrevision(PrevisionCarburantRequest request) {
        PrevisionCarburant prev = request.getId() != null
                ? previsionRepository.findById(request.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Prévision non trouvée : " + request.getId()))
                : new PrevisionCarburant();
        if (request.getVehiculeId() != null) {
            vehiculeRepository.findById(request.getVehiculeId()).ifPresent(prev::setVehicule);
        }
        prev.setDirection(request.getDirection());
        prev.setMois(request.getMois());
        prev.setAnnee(request.getAnnee());
        prev.setKmPrevus(request.getKmPrevus());
        prev.setConsoMoyenne(request.getConsoMoyenne());
        prev.setPrixUnitairePrevus(request.getPrixUnitairePrevus());
        prev.setQuantiteReelle(request.getQuantiteReelle());
        prev.setMontantReel(request.getMontantReel());
        return mapPrevisionToDto(previsionRepository.save(prev));
    }

    @Transactional
    public void supprimerPrevision(Long id) { previsionRepository.deleteById(id); }

    private BudgetDirectionDto mapBudgetToDto(BudgetDirection b) {
        BigDecimal alloue = b.getMontantAlloue() != null ? b.getMontantAlloue() : BigDecimal.ZERO;
        BigDecimal realise = b.getMontantRealise() != null ? b.getMontantRealise() : BigDecimal.ZERO;
        double taux = alloue.compareTo(BigDecimal.ZERO) > 0
                ? realise.divide(alloue, 4, RoundingMode.HALF_UP).doubleValue() * 100 : 0.0;
        return BudgetDirectionDto.builder()
                .id(b.getId()).annee(b.getAnnee()).direction(b.getDirection())
                .natureDepense(b.getNatureDepense()).montantAlloue(alloue)
                .montantEngage(b.getMontantEngage()).montantRealise(realise)
                .montantRestant(b.getMontantRestant()).tauxConsommation(taux)
                .dateCreation(b.getDateCreation()).build();
    }

    private PrevisionCarburantDto mapPrevisionToDto(PrevisionCarburant p) {
        Double qteReelle = p.getQuantiteReelle();
        Double qtePrevue = p.getQuantitePrevueLitres();
        double ecart = (qteReelle != null && qtePrevue != null) ? qteReelle - qtePrevue : 0.0;
        return PrevisionCarburantDto.builder()
                .id(p.getId())
                .vehiculeId(p.getVehicule() != null ? p.getVehicule().getId() : null)
                .immatriculation(p.getVehicule() != null ? p.getVehicule().getImmatriculation() : null)
                .direction(p.getDirection()).mois(p.getMois()).annee(p.getAnnee())
                .kmPrevus(p.getKmPrevus()).consoMoyenne(p.getConsoMoyenne())
                .quantitePrevueLitres(qtePrevue)
                .prixUnitairePrevus(p.getPrixUnitairePrevus())
                .montantPrevu(p.getMontantPrevu())
                .quantiteReelle(qteReelle).montantReel(p.getMontantReel())
                .ecartQuantite(ecart)
                .dateCreation(p.getDateCreation()).build();
    }
}
''',
    "service/AuditLogService.java": '''package com.mef.parkauto.service;

import com.mef.parkauto.dto.AuditLogDto;
import com.mef.parkauto.entity.AuditLog;
import com.mef.parkauto.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    /**
     * Journalise une action — IMMUTABLE, pas de modification possible.
     */
    @Transactional
    public void logAction(Long utilisateurId, String utilisateurNom, String action,
                          String entite, Long entiteId, String ancienneValeur,
                          String nouvelleValeur, String adresseIp) {
        AuditLog log = AuditLog.builder()
                .utilisateurId(utilisateurId)
                .utilisateurNom(utilisateurNom)
                .action(action)
                .entite(entite)
                .entiteId(entiteId)
                .ancienneValeur(ancienneValeur)
                .nouvelleValeur(nouvelleValeur)
                .dateAction(LocalDateTime.now())
                .adresseIp(adresseIp)
                .build();
        auditLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogDto> getAll(int page, int size) {
        return auditLogRepository.findAllByOrderByDateActionDesc(PageRequest.of(page, size))
                .map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public List<AuditLogDto> getByEntite(String entite, Long entiteId) {
        return auditLogRepository.findByEntiteAndEntiteIdOrderByDateActionDesc(entite, entiteId)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    private AuditLogDto mapToDto(AuditLog a) {
        return AuditLogDto.builder()
                .id(a.getId()).utilisateurId(a.getUtilisateurId())
                .utilisateurNom(a.getUtilisateurNom()).action(a.getAction())
                .entite(a.getEntite()).entiteId(a.getEntiteId())
                .ancienneValeur(a.getAncienneValeur()).nouvelleValeur(a.getNouvelleValeur())
                .dateAction(a.getDateAction()).adresseIp(a.getAdresseIp())
                .build();
    }
}
''',
    "service/DocumentGEDService.java": '''package com.mef.parkauto.service;

import com.mef.parkauto.dto.DocumentGEDDto;
import com.mef.parkauto.entity.DocumentGED;
import com.mef.parkauto.exception.ResourceNotFoundException;
import com.mef.parkauto.repository.DocumentGEDRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentGEDService {

    private final DocumentGEDRepository documentRepository;

    @Value("${app.ged.upload-dir:./uploads}")
    private String uploadDir;

    private static final Set<String> ALLOWED_MIME = Set.of(
            "application/pdf", "image/png", "image/jpeg",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel"
    );

    @Transactional
    public DocumentGEDDto uploadDocument(MultipartFile file, String entite, Long entiteId,
                                         String typeDocument, String uploadePar) throws IOException {
        // Validation MIME
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME.contains(contentType)) {
            throw new IllegalArgumentException(
                "Type de fichier non autorisé: '" + contentType + "'. " +
                "Seuls PDF, PNG, JPG et XLSX sont acceptés."
            );
        }

        // Création du répertoire si nécessaire
        Path uploadPath = Paths.get(uploadDir, entite.toLowerCase(), String.valueOf(entiteId));
        Files.createDirectories(uploadPath);

        // Nom de fichier unique
        String extension = getExtension(file.getOriginalFilename());
        String uniqueName = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss").format(LocalDateTime.now())
                + "_" + UUID.randomUUID().toString().substring(0, 8) + extension;
        Path targetPath = uploadPath.resolve(uniqueName);

        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        log.info("GED - Fichier uploadé : {}", targetPath);

        DocumentGED doc = DocumentGED.builder()
                .entite(entite)
                .entiteId(entiteId)
                .typeDocument(typeDocument)
                .nomFichier(file.getOriginalFilename())
                .cheminFichier(targetPath.toString())
                .typeMime(contentType)
                .taille(file.getSize())
                .uploadePar(uploadePar)
                .build();

        return mapToDto(documentRepository.save(doc));
    }

    @Transactional(readOnly = true)
    public List<DocumentGEDDto> getByEntite(String entite, Long entiteId) {
        return documentRepository.findByEntiteAndEntiteIdOrderByDateUploadDesc(entite, entiteId)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Resource downloadDocument(Long id) throws MalformedURLException {
        DocumentGED doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document non trouvé : " + id));
        Path path = Paths.get(doc.getCheminFichier());
        Resource resource = new UrlResource(path.toUri());
        if (!resource.exists() || !resource.isReadable()) {
            throw new ResourceNotFoundException("Fichier physique introuvable : " + doc.getNomFichier());
        }
        return resource;
    }

    /**
     * AMÉLIORATION : Supprime la ligne BDD ET le fichier physique sur le disque.
     */
    @Transactional
    public void deleteDocument(Long id) {
        DocumentGED doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document non trouvé : " + id));
        try {
            boolean deleted = Files.deleteIfExists(Paths.get(doc.getCheminFichier()));
            if (deleted) {
                log.info("GED - Fichier physique supprimé : {}", doc.getCheminFichier());
            } else {
                log.warn("GED - Fichier physique non trouvé lors de la suppression : {}", doc.getCheminFichier());
            }
        } catch (IOException e) {
            log.error("GED - Erreur suppression fichier physique {}: {}", doc.getCheminFichier(), e.getMessage());
        }
        documentRepository.delete(doc);
    }

    @Transactional(readOnly = true)
    public DocumentGEDDto getById(Long id) {
        return documentRepository.findById(id).map(this::mapToDto)
                .orElseThrow(() -> new ResourceNotFoundException("Document non trouvé : " + id));
    }

    private DocumentGEDDto mapToDto(DocumentGED d) {
        return DocumentGEDDto.builder()
                .id(d.getId()).entite(d.getEntite()).entiteId(d.getEntiteId())
                .typeDocument(d.getTypeDocument()).nomFichier(d.getNomFichier())
                .typeMime(d.getTypeMime()).taille(d.getTaille())
                .uploadePar(d.getUploadePar()).dateUpload(d.getDateUpload())
                .downloadUrl("/api/documents/" + d.getId() + "/download")
                .build();
    }

    private String getExtension(String filename) {
        if (filename == null) return "";
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot) : "";
    }
}
''',
    "service/NotificationService.java": '''package com.mef.parkauto.service;

import com.mef.parkauto.entity.RoleType;
import com.mef.parkauto.entity.StatutAssurance;
import com.mef.parkauto.repository.AssuranceRepository;
import com.mef.parkauto.repository.UtilisateurRepository;
import com.mef.parkauto.repository.VisiteTechniqueRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final AssuranceRepository assuranceRepository;
    private final VisiteTechniqueRepository vtRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final EmailService emailService;

    /**
     * Vérifie quotidiennement (8h00) les assurances expirant dans 30 jours et les VT proches.
     */
    @Scheduled(cron = "0 0 8 * * ?")
    @Transactional(readOnly = true)
    public void envoyerAlertesQuotidiennes() {
        log.info("NotificationService - Démarrage des alertes quotidiennes J-30");

        LocalDate today = LocalDate.now();
        LocalDate limit30 = today.plusDays(30);

        // Alertes assurances
        List<com.mef.parkauto.entity.Assurance> assurancesExpirant =
                assuranceRepository.findExpirantEntre(today, limit30);

        assurancesExpirant.forEach(assurance -> {
            log.info("Alerte assurance expirante : police {} - véhicule {}",
                    assurance.getNumeroPolice(),
                    assurance.getVehicule().getImmatriculation());
            // Notifier les gestionnaires
            utilisateurRepository.findAll().stream()
                .filter(u -> u.getRole() != null &&
                             (u.getRole().getNom() == RoleType.GESTIONNAIRE_CENTRAL ||
                              u.getRole().getNom() == RoleType.ADMIN))
                .forEach(g -> {
                    try {
                        emailService.sendAssuranceExpirationAlert(
                            g.getEmail(), g.getNom(), g.getPrenom(),
                            assurance.getVehicule().getImmatriculation(),
                            assurance.getVehicule().getMarque() + " " + assurance.getVehicule().getModele(),
                            assurance.getNumeroPolice(),
                            assurance.getDateFin()
                        );
                    } catch (Exception e) {
                        log.error("Erreur envoi alerte assurance : {}", e.getMessage());
                    }
                });
        });

        // Alertes visites techniques
        vtRepository.findByDateProchaineBeforeAndDateProchaineIsNotNull(limit30).stream()
            .filter(vt -> vt.getDateProchaine() != null && vt.getDateProchaine().isAfter(today.minusDays(1)))
            .forEach(vt -> log.info("Alerte VT prochaine : véhicule {} - date {}",
                    vt.getVehicule().getImmatriculation(), vt.getDateProchaine()));

        log.info("NotificationService - Alertes quotidiennes terminées. {} assurances expirant signalées.",
                assurancesExpirant.size());
    }
}
''',
    "controller/AssuranceController.java": '''package com.mef.parkauto.controller;

import com.mef.parkauto.dto.AssuranceDto;
import com.mef.parkauto.dto.AssuranceRequest;
import com.mef.parkauto.service.AssuranceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assurances")
@RequiredArgsConstructor
public class AssuranceController {

    private final AssuranceService assuranceService;

    @GetMapping
    public ResponseEntity<List<AssuranceDto>> getAll() {
        return ResponseEntity.ok(assuranceService.getAllAssurances());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssuranceDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(assuranceService.getById(id));
    }

    @GetMapping("/vehicule/{vehiculeId}")
    public ResponseEntity<List<AssuranceDto>> getByVehicule(@PathVariable Long vehiculeId) {
        return ResponseEntity.ok(assuranceService.getByVehicule(vehiculeId));
    }

    @GetMapping("/expirant-bientot")
    public ResponseEntity<List<AssuranceDto>> getExpirantBientot() {
        return ResponseEntity.ok(assuranceService.getAssurancesExpirantBientot());
    }

    @PostMapping
    public ResponseEntity<AssuranceDto> creer(@RequestBody AssuranceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(assuranceService.creerOuModifier(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AssuranceDto> modifier(@PathVariable Long id, @RequestBody AssuranceRequest request) {
        request.setId(id);
        return ResponseEntity.ok(assuranceService.creerOuModifier(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        assuranceService.supprimer(id);
        return ResponseEntity.noContent().build();
    }
}
''',
    "controller/SinistreController.java": '''package com.mef.parkauto.controller;

import com.mef.parkauto.dto.SinistreDto;
import com.mef.parkauto.dto.SinistreRequest;
import com.mef.parkauto.service.SinistreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sinistres")
@RequiredArgsConstructor
public class SinistreController {

    private final SinistreService sinistreService;

    @GetMapping
    public ResponseEntity<List<SinistreDto>> getAll() {
        return ResponseEntity.ok(sinistreService.getAllSinistres());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SinistreDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(sinistreService.getById(id));
    }

    @GetMapping("/vehicule/{vehiculeId}")
    public ResponseEntity<List<SinistreDto>> getByVehicule(@PathVariable Long vehiculeId) {
        return ResponseEntity.ok(sinistreService.getByVehicule(vehiculeId));
    }

    @PostMapping
    public ResponseEntity<SinistreDto> declarer(@RequestBody SinistreRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sinistreService.declarer(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SinistreDto> modifier(@PathVariable Long id, @RequestBody SinistreRequest request) {
        return ResponseEntity.ok(sinistreService.modifier(id, request));
    }
}
''',
    "controller/InfractionController.java": '''package com.mef.parkauto.controller;

import com.mef.parkauto.dto.InfractionDto;
import com.mef.parkauto.dto.InfractionRequest;
import com.mef.parkauto.service.InfractionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/infractions")
@RequiredArgsConstructor
public class InfractionController {
    private final InfractionService infractionService;

    @GetMapping public ResponseEntity<List<InfractionDto>> getAll() { return ResponseEntity.ok(infractionService.getAll()); }
    @GetMapping("/{id}") public ResponseEntity<InfractionDto> getById(@PathVariable Long id) { return ResponseEntity.ok(infractionService.getById(id)); }
    @PostMapping public ResponseEntity<InfractionDto> creer(@RequestBody InfractionRequest req) { return ResponseEntity.status(HttpStatus.CREATED).body(infractionService.creerOuModifier(req)); }
    @PutMapping("/{id}") public ResponseEntity<InfractionDto> modifier(@PathVariable Long id, @RequestBody InfractionRequest req) { req.setId(id); return ResponseEntity.ok(infractionService.creerOuModifier(req)); }
    @DeleteMapping("/{id}") public ResponseEntity<Void> supprimer(@PathVariable Long id) { infractionService.supprimer(id); return ResponseEntity.noContent().build(); }
}
''',
    "controller/VisiteTechniqueController.java": '''package com.mef.parkauto.controller;

import com.mef.parkauto.dto.VisiteTechniqueDto;
import com.mef.parkauto.dto.VisiteTechniqueRequest;
import com.mef.parkauto.service.VisiteTechniqueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/visites-techniques")
@RequiredArgsConstructor
public class VisiteTechniqueController {
    private final VisiteTechniqueService vtService;

    @GetMapping public ResponseEntity<List<VisiteTechniqueDto>> getAll() { return ResponseEntity.ok(vtService.getAll()); }
    @GetMapping("/{id}") public ResponseEntity<VisiteTechniqueDto> getById(@PathVariable Long id) { return ResponseEntity.ok(vtService.getById(id)); }
    @GetMapping("/vehicule/{vehiculeId}") public ResponseEntity<List<VisiteTechniqueDto>> getByVehicule(@PathVariable Long vehiculeId) { return ResponseEntity.ok(vtService.getByVehicule(vehiculeId)); }
    @PostMapping public ResponseEntity<VisiteTechniqueDto> creer(@RequestBody VisiteTechniqueRequest req) { return ResponseEntity.status(HttpStatus.CREATED).body(vtService.creerOuModifier(req)); }
    @PutMapping("/{id}") public ResponseEntity<VisiteTechniqueDto> modifier(@PathVariable Long id, @RequestBody VisiteTechniqueRequest req) { req.setId(id); return ResponseEntity.ok(vtService.creerOuModifier(req)); }
    @DeleteMapping("/{id}") public ResponseEntity<Void> supprimer(@PathVariable Long id) { vtService.supprimer(id); return ResponseEntity.noContent().build(); }
}
''',
    "controller/TaxeAutomobileController.java": '''package com.mef.parkauto.controller;

import com.mef.parkauto.dto.TaxeAutomobileDto;
import com.mef.parkauto.dto.TaxeAutomobileRequest;
import com.mef.parkauto.service.TaxeAutomobileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/taxes-automobiles")
@RequiredArgsConstructor
public class TaxeAutomobileController {
    private final TaxeAutomobileService taxeService;

    @GetMapping public ResponseEntity<List<TaxeAutomobileDto>> getAll() { return ResponseEntity.ok(taxeService.getAll()); }
    @GetMapping("/{id}") public ResponseEntity<TaxeAutomobileDto> getById(@PathVariable Long id) { return ResponseEntity.ok(taxeService.getById(id)); }
    @PostMapping public ResponseEntity<TaxeAutomobileDto> creer(@RequestBody TaxeAutomobileRequest req) { return ResponseEntity.status(HttpStatus.CREATED).body(taxeService.creerOuModifier(req)); }
    @PutMapping("/{id}") public ResponseEntity<TaxeAutomobileDto> modifier(@PathVariable Long id, @RequestBody TaxeAutomobileRequest req) { req.setId(id); return ResponseEntity.ok(taxeService.creerOuModifier(req)); }
    @DeleteMapping("/{id}") public ResponseEntity<Void> supprimer(@PathVariable Long id) { taxeService.supprimer(id); return ResponseEntity.noContent().build(); }
}
''',
    "controller/ReformeVehiculeController.java": '''package com.mef.parkauto.controller;

import com.mef.parkauto.dto.ReformeVehiculeDto;
import com.mef.parkauto.dto.ReformeVehiculeRequest;
import com.mef.parkauto.service.ReformeVehiculeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reformes")
@RequiredArgsConstructor
public class ReformeVehiculeController {
    private final ReformeVehiculeService reformeService;

    @GetMapping public ResponseEntity<List<ReformeVehiculeDto>> getAll() { return ResponseEntity.ok(reformeService.getAll()); }
    @GetMapping("/{id}") public ResponseEntity<ReformeVehiculeDto> getById(@PathVariable Long id) { return ResponseEntity.ok(reformeService.getById(id)); }
    @PostMapping public ResponseEntity<ReformeVehiculeDto> creer(@RequestBody ReformeVehiculeRequest req) { return ResponseEntity.status(HttpStatus.CREATED).body(reformeService.creerOuModifier(req)); }
    @PutMapping("/{id}") public ResponseEntity<ReformeVehiculeDto> modifier(@PathVariable Long id, @RequestBody ReformeVehiculeRequest req) { req.setId(id); return ResponseEntity.ok(reformeService.creerOuModifier(req)); }
    @PostMapping("/{id}/valider") public ResponseEntity<ReformeVehiculeDto> valider(@PathVariable Long id) { return ResponseEntity.ok(reformeService.valider(id)); }
    @DeleteMapping("/{id}") public ResponseEntity<Void> supprimer(@PathVariable Long id) { reformeService.supprimer(id); return ResponseEntity.noContent().build(); }
}
''',
    "controller/BudgetController.java": '''package com.mef.parkauto.controller;

import com.mef.parkauto.dto.*;
import com.mef.parkauto.service.BudgetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;

    // --- BUDGETS ---
    @GetMapping("/api/budgets")
    public ResponseEntity<List<BudgetDirectionDto>> getAllBudgets(@RequestParam(required=false) Integer annee) {
        if (annee != null) return ResponseEntity.ok(budgetService.getBudgetsByAnnee(annee));
        return ResponseEntity.ok(budgetService.getAllBudgets());
    }

    @GetMapping("/api/budgets/{id}")
    public ResponseEntity<BudgetDirectionDto> getBudget(@PathVariable Long id) {
        return ResponseEntity.ok(budgetService.getBudgetById(id));
    }

    @GetMapping("/api/budgets/synthese")
    public ResponseEntity<BudgetSyntheseDto> getSynthese(@RequestParam Integer annee) {
        return ResponseEntity.ok(budgetService.getSynthese(annee));
    }

    @PostMapping("/api/budgets")
    public ResponseEntity<BudgetDirectionDto> creerBudget(@RequestBody BudgetDirectionRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(budgetService.creerOuModifierBudget(req));
    }

    @PutMapping("/api/budgets/{id}")
    public ResponseEntity<BudgetDirectionDto> modifierBudget(@PathVariable Long id, @RequestBody BudgetDirectionRequest req) {
        req.setId(id);
        return ResponseEntity.ok(budgetService.creerOuModifierBudget(req));
    }

    @DeleteMapping("/api/budgets/{id}")
    public ResponseEntity<Void> supprimerBudget(@PathVariable Long id) {
        budgetService.supprimerBudget(id);
        return ResponseEntity.noContent().build();
    }

    // --- PREVISIONS CARBURANT ---
    @GetMapping("/api/previsions-carburant")
    public ResponseEntity<List<PrevisionCarburantDto>> getAllPrevisions() {
        return ResponseEntity.ok(budgetService.getAllPrevisions());
    }

    @GetMapping("/api/previsions-carburant/direction/{direction}")
    public ResponseEntity<List<PrevisionCarburantDto>> getPrevisionsByDirection(
            @PathVariable String direction, @RequestParam Integer annee) {
        return ResponseEntity.ok(budgetService.getPrevisionsByDirection(direction, annee));
    }

    @PostMapping("/api/previsions-carburant")
    public ResponseEntity<PrevisionCarburantDto> creerPrevision(@RequestBody PrevisionCarburantRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(budgetService.creerOuModifierPrevision(req));
    }

    @PutMapping("/api/previsions-carburant/{id}")
    public ResponseEntity<PrevisionCarburantDto> modifierPrevision(@PathVariable Long id, @RequestBody PrevisionCarburantRequest req) {
        req.setId(id);
        return ResponseEntity.ok(budgetService.creerOuModifierPrevision(req));
    }

    @DeleteMapping("/api/previsions-carburant/{id}")
    public ResponseEntity<Void> supprimerPrevision(@PathVariable Long id) {
        budgetService.supprimerPrevision(id);
        return ResponseEntity.noContent().build();
    }
}
''',
    "controller/AuditLogController.java": '''package com.mef.parkauto.controller;

import com.mef.parkauto.dto.AuditLogDto;
import com.mef.parkauto.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<Page<AuditLogDto>> getAll(
            @RequestParam(defaultValue="0") int page,
            @RequestParam(defaultValue="50") int size) {
        return ResponseEntity.ok(auditLogService.getAll(page, size));
    }

    @GetMapping("/entite/{entite}/{entiteId}")
    public ResponseEntity<List<AuditLogDto>> getByEntite(
            @PathVariable String entite, @PathVariable Long entiteId) {
        return ResponseEntity.ok(auditLogService.getByEntite(entite, entiteId));
    }

    /**
     * AMÉLIORATION : Récupère l'IP réelle via X-Forwarded-For ou remoteAddr
     */
    public static String extractIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
''',
    "controller/DocumentGEDController.java": '''package com.mef.parkauto.controller;

import com.mef.parkauto.dto.DocumentGEDDto;
import com.mef.parkauto.service.DocumentGEDService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentGEDController {

    private final DocumentGEDService documentService;

    @PostMapping("/upload")
    public ResponseEntity<DocumentGEDDto> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam String entite,
            @RequestParam Long entiteId,
            @RequestParam(defaultValue="DOCUMENT") String typeDocument,
            Authentication authentication,
            HttpServletRequest request) throws IOException {
        String uploadePar = authentication != null ? authentication.getName() : "SYSTEM";
        DocumentGEDDto dto = documentService.uploadDocument(file, entite, entiteId, typeDocument, uploadePar);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    @GetMapping("/entite/{entite}/{entiteId}")
    public ResponseEntity<List<DocumentGEDDto>> getByEntite(
            @PathVariable String entite, @PathVariable Long entiteId) {
        return ResponseEntity.ok(documentService.getByEntite(entite, entiteId));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable Long id) throws Exception {
        DocumentGEDDto meta = documentService.getById(id);
        Resource resource = documentService.downloadDocument(id);
        String contentType = meta.getTypeMime() != null ? meta.getTypeMime() : MediaType.APPLICATION_OCTET_STREAM_VALUE;
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\\"" + meta.getNomFichier() + "\\"")
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        documentService.deleteDocument(id);
        return ResponseEntity.noContent().build();
    }
}
'''
}

for rel_path, content in files.items():
    file_path = os.path.join(base_dir, rel_path.replace('/', '\\'))
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Files created successfully.")
