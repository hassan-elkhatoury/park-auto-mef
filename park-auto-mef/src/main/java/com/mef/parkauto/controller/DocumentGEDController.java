package com.mef.parkauto.controller;

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
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + meta.getNomFichier() + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        documentService.deleteDocument(id);
        return ResponseEntity.noContent().build();
    }
}
