package com.dmot.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiKeyResponse {
    private Long id;
    private String name;
    /** Safe prefix for identifying the key (e.g. "dmot_a1b2c3d4") */
    private String keyPrefix;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime lastUsedAt;
    /** Only populated once on creation — never returned again */
    private String rawKey;
}
