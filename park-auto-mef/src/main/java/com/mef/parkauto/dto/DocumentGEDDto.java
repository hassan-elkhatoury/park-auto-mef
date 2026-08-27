package com.mef.parkauto.dto;
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
