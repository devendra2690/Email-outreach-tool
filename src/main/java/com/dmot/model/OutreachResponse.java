package com.dmot.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OutreachResponse {
    private String domain;
    private List<DecisionMakerInfo> decisionMakers;
    private List<EmailVerificationResult> verifiedEmails;
    /** Highest-confidence verified email address, null if none found */
    private String bestEmail;
    /** True when the mail server accepts all addresses (results unreliable) */
    private boolean catchAllDomain;
}
