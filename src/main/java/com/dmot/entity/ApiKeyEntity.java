package com.dmot.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "api_keys")
@Data
public class ApiKeyEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    /** SHA-256 hex hash of the raw key — never store the raw value */
    @Column(name = "key_hash", nullable = false, unique = true)
    private String keyHash;

    /** First 8 chars of the raw key for human identification (safe to display) */
    @Column(name = "key_prefix", nullable = false, length = 16)
    private String keyPrefix;

    private boolean active;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime lastUsedAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
