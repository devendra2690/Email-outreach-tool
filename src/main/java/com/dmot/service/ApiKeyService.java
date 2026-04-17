package com.dmot.service;

import com.dmot.entity.ApiKeyEntity;
import com.dmot.model.ApiKeyResponse;
import com.dmot.repository.ApiKeyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ApiKeyService {

    private final ApiKeyRepository repository;

    /**
     * Bootstrap master key from the MASTER_API_KEY environment variable.
     * Always valid regardless of the database — use this to create the first key.
     * Keep it secret; it cannot be revoked except by changing the env var.
     */
    @Value("${app.security.master-key:}")
    private String masterKey;

    // -------------------------------------------------------------------------
    // Validation
    // -------------------------------------------------------------------------

    public boolean isValid(String rawKey) {
        if (rawKey == null || rawKey.isBlank()) return false;
        // Master key check (constant-time comparison to prevent timing attacks)
        if (!masterKey.isBlank() && constantTimeEquals(rawKey, masterKey)) return true;
        // Database-backed key check
        return repository.findByKeyHashAndActiveTrue(sha256(rawKey)).isPresent();
    }

    /** Called on every authenticated request to keep lastUsedAt current. */
    public void recordUsage(String rawKey) {
        if (!masterKey.isBlank() && constantTimeEquals(rawKey, masterKey)) return; // master key has no DB row
        repository.findByKeyHashAndActiveTrue(sha256(rawKey)).ifPresent(k -> {
            k.setLastUsedAt(LocalDateTime.now());
            repository.save(k);
        });
    }

    // -------------------------------------------------------------------------
    // CRUD
    // -------------------------------------------------------------------------

    /**
     * Generate a new API key.
     * The raw key is returned ONCE in the response and is never stored — only its hash is persisted.
     */
    public ApiKeyResponse create(String name) {
        String raw    = "dmot_" + HexFormat.of().formatHex(secureBytes(32));
        String hash   = sha256(raw);
        String prefix = raw.substring(0, 13); // "dmot_" + 8 hex chars

        ApiKeyEntity entity = new ApiKeyEntity();
        entity.setName(name);
        entity.setKeyHash(hash);
        entity.setKeyPrefix(prefix);
        entity.setActive(true);
        repository.save(entity);

        log.info("Created API key '{}' (prefix: {})", name, prefix);

        return ApiKeyResponse.builder()
                .id(entity.getId())
                .name(name)
                .keyPrefix(prefix)
                .active(true)
                .createdAt(entity.getCreatedAt())
                .rawKey(raw) // only time this is exposed
                .build();
    }

    public List<ApiKeyResponse> listAll() {
        return repository.findAll().stream()
                .map(k -> ApiKeyResponse.builder()
                        .id(k.getId())
                        .name(k.getName())
                        .keyPrefix(k.getKeyPrefix())
                        .active(k.isActive())
                        .createdAt(k.getCreatedAt())
                        .lastUsedAt(k.getLastUsedAt())
                        .build())
                .toList();
    }

    public void revoke(Long id) {
        repository.findById(id).ifPresentOrElse(k -> {
            k.setActive(false);
            repository.save(k);
            log.info("Revoked API key id={} name='{}'", id, k.getName());
        }, () -> {
            throw new IllegalArgumentException("API key not found: " + id);
        });
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    private byte[] secureBytes(int length) {
        byte[] bytes = new byte[length];
        new SecureRandom().nextBytes(bytes);
        return bytes;
    }

    /** Constant-time string comparison to prevent timing-based key enumeration. */
    private boolean constantTimeEquals(String a, String b) {
        byte[] aBytes = a.getBytes(StandardCharsets.UTF_8);
        byte[] bBytes = b.getBytes(StandardCharsets.UTF_8);
        if (aBytes.length != bBytes.length) return false;
        int result = 0;
        for (int i = 0; i < aBytes.length; i++) {
            result |= aBytes[i] ^ bBytes[i];
        }
        return result == 0;
    }
}
