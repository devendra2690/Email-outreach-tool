package com.dmot.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EmailVerificationResult {

    private String email;
    private VerificationStatus status;
    private String smtpResponse;
    private boolean catchAll;
    private String mxRecord;

    public enum VerificationStatus {
        /** SMTP RCPT TO returned 250 and domain is not catch-all */
        VALID,
        /** SMTP returned 5xx permanent rejection */
        INVALID,
        /** Domain accepts all addresses (catch-all server) */
        CATCH_ALL,
        /** Temporary SMTP error or server refused connection */
        UNVERIFIABLE,
        /** Socket/read timed out */
        TIMEOUT
    }
}
