package com.dmot.model;

import lombok.Data;

@Data
public class OutreachRequest {
    /** Target company domain, e.g. madonpurefoods.com */
    private String domain;
    /** Optional company name for more accurate search queries */
    private String companyName;
    /** Skip DB cache and re-run full search + verification */
    private boolean skipCache;
}
