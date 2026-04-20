package com.dmot.model;

import lombok.Data;

@Data
public class OutreachRequest {
    /** Target company domain, e.g. chhedaspecialities.com — used for lead discovery */
    private String domain;
    /**
     * Optional override for the email domain when it differs from the website domain.
     * E.g. website is chhedaspecialities.com but emails live at chhedas.com.
     * Falls back to {@code domain} when not provided.
     */
    private String emailDomain;
    /** Optional company name for more accurate search queries */
    private String companyName;
    /** Skip DB cache and re-run full search + verification */
    private boolean skipCache;
}
