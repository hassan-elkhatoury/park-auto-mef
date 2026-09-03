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
    private final JournalService journalService;

    @Value("${app.ged.upload-dir:./uploads}")
    private String uploadDir;

    private static final Set<String> ALLOWED_MIME = Set.of(
            "application/pdf", "image/png", "image/jpeg",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel"
    );

    /** Extensions autorisées, cohérentes avec les types MIME acceptés. */
    private static final Set<String> ALLOWED_EXT = Set.of(".pdf", ".png", ".jpg", ".jpeg", ".xlsx", ".xls");

    /** Entités métier pouvant porter des pièces jointes GED (liste blanche anti path-traversal). */
    private static final Set<String> ALLOWED_ENTITES = Set.of(
            "vehicule", "conducteur", "mission", "sinistre", "assurance", "maintenance",
            "panne", "reforme", "infraction", "carburant", "taxe", "visite_technique", "engagement", "budget"
    );

    /** Signatures binaires (magic numbers) des formats acceptés. */
    private static final byte[] MAGIC_PDF = {0x25, 0x50, 0x44, 0x46};            // %PDF
    private static final byte[] MAGIC_PNG = {(byte) 0x89, 0x50, 0x4E, 0x47};     // .PNG
    private static final byte[] MAGIC_JPG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] MAGIC_ZIP = {0x50, 0x4B, 0x03, 0x04};            // XLSX (zip)
    private static final byte[] MAGIC_OLE = {(byte) 0xD0, (byte) 0xCF, 0x11, (byte) 0xE0}; // XLS

    @Transactional
    public DocumentGEDDto uploadDocument(MultipartFile file, String entite, Long entiteId,
                                         String typeDocument, String uploadePar) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Aucun fichier fourni.");
        }
        if (entiteId == null || entiteId <= 0) {
            throw new IllegalArgumentException("Identifiant d'entité invalide.");
        }

        // Liste blanche de l'entité : empêche toute injection de chemin (../, séparateurs, etc.)
        String entiteKey = entite == null ? "" : entite.trim().toLowerCase();
        if (!ALLOWED_ENTITES.contains(entiteKey)) {
            throw new IllegalArgumentException("Entité GED non autorisée : '" + entite + "'.");
        }

        // Validation MIME déclaré
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME.contains(contentType)) {
            throw new IllegalArgumentException(
                "Type de fichier non autorisé: '" + contentType + "'. " +
                "Seuls PDF, PNG, JPG et XLSX sont acceptés."
            );
        }

        // Validation extension + contenu réel (magic number) pour contrer le spoofing MIME
        String extension = getExtension(file.getOriginalFilename()).toLowerCase();
        if (!ALLOWED_EXT.contains(extension)) {
            throw new IllegalArgumentException("Extension de fichier non autorisée : '" + extension + "'.");
        }
        byte[] header = new byte[4];
        int read;
        try (java.io.InputStream in = file.getInputStream()) {
            read = in.read(header);
        }
        if (read < 3 || !matchesMagic(header, contentType)) {
            throw new IllegalArgumentException("Le contenu du fichier ne correspond pas à son type déclaré.");
        }

        // Création du répertoire si nécessaire (racine normalisée + vérification de confinement)
        Path root = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path uploadPath = root.resolve(entiteKey).resolve(String.valueOf(entiteId)).normalize();
        if (!uploadPath.startsWith(root)) {
            throw new IllegalArgumentException("Chemin de stockage invalide.");
        }
        Files.createDirectories(uploadPath);

        // Nom de fichier unique (généré côté serveur : le nom d'origine n'est jamais utilisé sur disque)
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

        DocumentGED saved = documentRepository.save(doc);
        journalService.log("DOCUMENT_GED", "UPLOAD", "DocumentGED", saved.getId(),
                null, "Fichier: " + saved.getNomFichier() + ", Type: " + saved.getTypeDocument() + ", Entité: " + entite + "#" + entiteId, null);
        return mapToDto(saved);
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
        journalService.log("DOCUMENT_GED", "DELETE", "DocumentGED", id,
                doc.getNomFichier(), null, null);
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

    private boolean matchesMagic(byte[] header, String contentType) {
        return switch (contentType) {
            case "application/pdf" -> startsWith(header, MAGIC_PDF);
            case "image/png" -> startsWith(header, MAGIC_PNG);
            case "image/jpeg" -> startsWith(header, MAGIC_JPG);
            case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" -> startsWith(header, MAGIC_ZIP);
            case "application/vnd.ms-excel" -> startsWith(header, MAGIC_OLE) || startsWith(header, MAGIC_ZIP);
            default -> false;
        };
    }

    private boolean startsWith(byte[] data, byte[] prefix) {
        if (data.length < prefix.length) return false;
        for (int i = 0; i < prefix.length; i++) {
            if (data[i] != prefix[i]) return false;
        }
        return true;
    }
}
