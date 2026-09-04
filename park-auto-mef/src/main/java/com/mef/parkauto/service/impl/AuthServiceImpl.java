package com.mef.parkauto.service.impl;

import com.mef.parkauto.dto.auth.LoginRequest;
import com.mef.parkauto.dto.auth.LoginResponse;
import com.mef.parkauto.dto.auth.RefreshTokenRequest;
import com.mef.parkauto.dto.auth.RegisterRequest;
import com.mef.parkauto.dto.auth.ChangePasswordRequest;
import com.mef.parkauto.dto.auth.UpdatePhotoRequest;
import com.mef.parkauto.dto.auth.UpdateProfilRequest;
import com.mef.parkauto.dto.user.UtilisateurResponse;
import com.mef.parkauto.entity.Utilisateur;
import com.mef.parkauto.exception.BadRequestException;
import com.mef.parkauto.exception.ResourceNotFoundException;
import com.mef.parkauto.exception.UnauthorizedException;
import com.mef.parkauto.mapper.UtilisateurMapper;
import com.mef.parkauto.repository.UtilisateurRepository;
import com.mef.parkauto.security.JwtService;
import com.mef.parkauto.service.AuthService;
import com.mef.parkauto.service.JournalService;
import com.mef.parkauto.service.UtilisateurService;
import com.mef.parkauto.util.AppConstants;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Implémentation du service {@link AuthService} d'authentification.
 */
