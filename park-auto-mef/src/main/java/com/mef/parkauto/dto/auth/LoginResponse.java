package com.mef.parkauto.dto.auth;

import com.mef.parkauto.dto.user.UtilisateurResponse;

public record LoginResponse(
        String accessToken,
        String refreshToken,
        UtilisateurResponse utilisateur
) {
}
