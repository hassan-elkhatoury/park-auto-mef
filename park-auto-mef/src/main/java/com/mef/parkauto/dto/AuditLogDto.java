package com.mef.parkauto.dto;
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