@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UtilisateurService utilisateurService;
    private final UtilisateurRepository utilisateurRepository;
    private final UtilisateurMapper utilisateurMapper;
    private final PasswordEncoder passwordEncoder;
    private final JournalService journalService;
    private final HttpServletRequest httpServletRequest;

    @Value("${app.ged.upload-dir:./uploads}")
    private String uploadDir;

    private static final String PHOTO_API_PREFIX = "/api/auth/photos/";
    private static final Pattern PRESET_PHOTO = Pattern.compile(
            "^/assets/portraits/[A-Za-z0-9._-]+\\.(jpg|jpeg|png|webp)$"
    );
    private static final Set<String> ALLOWED_PHOTO_MIME = Set.of(
            "image/jpeg", "image/png", "image/webp"
    );
    private static final long MAX_PHOTO_BYTES = 1_000_000L;
    private static final byte[] MAGIC_PNG = {(byte) 0x89, 0x50, 0x4E, 0x47};
    private static final byte[] MAGIC_JPG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] MAGIC_WEBP_RIFF = {0x52, 0x49, 0x46, 0x46};

    @Override
    public LoginResponse login(LoginRequest request) {
        log.info("Tentative de connexion de l'utilisateur : {}", request.email());

        // Check if user exists and is active before authenticating
        Utilisateur existingUser = utilisateurRepository.findByEmail(request.email()).orElse(null);
        if (existingUser != null && existingUser.getStatut() == com.mef.parkauto.entity.UserStatus.INACTIVE) {
            log.warn("Tentative de connexion sur un compte désactivé : {}", request.email());
            throw new UnauthorizedException("Ce compte agent est désactivé. Accès refusé par l'Administrateur MEF.");
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.motDePasse())
            );

            Utilisateur principal = (Utilisateur) authentication.getPrincipal();
            Utilisateur user = utilisateurRepository.findById(principal.getId()).orElse(principal);

            String accessToken = jwtService.generateAccessToken(user);
            String refreshToken = jwtService.generateRefreshToken(user);

            UtilisateurResponse userResponse = utilisateurMapper.toResponse(user);

            // Log l'action dans le journal d'audit
            journalService.log(
                    AppConstants.MODULE_AUTH,
                    AppConstants.ACTION_LOGIN,
                    "Utilisateur",
                    user.getId(),
                    null,
                    "Connexion réussie",
                    httpServletRequest.getRemoteAddr()
            );

            log.info("Connexion réussie pour l'utilisateur : {}", request.email());
            return new LoginResponse(accessToken, refreshToken, userResponse);

        } catch (UnauthorizedException ue) {
            throw ue;
        } catch (Exception e) {
            log.error("Échec de connexion détaillé pour l'utilisateur {} : ", request.email(), e);
            throw new UnauthorizedException("Adresse email ou mot de passe incorrect");
        }
    }

    @Override
    public UtilisateurResponse register(RegisterRequest request) {
        log.info("Inscription d'un nouvel utilisateur : {}", request.email());
        return utilisateurService.create(request);
    }

    @Override
    public LoginResponse refreshToken(RefreshTokenRequest request) {
        String token = request.refreshToken();
        String email = jwtService.extractUsername(token);

        if (email != null) {
            Utilisateur user = utilisateurRepository.findByEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

            // Seul un token de type "refresh" (non révoqué, compte actif) est accepté ici
            if (jwtService.isRefreshTokenValid(token, user)) {
                // Rotation : l'ancien refresh token est révoqué (usage unique)
                jwtService.revoke(token);
                String accessToken = jwtService.generateAccessToken(user);
                String newRefreshToken = jwtService.generateRefreshToken(user);
                UtilisateurResponse userResponse = utilisateurMapper.toResponse(user);

                log.info("Mise à jour des tokens JWT pour l'utilisateur : {}", email);
                return new LoginResponse(accessToken, newRefreshToken, userResponse);
            }
        }
        
        log.warn("Tentative de rafraîchissement avec un token invalide");
        throw new UnauthorizedException("Token de rafraîchissement invalide ou expiré");
    }

    @Override
    public void logout(String accessToken, String refreshToken) {
        if (accessToken != null && !accessToken.isBlank()) {
            jwtService.revoke(accessToken);
        }
        if (refreshToken != null && !refreshToken.isBlank()) {
            jwtService.revoke(refreshToken);
        }
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Utilisateur user) {
            journalService.log(AppConstants.MODULE_AUTH, "LOGOUT", "Utilisateur", user.getId(),
                    null, "Déconnexion — tokens révoqués", httpServletRequest.getRemoteAddr());
        }
        SecurityContextHolder.clearContext();
    }

    @Override
    @Transactional(readOnly = true)
    public UtilisateurResponse getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated() || 
                "anonymousUser".equals(authentication.getPrincipal())) {
            throw new UnauthorizedException("Aucun utilisateur connecté");
        }

        String email = authentication.getName();
        Utilisateur user = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        return utilisateurMapper.toResponse(user);
    }

    @Override
    public void changerMotDePasse(ChangePasswordRequest request) {
        log.info("Changement de mot de passe demandé");

        UtilisateurResponse currentUser = getCurrentUser();
        Utilisateur user = utilisateurRepository.findById(currentUser.id())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        // Vérification de l'ancien mot de passe
        if (!passwordEncoder.matches(request.ancienMotDePasse(), user.getMotDePasse())) {
            throw new UnauthorizedException("L'ancien mot de passe est incorrect");
        }

        // Encodage du nouveau mot de passe (le custom encoder va générer un nouveau sel)
        String encoded = passwordEncoder.encode(request.nouveauMotDePasse());
        String[] parts = encoded.split("\\$");
        user.setSel(parts[0]);
        user.setMotDePasse(encoded);
        user.setDoitChangerMotDePasse(false); // Le mot de passe a été changé

        utilisateurRepository.save(user);

        // Audit log
        journalService.log(
                AppConstants.MODULE_AUTH,
                "CHANGE_PASSWORD",
                "Utilisateur",
                user.getId(),
                "doitChangerMotDePasse: true",
                "doitChangerMotDePasse: false",
                httpServletRequest.getRemoteAddr()
        );
        log.info("Mot de passe mis à jour avec succès pour : {}", user.getEmail());
    }

    @Override
    public UtilisateurResponse updateCurrentProfile(UpdateProfilRequest request) {
        UtilisateurResponse current = getCurrentUser();
        Utilisateur user = utilisateurRepository.findById(current.id())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        String oldValue = user.getPrenom() + " " + user.getNom() + " / " + (user.getTelephone() != null ? user.getTelephone() : "");
        user.setNom(request.nom().trim());
        user.setPrenom(request.prenom().trim());
        String phone = request.telephone() == null ? null : request.telephone().trim();
        user.setTelephone(phone == null || phone.isBlank() ? null : phone);

        Utilisateur saved = utilisateurRepository.save(user);
        String newValue = saved.getPrenom() + " " + saved.getNom() + " / " + (saved.getTelephone() != null ? saved.getTelephone() : "");

        journalService.log(
                AppConstants.MODULE_UTILISATEUR,
                AppConstants.ACTION_UPDATE,
                "Utilisateur",
                saved.getId(),
                oldValue,
                newValue,
                httpServletRequest.getRemoteAddr()
        );
        log.info("Profil mis à jour pour : {}", saved.getEmail());
        return utilisateurMapper.toResponse(saved);
    }

    @Override
    public UtilisateurResponse updateCurrentPhoto(UpdatePhotoRequest request) {
        String photoUrl = request.photoUrl() == null ? "" : request.photoUrl().trim();
        if (photoUrl.startsWith("data:")) {
            throw new BadRequestException("Les images personnalisées doivent être envoyées en fichier, pas en data URL.");
        }
        if (!PRESET_PHOTO.matcher(photoUrl).matches()) {
            throw new BadRequestException("Seuls les portraits officiels MEF (/assets/portraits/...) sont acceptés.");
        }

        Utilisateur user = requireCurrentUser();
        String oldValue = user.getPhotoUrl();
        deleteStoredAvatarFiles(user.getId());
        user.setPhotoUrl(photoUrl);
        Utilisateur saved = utilisateurRepository.save(user);

        journalService.log(
                AppConstants.MODULE_UTILISATEUR,
                AppConstants.ACTION_UPDATE,
                "Utilisateur",
                saved.getId(),
                oldValue,
                saved.getPhotoUrl(),
                httpServletRequest.getRemoteAddr()
        );
        log.info("Photo de profil (portrait) mise à jour pour : {}", saved.getEmail());
        return utilisateurMapper.toResponse(saved);
    }

    @Override
    public UtilisateurResponse updateCurrentPhotoFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Aucun fichier fourni.");
        }
        if (file.getSize() > MAX_PHOTO_BYTES) {
            throw new BadRequestException("La photo ne peut pas dépasser 1 Mo.");
        }

        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!ALLOWED_PHOTO_MIME.contains(contentType)) {
            throw new BadRequestException("Type de fichier non autorisé. Utilisez JPEG, PNG ou WebP.");
        }

        byte[] header = new byte[12];
        int read;
        try (InputStream in = file.getInputStream()) {
            read = in.read(header);
        } catch (IOException e) {
            throw new BadRequestException("Impossible de lire le fichier image.");
        }
        if (read < 3 || !matchesPhotoMagic(header, contentType)) {
            throw new BadRequestException("Le contenu du fichier ne correspond pas à une image valide.");
        }

        Utilisateur user = requireCurrentUser();
        String ext = switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };

        try {
            Path dir = avatarDir(user.getId());
            Files.createDirectories(dir);
            deleteFilesIn(dir);
            Path target = dir.resolve("avatar" + ext);
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            log.error("Erreur de stockage de la photo pour {} : {}", user.getEmail(), e.getMessage());
            throw new IllegalStateException("Impossible d'enregistrer la photo de profil.");
        }

        String oldValue = user.getPhotoUrl();
        user.setPhotoUrl(PHOTO_API_PREFIX + user.getId());
        Utilisateur saved = utilisateurRepository.save(user);

        journalService.log(
                AppConstants.MODULE_UTILISATEUR,
                AppConstants.ACTION_UPDATE,
                "Utilisateur",
                saved.getId(),
                oldValue,
                saved.getPhotoUrl(),
                httpServletRequest.getRemoteAddr()
        );
        log.info("Photo de profil (upload) enregistrée pour : {}", saved.getEmail());
        return utilisateurMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PhotoFile getPhotoFile(Long userId) {
        if (userId == null || userId <= 0) {
            throw new BadRequestException("Identifiant utilisateur invalide.");
        }
        Utilisateur user = utilisateurRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        String stored = user.getPhotoUrl();
        if (stored == null || !stored.startsWith(PHOTO_API_PREFIX)) {
            throw new ResourceNotFoundException("Aucune photo uploadée pour cet utilisateur");
        }

        Path file = findStoredAvatarFile(userId);
        try {
            Resource resource = new UrlResource(file.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ResourceNotFoundException("Fichier photo introuvable");
            }
            String filename = file.getFileName().toString().toLowerCase(Locale.ROOT);
            MediaType mediaType = filename.endsWith(".png") ? MediaType.IMAGE_PNG
                    : filename.endsWith(".webp") ? MediaType.parseMediaType("image/webp")
                    : MediaType.IMAGE_JPEG;
            return new PhotoFile(resource, mediaType, file.getFileName().toString());
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            throw new ResourceNotFoundException("Fichier photo introuvable");
        }
    }

    private Utilisateur requireCurrentUser() {
        UtilisateurResponse current = getCurrentUser();
        return utilisateurRepository.findById(current.id())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));
    }

    private Path avatarRoot() {
        return Paths.get(uploadDir).toAbsolutePath().normalize().resolve("avatars").normalize();
    }

    private Path avatarDir(Long userId) {
        Path root = avatarRoot();
        Path dir = root.resolve(String.valueOf(userId)).normalize();
        if (!dir.startsWith(root)) {
            throw new BadRequestException("Chemin de stockage invalide.");
        }
        return dir;
    }

    private Path findStoredAvatarFile(Long userId) {
        Path dir = avatarDir(userId);
        if (!Files.isDirectory(dir)) {
            throw new ResourceNotFoundException("Fichier photo introuvable");
        }
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(dir)) {
            for (Path path : stream) {
                if (Files.isRegularFile(path) && path.getFileName().toString().startsWith("avatar")) {
                    Path root = avatarRoot();
                    Path normalized = path.toAbsolutePath().normalize();
                    if (!normalized.startsWith(root)) {
                        throw new ResourceNotFoundException("Fichier photo introuvable");
                    }
                    return normalized;
                }
            }
        } catch (IOException e) {
            throw new ResourceNotFoundException("Fichier photo introuvable");
        }
        throw new ResourceNotFoundException("Fichier photo introuvable");
    }

    private void deleteStoredAvatarFiles(Long userId) {
        Path dir = avatarDir(userId);
        if (!Files.isDirectory(dir)) {
            return;
        }
        deleteFilesIn(dir);
    }

    private void deleteFilesIn(Path dir) {
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(dir)) {
            for (Path path : stream) {
                try {
                    Files.deleteIfExists(path);
                } catch (IOException e) {
                    log.warn("Impossible de supprimer l'ancienne photo : {}", path);
                }
            }
        } catch (IOException e) {
            log.warn("Impossible de lister le dossier avatar : {}", dir);
        }
    }

    private boolean matchesPhotoMagic(byte[] header, String contentType) {
        return switch (contentType) {
            case "image/png" -> startsWith(header, MAGIC_PNG);
            case "image/jpeg" -> startsWith(header, MAGIC_JPG);
            case "image/webp" -> startsWith(header, MAGIC_WEBP_RIFF)
                    && header.length >= 12
                    && header[8] == 'W' && header[9] == 'E' && header[10] == 'B' && header[11] == 'P';
            default -> false;
        };
    }

    private boolean startsWith(byte[] data, byte[] prefix) {
        if (data.length < prefix.length) {
            return false;
        }
        for (int i = 0; i < prefix.length; i++) {
            if (data[i] != prefix[i]) {
                return false;
            }
        }
        return true;
    }
}
