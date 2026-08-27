package com.mef.parkauto.service;

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
