package com.mef.parkauto.security;

import org.springframework.security.crypto.password.PasswordEncoder;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.HexFormat;

public class Sha256PasswordEncoder implements PasswordEncoder {

    private final SecureRandom secureRandom = new SecureRandom();
    private static final int SALT_LENGTH_BYTES = 16;

    @Override
    public String encode(CharSequence rawPassword) {
        if (rawPassword == null) {
            throw new IllegalArgumentException("Password cannot be null");
        }
        byte[] saltBytes = new byte[SALT_LENGTH_BYTES];
        secureRandom.nextBytes(saltBytes);
        String salt = HexFormat.of().formatHex(saltBytes);
        String hash = hashWithSalt(rawPassword.toString(), salt);
        return salt + "$" + hash;
    }

    @Override
    public boolean matches(CharSequence rawPassword, String encodedPassword) {
        if (rawPassword == null || encodedPassword == null) {
            return false;
        }
        int delimiterIndex = encodedPassword.indexOf('$');
        if (delimiterIndex == -1) {
            // Fallback for unsalted password if any exists
            String hash = hashWithSalt(rawPassword.toString(), "");
            return MessageDigest.isEqual(hash.getBytes(), encodedPassword.getBytes());
        }
        String salt = encodedPassword.substring(0, delimiterIndex);
        String storedHash = encodedPassword.substring(delimiterIndex + 1);
        String computedHash = hashWithSalt(rawPassword.toString(), salt);
        return MessageDigest.isEqual(computedHash.getBytes(), storedHash.getBytes());
    }

    private String hashWithSalt(String rawPassword, String salt) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            String input = salt + rawPassword;
            byte[] hashBytes = digest.digest(input.getBytes());
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not found", e);
        }
    }
}
