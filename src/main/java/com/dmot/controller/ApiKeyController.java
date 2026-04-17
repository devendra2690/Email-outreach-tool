package com.dmot.controller;

import com.dmot.model.ApiKeyResponse;
import com.dmot.service.ApiKeyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Manage API keys. All endpoints require an existing valid key (or the master key).
 *
 * Usage:
 *   POST   /api/v1/keys          — create a new key (raw value shown only once)
 *   GET    /api/v1/keys          — list all keys (raw values never returned)
 *   DELETE /api/v1/keys/{id}     — revoke a key
 *
 * Bootstrap workflow:
 *   1. Set MASTER_API_KEY env var on the server.
 *   2. Call POST /api/v1/keys with X-Api-Key: <master-key> to mint a personal key.
 *   3. Store the returned rawKey securely; it will not be shown again.
 *   4. Optionally remove MASTER_API_KEY after the first key is created.
 */
@RestController
@RequestMapping("/api/v1/keys")
@RequiredArgsConstructor
public class ApiKeyController {

    private final ApiKeyService apiKeyService;

    /**
     * Create a new API key.
     *
     * Request body: {@code {"name":"my-app"}}
     * Response includes {@code rawKey} — copy it immediately, it is never returned again.
     */
    @PostMapping
    public ResponseEntity<ApiKeyResponse> create(@RequestBody Map<String, String> body) {
        String name = body.getOrDefault("name", "unnamed");
        return ResponseEntity.status(HttpStatus.CREATED).body(apiKeyService.create(name));
    }

    /** List all keys. {@code rawKey} is never included in list responses. */
    @GetMapping
    public ResponseEntity<List<ApiKeyResponse>> listAll() {
        return ResponseEntity.ok(apiKeyService.listAll());
    }

    /** Revoke a key by its numeric ID. The row stays in the DB but {@code active} becomes false. */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> revoke(@PathVariable Long id) {
        apiKeyService.revoke(id);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
    }
}
