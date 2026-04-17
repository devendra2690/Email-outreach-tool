package com.dmot.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "domain_cache")
@Data
public class DomainCache {

    @Id
    private String domain;

    private String mxRecord;
    private boolean catchAll;
    /** Hunter.io or detected common email pattern, e.g. {first}.{last} */
    private String commonPattern;
    private LocalDateTime lastChecked;
    /** Cache entry expires after 7 days to catch MX changes */
    private LocalDateTime expiresAt;
}
